# 표준코드(std-codes) — DW_STD_CODE 관리

`DW_STD_CODE`는 시스템 전역에서 쓰는 **계층형 표준코드**(제품라인·시장·속도기호·
레이디얼/바이어스 등)의 단일 출처다. 드롭다운 참조 데이터로 소비되며, 관리자는
**접근 권한 관리 > 표준코드 관리** 화면에서 트리 형태로 직접 입력·수정·정렬한다.

- 백엔드: [`std-codes.service.ts`](./std-codes.service.ts) · [`std-codes.controller.ts`](./std-codes.controller.ts)
- 엔티티: [`entities/std-code.entity.ts`](./entities/std-code.entity.ts)
- 프론트: [`apps/web/src/pages/admin/std-codes.tsx`](../../../web/src/pages/admin/std-codes.tsx) ·
  [`StdCodeEditModal.tsx`](../../../web/src/components/StdCodeEditModal.tsx)

## 1. 스키마와 계층 모델

PK는 **`(CODE_GRP_ID, CODE_LVL, CODE_CD)`** 다. 계층은 `PARENT_CD`(부모의 `CODE_CD`)와
`CODE_LVL`(깊이, 루트=1)로 표현한다. 한 노드의 자식 = `parentCd = 부모.codeCd` 이고
`codeLvl = 부모.codeLvl + 1` 인 행들.

| 컬럼 | 용도 |
| --- | --- |
| `CODE_GRP_ID` (PK) | 코드 그룹(예: `PRODUCT_LINE`) |
| `CODE_GRP_NM` | 그룹명(그룹 전체 공통) |
| `CODE_LVL` (PK) | 계층 깊이(루트 1) |
| `PARENT_CD` | 부모 `CODE_CD`(루트는 NULL) |
| `CODE_CD` (PK) | 코드값 — 다른 데이터가 값으로 참조하는 **식별자(불변 취급)** |
| `CODE_NM` / `CODE_DESC` | 코드명 / 설명 |
| `ATTR1~3_VAL/NM/DESC` | 코드별 부가 속성 3슬롯(값/명/설명) |
| `USE_YN` | 사용 여부('Y'/'N') — 삭제는 소프트 삭제 |
| `SORT_ORDER` | 형제 내 정렬(작을수록 먼저) |
| `REG_DTM` / `UPD_DTM` | 생성/수정 시각 |

> DDL은 베이스라인 [`1781913600000-BaselineAppSchema`](../database/migrations/1781913600000-BaselineAppSchema.ts)에
> 이미 존재한다. 본 기능은 엔티티 매핑 확장 + 서비스/컨트롤러 추가뿐이라 **별도 마이그레이션이 없다.**

## 2. API

읽기(드롭다운)용 1개는 인증 사용자 누구나, 나머지 관리 엔드포인트는
`@RequirePermission('admin', …)`로 보호된다(표준코드 관리는 admin 모듈 하위 탭이라
admin 권한을 재사용).

| 메서드·경로 | 권한 | 설명 |
| --- | --- | --- |
| `GET /std-codes?grpId=&level=` | 인증 | 드롭다운 참조. `USE_YN='Y'`만, `level`이면 `CODE_LVL ≤ level`. (기존 호환) |
| `GET /std-codes/groups` | admin/view | 그룹 목록(그룹명 + 코드 수) — 좌측 패널 |
| `GET /std-codes/tree?grpId=` | admin/view | 그룹 전체 코드(모든 레벨·`USE_YN` 무관)를 `PARENT_CD` 중첩 트리로 |
| `POST /std-codes` | admin/create | 코드 생성. `parentCd`가 있으면 `CODE_LVL=부모+1`, 없으면 루트(1). PK 중복 검증 |
| `PATCH /std-codes/:grpId/:lvl/:cd` | admin/update | 속성 수정(NM/DESC/ATTR/SORT/USE_YN). `CODE_GRP_NM`은 그룹 전체 일괄 |
| `PATCH /std-codes/:grpId/:lvl/:cd/move` | admin/update | 트리 이동/정렬(아래 3절) |
| `DELETE /std-codes/:grpId/:lvl/:cd` | admin/delete | 소프트 삭제(`USE_YN='N'`). 하위 코드가 있으면 거부 |

모든 쓰기 경로는 `STD_CODE` 엔티티 타입으로 감사 로그(`source='ADMIN'`)를 남긴다.
편집 거버넌스는 **관리자 직접 편집(즉시 반영)** — 시험항목과 달리 승인 워크플로를 타지 않는다.

## 3. 이동/정렬(move) 연산

[`StdCodesService.move()`](./std-codes.service.ts) 하나가 **재부모화 + 형제 정렬**을 동시에
처리한다. 바디는 `{ newParentCd?, beforeCd? }`:

- `newParentCd` 생략 → 루트(`CODE_LVL=1`)로 이동. `beforeCd` 생략 → 형제 맨 뒤.
- 새 레벨 `newLvl = 부모.codeLvl + 1`. 이동 노드의 **서브트리 전체 `CODE_LVL`이 같은 delta만큼 시프트**된다.

`CODE_LVL`이 PK의 일부라 레벨 변경은 단순 UPDATE가 아니라 **트랜잭션 내에서 서브트리를
삭제 후 시프트된 레벨로 재삽입**한다(서브트리 내부 transient PK 충돌을 원천 차단).
검증:

- **순환 방지** — 자기 자신/하위 코드 아래로의 이동 거부.
- **충돌 검사** — 시프트 후 위치가 서브트리 밖의 기존 코드와 PK 충돌하면 거부.
- 마지막에 대상 형제 그룹의 `SORT_ORDER`를 `beforeCd` 기준으로 0,10,20…으로 재부여.

> `CODE_CD`(코드값)는 변경하지 않는다 — 식별자이자 다른 데이터의 사실상 FK이기 때문.
> 코드값 자체를 바꿔야 하면 삭제 후 재생성한다.

## 4. 관리 화면(프론트) 기능

[`std-codes.tsx`](../../../web/src/pages/admin/std-codes.tsx)는 좌(그룹 목록) · 우(코드 트리)
마스터-디테일이다. 트리 행 액션: **하위코드 추가 · 복제 · 수정 · 삭제**.

- **다단 트리** — 펼침/접기, `L레벨` 배지, 미사용 코드는 취소선 + "미사용" 배지.
- **드래그&드롭** — 네이티브 HTML5 DnD. 행 상단 30%=앞(형제), 중앙=안(자식), 하단 30%=뒤(형제)로
  드롭. `into`=재부모화, `before/after`=형제 정렬. 자기 서브트리로의 드롭은 클라이언트+서버 차단.
- **트리 검색** — 코드·명·설명·ATTR값 매칭. 매칭 노드는 **하위 트리 전체**를 함께 노출하고,
  비매칭은 매칭 경로(조상)만 유지. 매칭 조상은 자동 펼침.
- **모두 펼치기/접기 · 미사용 숨김** 토글. (검색/숨김 등 필터 활성 중엔 위치가 부분적이라
  드래그 정렬을 일시 비활성화)
- **ATTR 값 칩** — `ATTR1~3_VAL`을 행에 칩으로 표시(있을 때만), hover 시 `명 — 설명` 툴팁.
- **인라인 코드명 편집** — `CODE_NM` 더블클릭 → 인라인 입력(Enter 저장 / Esc 취소). 낙관적 반영으로
  펼침·스크롤 유지.
- **복제** — 기존 코드를 원본으로 같은 레벨 형제 추가. `CODE_CD`만 비우고 나머지(명/설명/ATTR/
  정렬/사용여부)를 프리필.
- **펼침 상태 유지** — 그룹별 펼침 상태를 `localStorage`(`stdcode.expanded.<grpId>`)에 보존,
  그룹 전환·새로고침 후 복원.
- 편집 성공 시 [`invalidateStdCodes()`](../../../web/src/api/stdCodes.ts)로 드롭다운 캐시를 무효화한다.

## 5. 비고 — 재료 사양(material-specs) 메뉴 제거

표준코드 관리 도입과 함께 미사용 placeholder였던 `material-specs` 사이드바 모듈을 제거했다.
`MENUS`에서 빼고, 시드([`seed-auth.cjs`](../../scripts/seed-auth.cjs))의 `OBSOLETE_MENU_IDS`
정리 스텝이 라이브 DB의 메뉴를 `USE_YN='N'`으로 비활성화하고 관련 권한 행을 삭제한다
(MERGE는 삭제를 못 하므로 별도 정리). 시드 재실행으로 적용한다.

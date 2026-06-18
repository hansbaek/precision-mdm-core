# 데이터베이스 마이그레이션

TypeORM 마이그레이션으로 **앱 소유 스키마**를 버전 관리한다. `synchronize`는
항상 `false`이며, 스키마 변경은 반드시 새 마이그레이션 파일로 추가한다
(베이스라인을 수정하지 말 것).

## 명령어 (apps/api 에서 실행, `.env` 필요)

```bash
pnpm migration:show      # 적용/대기 목록
pnpm migration:run       # 대기 마이그레이션 적용
pnpm migration:revert    # 마지막 마이그레이션 되돌리기
pnpm migration:generate src/database/migrations/<Name>   # 엔티티 diff 자동 생성
pnpm migration:create   src/database/migrations/<Name>   # 빈 마이그레이션 생성
```

개발/운영 구분은 코드 분기가 아니라 **어느 `.env`(접속 정보)를 두느냐**로
결정된다. `migration:run`은 `.env`가 가리키는 DB에 적용된다.

## 테이블 소유권

- **앱 소유(마이그레이션 관리)**: `TMDM_ROLE`, `TMDM_USER`, `TMDM_MENU`,
  `TMDM_ROLE_MENU_PERM`, `TMDM_NOTIFICATION`, `TMDM_CHANGE_REQUEST`,
  `DW_STD_CODE`, `TEMPLATE_STD_TEST_ITEM`, 시퀀스 `SEQ_TEMPLATE_STD_TEST_ITEM`.
- **외부 관리(마이그레이션 금지 — 운영에 이미 존재)**: `DRW_PARAM_INFO`,
  `DW_HNT_CLASSIFICATION`, `DW_SPEC_PLM_TIRE`, `PTBSPEC`, `PTBSPECITEM`,
  `T_IF_GC_MAND_TEST_INFO_4_IPLM`, `V_MCODE_INFO_4_HINT`,
  `V_PIC_MATTR_MDPT_INFO_4_HINT`. 이 테이블들은 베이스라인/마이그레이션에서
  생성·변경하지 않는다.

## 베이스라인

`1781913600000-BaselineAppSchema`는 개발 DB 실제 DDL에서 추출한 현재 스키마
스냅샷이다. 멱등(USER_TABLES/USER_INDEXES/USER_SEQUENCES 존재검사)이라 이미
객체가 있는 DB에서는 no-op이고, 빈 운영 DB에서는 전체를 신규 생성한다.
시드 데이터(역할/메뉴/권한/admin)는 `scripts/seed-auth.cjs`가 담당한다.

> 추적 테이블: `TMDM_MIGRATIONS`. 과거 수동 SQL은 `apps/api/db/`에 남아 있으며
> 베이스라인에 이미 반영되어 있다(참고용).

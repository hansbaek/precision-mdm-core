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

## 배포 절차 (중요)

런타임은 마이그레이션을 **자동 적용하지 않는다**(`migrationsRun` 미설정,
`synchronize: false`). 따라서 새 마이그레이션이 포함된 코드를 배포할 때는
**앱을 올리기 전에 반드시 `migration:run`을 먼저 실행**해야 한다. 이 순서를
지키지 않으면 DB 스키마가 코드와 어긋나 *특정 쓰기만 조용히 실패*하는 사고가
난다(예: 엔티티에 새 컬럼이 있는데 DB엔 없어 INSERT가 ORA-00904로 실패).

```bash
cd apps/api
pnpm migration:show     # 1) 대기 마이그레이션 확인 ([ ] 표시가 미적용)
pnpm migration:run      # 2) 적용
# 3) 그 다음에 앱(start:prod) 기동
```

### 부팅 시 마이그레이션 가드

위 실수를 구조적으로 막기 위해, 앱은 부팅 시 미적용 마이그레이션을 점검한다
(`src/database/migration-guard.ts`, `main.ts`에서 호출).

| 모드 | 동작 | 적용 기본값 |
| --- | --- | --- |
| `strict` | 미적용이 있으면 에러 로그 후 **부팅 중단**(exit 1) | `NODE_ENV=production` |
| `warn` | 경고만 남기고 계속 | 그 외(개발) |
| `off` | 점검 자체를 생략 | — |

- 환경변수 `MIGRATION_GUARD=strict|warn|off`로 강제 지정 가능(긴급 시 `off`).
- 점검 실패(추적 테이블 부재·DB 접속 실패 등)도 `strict`에서는 보수적으로
  부팅을 중단한다.
- **운영에서 부팅이 "Pending database migrations detected"로 중단되면**, 그건
  버그가 아니라 의도된 가드다 — `migration:run`을 실행한 뒤 다시 기동한다.

## 테이블 소유권

- **앱 소유(마이그레이션 관리)**: `TMDM_ROLE`, `TMDM_USER`, `TMDM_MENU`,
  `TMDM_ROLE_MENU_PERM`, `TMDM_NOTIFICATION`, `TMDM_CHANGE_REQUEST`,
  `TMDM_REFRESH_TOKEN`, `DW_STD_CODE`, `TEMPLATE_STD_TEST_ITEM`,
  시퀀스 `SEQ_TEMPLATE_STD_TEST_ITEM`.
  - `DW_STD_CODE`는 계층형 표준코드로, 관리자 화면에서 CRUD/이동한다 →
    [`std-codes/README.md`](../std-codes/README.md).
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

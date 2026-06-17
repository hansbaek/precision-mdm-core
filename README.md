# T:MDM 모노레포 (Monorepo)

이 저장소는 `pnpm workspaces`를 사용하는 모노레포로 구성되어 있습니다.

## 프로젝트 구조

```text
apps/
  web/        # React + TypeScript + Vite 프론트엔드 애플리케이션
  api/        # NestJS 백엔드 API 애플리케이션
packages/    # 공통 공유 패키지가 위치할 디렉토리
```

## 패키지 매니저

Corepack을 통해 pnpm을 사용합니다. pnpm 버전은 루트 `package.json` 파일에 고정되어 있습니다.

```bash
corepack enable
pnpm install
```

CI 환경 또는 재현 가능한 의존성 설치가 필요할 때는 다음 명령어를 사용하십시오.

```bash
pnpm install --frozen-lockfile
```

이 저장소는 `.npmrc` 파일의 `node-linker=isolated` 설정을 통해 pnpm의 동작 방식을 제한합니다.

```text
node-linker=isolated
```

이 설정은 Nest CLI가 모노레포 환경에서 의존성 호이스팅(Hoisting) 문제로 인해 발생하는 빌드/실행 이슈를 방지하기 위해 필수적입니다.

## 애플리케이션 구성

### Web (프론트엔드)

- 위치: `apps/web`
- 기술 스택: React, TypeScript, Vite
- 기본 개발 서버 포트: `3000`

### API (백엔드)

- 위치: `apps/api`
- 기술 스택: NestJS 11, TypeORM, `oracledb`, Oracle Database 19c
- 기본 API 서버 포트: `4000`
- Swagger 문서 주소: `http://localhost:4000/docs`
- 헬스 체크 엔드포인트: `http://localhost:4000/health`

백엔드 API는 환경 변수(`DB_*` 접두사)를 사용하여 Oracle 19c 데이터베이스에 연결하도록 구성되어 있습니다. 실제 데이터베이스 자격 증명은 Git에서 제외된 `apps/api/.env` 파일에 기록해야 합니다. 템플릿으로 `apps/api/.env.example` 파일을 참조하십시오.

필수 Oracle 데이터베이스 환경 변수:

```env
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE_NAME=xepdb1
DB_USERNAME=app_user
DB_PASSWORD=change_me
```

`DB_SID` 또는 `DB_CONNECT_STRING` 설정을 통한 대체 연결 방식도 지원합니다.

## 공통 명령어

루트 경로에서 다음 스크립트를 통해 각 앱을 조작할 수 있습니다 (Turborepo 적용).

```bash
pnpm dev        # web 애플리케이션 개발 서버 실행 (3000 포트)
pnpm build      # web 애플리케이션 빌드
pnpm lint       # web 애플리케이션 ESLint 검사
pnpm preview    # web 프로덕션 빌드 결과물 미리보기
pnpm api:dev    # api 애플리케이션 watch 모드 실행 (4000 포트)
pnpm api:build  # api 애플리케이션 빌드
pnpm api:lint   # api 애플리케이션 ESLint 검사
pnpm api:test   # api 애플리케이션 테스트 실행
```

특정 워크스페이스 타겟 명령어도 별칭으로 정의되어 있습니다 (예: `pnpm web:dev`, `pnpm web:build`, `pnpm api:build`).

## 주요 기능 (개발 현황)

### 1. STD 시험 항목 마스터 관리 (`TEMPLATE_STD_TEST_ITEM`)

시험 기준 템플릿(제품라인·시험항목/방법/조건·38개 마켓 플래그·치수/구조 조건 등)을 관리합니다.

- 백엔드: `apps/api/src/template` — 목록/상세/생성/수정/삭제, Excel 업로드(미리보기·적용), 통계
- 프런트: `Dashboard` 탭 — 테이블·필터·생성/수정 모달, 법규 기반 가혹도(`ENDUR_SVRTY`)·인증유형(`CERTI_TYPE`) 자동 제안

### 2. mcode 기반 필요 시험 매칭 (`test-match`)

제품코드(mcode)를 입력하면 해당 타이어의 속성을 도출해 `TEMPLATE_STD_TEST_ITEM`의 조건과
대조하고, 수행해야 할 시험 목록을 표시합니다.

- 백엔드: `apps/api/src/test-match`
- 프런트: 헤더 **"필요시험조회"** 탭 (`apps/web/src/pages/test-match-page.tsx`)

#### API 엔드포인트

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| `GET` | `/test-match?mcode=<mcode>` | 필요 시험 목록 (타이어 속성 + 매칭 결과 + 미평가 조건) |
| `GET` | `/test-match/tire?mcode=<mcode>` | 타이어 정규화 속성만 반환 (디버그/검증용) |

타이어 속성 소스: `V_MCODE_INFO_4_HINT`(m)을 기준으로 `V_PIC_MATTR_MDPT_INFO_4_HINT`(md),
`DRW_PARAM_INFO`(p)를 **LEFT JOIN**. md/p는 보조 소스(segment·FRT·POR·groove 등)이므로
**없어도 조회됩니다.** mcode당 md 다중행은 앱에서 집계합니다. (활성 mcode의 약 68%는 md 레코드가
없어, 과거 INNER JOIN 시절엔 전부 "정보 없음"으로 누락됐습니다 — LEFT JOIN으로 해소.)

#### 대표 마켓 결정 규칙

마켓 분류 체계가 3종(① `m.MAIN_MARKET` 지역코드, ② 38 개별코드, ③ 그룹코드)이며,
template은 ②(38코드)로 매칭합니다. 대표 마켓은 다음 규칙으로 ②로 환원합니다.

- `m.MAIN_MARKET`이 **1자리(지역)**: 지정 매핑 → `A`→A0~A9, `C`→A3(중국), `E`→E1~E6,
  `K`→K1(한국), `M`→M1~M6(중동), `N`→NA(북미)
- `m.MAIN_MARKET`이 **2자리(OEM 업체) / `-` / NULL**: `md.MAIN_MKT`의 최빈 38코드 1개
  (`'1'` 토큰은 `K1`로 치환)

> 매핑 근거는 데이터로 검증했습니다 — `apps/api/scripts/verify-market-mapping.cjs` 참조.

대부분(1자리 지역코드)의 타이어는 md 없이도 대표마켓이 결정됩니다. 다만 **md가 없고
`m.MAIN_MARKET`도 OEM(2자리)/`-`/NULL인 일부(활성 대비 소수)** 는 대표마켓을 결정할 수 없어
빈 셋으로 처리되며, 이 경우 마켓 조건이 있는 시험은 걸러지지 못하고 **마켓 무관(wildcard) 시험만
매칭**됩니다(결과가 불완전할 수 있어 화면에 "대표마켓 미결정"으로 표기). 향후 보조 마켓 소스
(`m.SPECIAL_MARKET` 등) 연계로 보강 가능합니다.

#### 매칭 로직

template 188행을 메모리에서 평가합니다. **빈 조건은 wildcard(통과)** 입니다.

- `PRODUCT_LINE`: 정확 일치(필수)
- 마켓: 행의 ON 플래그와 대표마켓 코드셋의 교집합 (ON 플래그 없으면 wildcard)
- `SS`: CSV 멤버십 · `RIM_INCH`/`LI`/`PLY_RATING`/`GRV_DEPTH`: 연산자 문자열(`<=121`, `>12`,
  `<>17.5` 등) 평가 · `POR`/`FRT`/`SNOW_MARK`: 플래그 · `TBR_POSITION`(`A`=All 와일드카드)/
  `TBR_SEGMENT`: CSV
- **`SIZE_SMPL`(규격 샘플)**: 타이어 규격을 `DW_SPEC_PLM_TIRE.SIZE_SMPL`(예: `11R22.5`)에서
  가져와, 템플릿 `SIZE_SMPL`의 콤마 목록에 **포함될 때만 매칭**(CSV 멤버십). 타이어 규격을 못 구하면
  미평가로 표기(제외하지 않음).
- **미평가 처리**: 값이 있으나 현재 소스로 평가 불가한 조건(`GRV_DEPTH` 값 없음, `TL_INDICATOR`,
  `TEMP_TIRE`/`UTQG`/`NEW_SIZE_YN`/`TBR_GRV_3`, `RADIAL_BIAS`(데이터 오염))은
  행을 제외하지 않고 `unevaluated`로 표기 — 시험 누락(false negative)을 방지

#### 관련 분석/검증 스크립트 (`apps/api/scripts`, 읽기 전용)

- `analyze-template-coverage.cjs` — 조건 컬럼 채움률·마켓 코드 커버리지
- `verify-market-mapping.cjs` — 1자리 main_market → 38코드 매핑 검증
- `phase1-resolve-tire.cjs` — mcode → 타이어 속성 도출 검증 (`node phase1-resolve-tire.cjs [mcode...]`)

### 3. 인증 / 접근 권한 (RBAC)

JWT 기반 로그인과 **역할(Role) 기반 메뉴·기능 권한**을 제공합니다.

- **권한 단위**: 메뉴(모듈·탭) × 액션(조회/생성/수정/삭제). 조회 권한이 없는 메뉴는
  사이드바·탭에서 숨겨지고, 변경 API는 전역 가드 + `@RequirePermission`으로 차단됩니다.
- **기본 역할**: `ADMIN`(전체), `EDITOR`(데이터 CRUD, 권한관리 제외), `VIEWER`(조회 전용).
- **관리자 화면**: 사이드바 **접근 권한 관리** 모듈에서 역할×메뉴 권한 매트릭스와 사용자(역할 배정·
  비밀번호 재설정·활성화)를 관리합니다.
- **백엔드**: `apps/api/src/{auth,permissions,admin}`. 테이블 접두사 `TMDM_`
  (`TMDM_ROLE`/`TMDM_USER`/`TMDM_MENU`/`TMDM_ROLE_MENU_PERM`).
- **인증 소스**: 현재 `local`(자체 계정 + bcrypt). 추후 그룹웨어 SSO로 교체 가능하도록 추상화됨.

#### 초기 설정 (최초 1회)

테이블 생성 + 기본 역할·메뉴·권한 + 초기 `admin` 계정을 시드합니다(멱등 — 재실행 안전).
`ADMIN_PASSWORD`는 명령줄(우선) 또는 `apps/api/.env`에 지정합니다.

```bash
cd apps/api
ADMIN_PASSWORD='강력한_비밀번호' node scripts/seed-auth.cjs
```

상세 환경변수·엔드포인트는 [apps/api/README.md](apps/api/README.md)의 "Auth & Access Control" 참고.

## 백엔드 작동 검증 현황

Oracle 19c 데이터베이스 연결이 정상적으로 구성된 NestJS API 서버가 준비되어 있습니다.

로컬 환경 검증 완료 내역:
- `pnpm --filter @hkrndmdm/api run build` 빌드 성공
- 설정된 Oracle 커넥션을 사용해 API 서버가 정상 시작
- TypeORM을 통해 Oracle 데이터베이스 연결 초기화 성공
- `GET /health` 요청 시 `status: ok` 및 `database: up` 반환
- `GET /docs` 요청 시 Swagger UI 정상 출력

# 저장소 개발 가이드라인 (Repository Guidelines)

## 프로젝트 구조 및 모듈 구성 (Project Structure & Module Organization)

이 저장소는 `pnpm workspaces`를 활용한 모노레포(monorepo)입니다. 메인 프론트엔드 애플리케이션은 `apps/web`에 위치하고, 백엔드 API 애플리케이션은 `apps/api`에 위치합니다. 향후 공통으로 사용할 공유 라이브러리는 `packages/` 폴더 하위에 추가해야 합니다.

- `apps/web/src/api/`: Axios 인스턴스 및 API 래퍼 모듈
- `apps/web/src/components/`: 재사용 가능한 UI, 레이아웃, 사이드바, 테마 및 설정 컴포넌트
- `apps/web/src/hooks/`: Zustand 스토어 및 커스텀 훅
- `apps/web/src/pages/`: 라우트 수준의 페이지 컴포넌트
- `apps/web/src/routers/`: `ProtectedRoute` 및 `PublicRoute`와 같은 라우트 가드
- `apps/web/src/assets/`: 프론트엔드 이미지 및 정적 에셋
- `apps/web/public/`: Vite를 통해 제공되는 정적 파일
- `apps/api/src/config/`: NestJS 환경 변수 검증 및 Oracle TypeORM 설정
- `apps/api/src/health/`: Terminus를 이용한 헬스체크 엔드포인트

빌드 결과물은 `apps/web/dist/` 및 `apps/api/dist/`에 생성되며, 이 폴더 안의 파일들은 수동으로 수정해서는 안 됩니다.

## 빌드, 테스트 및 개발 명령어 (Build, Test, and Development Commands)

루트에 위치한 `pnpm-lock.yaml`을 기준으로 pnpm을 사용합니다. pnpm 버전은 루트 `package.json`에 고정되어 있습니다. 만약 pnpm 사용이 불가능할 경우 `corepack enable`을 실행하십시오.

```bash
pnpm install --frozen-lockfile # 모든 워크스페이스의 정확한 락파일 의존성 설치
pnpm dev                       # apps/web Vite 개발 서버 시작 (3000 포트)
pnpm build                     # apps/web의 TypeScript 타입 체크 및 프로덕션 빌드
pnpm lint                      # apps/web의 ESLint 검사 실행
pnpm preview                   # apps/web 프로덕션 빌드 결과물 미리보기
pnpm api:dev                   # apps/api NestJS 서버를 watch 모드로 시작 (4000 포트)
pnpm api:build                 # apps/api 빌드
pnpm api:lint                  # apps/api의 ESLint 검사 실행
pnpm api:test                  # apps/api의 Jest 테스트 실행
```

워크스페이스 별칭(Workspace alias) 명령어들이 준비되어 있습니다. 예를 들어, `pnpm web:dev`, `pnpm web:build`, `pnpm api:build` 등을 사용할 수 있습니다. (내부적으로 Turborepo를 통해 병렬 빌드 및 캐싱이 적용됩니다.)

Nest CLI의 의존성 호이스팅(Hoisting) 문제를 방지하기 위해 이 저장소는 `.npmrc` 파일에 `node-linker=isolated` 설정을 사용하고 있습니다.

## 백엔드 설정 (Backend Configuration)

백엔드 API는 NestJS 11, TypeORM, 그리고 Oracle Database 19c 연동을 위한 `oracledb` 드라이버로 구축되었습니다.

- 로컬 API 환경 변수 파일: `apps/api/.env`
- 환경 변수 예시 파일: `apps/api/.env.example`
- **주의**: 실제 데이터베이스 계정 및 자격 증명(Credentials)은 절대 커밋하지 마십시오.
- Oracle 데이터베이스 연결을 위한 필수 변수들은 `DB_*` 접두사를 사용합니다: `DB_HOST`, `DB_PORT`, `DB_SERVICE_NAME` 또는 `DB_SID`/`DB_CONNECT_STRING`, `DB_USERNAME`, `DB_PASSWORD`.
- TypeORM의 `synchronize` 옵션은 `false`로 설정되어 있습니다. 스키마 변경 시에는 반드시 마이그레이션(Migrations)을 사용하십시오.
- 실행 중인 API 서버 엔드포인트에는 `GET /health` 및 `/docs`에서 접근 가능한 Swagger UI가 포함되어 있습니다.

로컬에서 Oracle 헬스체크가 검증되었습니다: `GET /health` 요청 시 `status: ok` 및 `database: up`을 반환합니다.

## 코딩 스타일 및 명명 규칙 (Coding Style & Naming Conventions)

TypeScript를 기본으로 사용합니다. `apps/web`에서는 React 함수형 컴포넌트(Function Component)를 사용하고, `apps/api`에서는 NestJS의 모듈/컨트롤러/서비스 구조를 따릅니다.

`apps/web` 내부에서는 절대 경로 임포트 시 `@/` 접두사(예: `@/components/ui/button`) 사용을 권장합니다.
파일 및 폴더 이름은 기존 규칙인 케밥 케이스(kebab-case)를 유지해 주십시오. (예: `layout-with-sidebar.tsx`, `use-auth-store.ts`).
컴포넌트는 파스칼 케이스(PascalCase)로 내보내야(export) 하며, 커스텀 훅은 항상 `use`로 시작해야 합니다.

가독성을 위해 2칸 들여쓰기(Two-space indentation) 스타일을 준수해 주십시오. 각 앱 워크스페이스마다 ESLint가 구성되어 있으므로, 커밋 전 적절한 lint 명령어를 통해 정적 분석을 통과하는지 확인하십시오.

## 테스트 가이드라인 (Testing Guidelines)

API 워크스페이스에는 Jest가 포함되어 있습니다. 단위 테스트(`*.spec.ts`)는 `pnpm api:test`로, e2e 테스트(`test/*.e2e-spec.ts`)는 `pnpm --filter @hkrndmdm/api test:e2e`로 실행합니다. **기본 e2e 스위트는 DB-free(모킹) 원칙**입니다 — `AppModule` 전체를 import 하면 Oracle 연결이 필요하므로, 필요한 컨트롤러/서비스만 부팅하고 데이터 계층(서비스·`DataSource`)은 모킹합니다. 보안 글루(인증·권한 가드·검증)는 실제 전역 가드/파이프로 검증합니다(`auth.e2e-spec.ts` 참고). Oracle 전용 SQL을 쓰는 핵심 쿼리는 별도 opt-in 테스트 DB로 보강합니다 — [apps/api/README.md](apps/api/README.md)의 "Testing strategy" 절 참고.

프론트엔드(`apps/web`)는 Vitest + Testing Library(jsdom)가 구성되어 있습니다. 웹 테스트는 `pnpm web:test`(또는 watch 모드 `pnpm --filter @hkrndmdm/web test:watch`)로 실행합니다. 테스트는 대상 파일 옆에 배치하는 코로케이션(Colocation) 패턴을 따르고 파일명을 `*.test.ts` 또는 `*.test.tsx`로 명명하십시오. 전역 setup은 `apps/web/src/test/setup.ts`(jest-dom 매처 등록)이며, Vitest 설정은 `vite.config.ts`의 `test` 블록에 있습니다.

루트 `pnpm test`는 Turborepo를 통해 두 워크스페이스(api Jest + web Vitest)의 테스트를 모두 실행합니다.

## 커밋 및 풀 리퀘스트 가이드라인 (Commit & Pull Request Guidelines)

최근 커밋은 `fix : ...`, `feat : ...` 형태의 짧은 메시지와 간결한 작업 설명 형태를 띠고 있습니다. 타입 접두사 규칙과 함께 명확하고 간결한 명령조 메시지 사용을 권장합니다:

```text
feat: add authenticated dashboard route
fix: preserve login state after refresh
```

풀 리퀘스트(PR)를 보낼 때는 작업 요약, 테스트 메모, 연관된 이슈/태스크 링크(있는 경우), 그리고 UI 수정이 있을 경우 스크린샷을 포함해야 합니다. 라우트, API, 환경 변수, 데이터베이스 및 인증 흐름의 변경 사항이 있다면 PR 설명글에 명시적으로 언급해 주십시오.

## 보안 및 설정 팁 (Security & Configuration Tips)

Vite는 환경 변수 파일로부터 `VITE_API_URL_DEV`와 `VITE_API_URL_PROD`를 읽어 API 베이스 URL로 설정합니다. 민감한 비밀키, 실제 DB 비밀번호, 실제 토큰 등을 소스코드에 커밋하지 않도록 각별히 유의하십시오.
인증 토큰은 `apps/web/src/constants.ts`에 정의된 키 이름을 사용하여 브라우저의 `localStorage`에 저장됩니다. 인증 흐름 변경 사항은 세심하게 검토해 주십시오.

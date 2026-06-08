# HKRndMDM 모노레포 (Monorepo)

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

## 백엔드 작동 검증 현황

Oracle 19c 데이터베이스 연결이 정상적으로 구성된 NestJS API 서버가 준비되어 있습니다.

로컬 환경 검증 완료 내역:
- `pnpm --filter @hkrndmdm/api run build` 빌드 성공
- 설정된 Oracle 커넥션을 사용해 API 서버가 정상 시작
- TypeORM을 통해 Oracle 데이터베이스 연결 초기화 성공
- `GET /health` 요청 시 `status: ok` 및 `database: up` 반환
- `GET /docs` 요청 시 Swagger UI 정상 출력

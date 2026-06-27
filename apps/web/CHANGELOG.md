🔗 **[Main README로 이동](/README.md)**

# 변경 이력

### 2026-06-28

- 작업자 : Hans
- **벤더 청크 분할** — 단일 벤더 번들을 성격별로 분리(react/ui/motion/i18n/vendor). 엔트리 청크 **672KB→145KB(gzip 213→43)**, 모든 청크 500KB 미만으로 빌드 경고 해소. 벤더가 별도 캐싱되어 앱 코드 변경 시 재다운로드 최소화. (`vite.config.ts` manualChunks, preview 빌드로 동작 확인)
- **App URL 라우팅 통합 테스트 추가** — URL→화면 매핑·정규화 회귀 방지 (web 28→33)

### 2026-06-27

- 작업자 : Hans
- **품질·견고성 정비** (사용자 화면 변화 없음, 내부 개선)
  - **웹 lint 복구** — `react-hooks/set-state-in-effect` 위반 2건 해소
    - `classification-master`(분류 마스터)를 TanStack Query로 마이그레이션(`use-classification` 훅 신설), `useEffect` 내 수동 fetch 제거
    - `CommandPalette` — 닫힘 시 검색어 초기화를 effect→`onOpenChange` 래퍼로 변경
    - `login` 잔여 `console.log` 제거
  - **프런트엔드 테스트 도입** — Vitest + Testing Library(jsdom) 구성. 권한 게이팅(`useCan`)·`cn` 유틸 등 11개 테스트. `pnpm web:test`로 실행 (루트 `pnpm test`가 api Jest + web Vitest 모두 실행). 상세: [AGENTS.md](/AGENTS.md) 테스트 가이드
  - **App.tsx 대시보드 관심사 분리** (428→229줄) — STD 시험항목 테이블/모달 상태·핸들러를 `use-std-items-dashboard` 훅으로, 모달 3종을 `DashboardModals`로, 네비 상수를 `nav-config`로 추출. App 은 셸만 담당. (동작 변화 없음)
- **화면 전환을 URL 라우팅으로 전환** (사용자 영향 있음 — 개선)
  - 모듈/탭이 URL 경로에 반영됨: `/{module}/{tab}` (예: `/test-master/reports`). 이전엔 상태 기반이라 항상 `/`였음
  - 이제 **딥링크(특정 탭 북마크)·새로고침 시 탭 유지·브라우저 뒤로/앞으로**가 동작
  - 화면 매핑은 `App.tsx`의 `screens` 레지스트리로 일원화, 라우트 정규화/권한 게이팅은 순수 함수 `resolveActiveRoute`로 추출(+테스트). 상세: [web/README.md](./README.md) _Navigation_ 절
- **안정성·번들 정비**
  - **ErrorBoundary 도입** — 한 화면의 렌더 에러가 앱 전체 화이트스크린이 되던 문제 해결. 라우트 콘텐츠를 경계로 감싸 격리하고(탭 이동 시 자동 리셋, "다시 시도" 제공), main 셸에도 최후 안전망 배치. (`components/ErrorBoundary.tsx`)
  - **라우트 단위 코드 스플리팅** — 모든 화면을 `React.lazy`+`<Suspense>`로 분할. 단일 번들 **945KB→672KB(gzip 288→213KB)**, 화면은 진입 시 로드. 초기 로드 단축
  - **Dead code 제거** — 라우터에서 도달 불가한 템플릿 잔재(`logged-in-home`/`layout-sample-pages`/`home`/`layout-with-sidebar`/`profile-icon`/`navbar/app-sidebar`) 삭제. 유일하던 `no-explicit-any` 억제도 함께 제거
  - 테스트: ErrorBoundary 3종 추가 (web 25→28)
- **백엔드(api) 개선** (운영/성능)
  - `JWT_SECRET` 최소 길이(32자) 부팅 검증 추가 — 약한 시크릿 차단
  - Oracle 접속 옵션을 공통 빌더로 통합(런타임·마이그레이션 CLI 일원화) — CLI가 SID를 service name처럼 취급하던 잠재 불일치 제거
  - **필요시험 매칭 성능** — 템플릿 전체(`TEMPLATE_STD_TEST_ITEM`)를 매 요청 재조회하던 것을 인메모리 캐시(쓰기 시 자동 무효화, TTL 5분 안전망)로 개선. 템플릿 수정·업로드·변경요청 반영 시 즉시 무효화되므로 결과는 최신으로 유지됨
  - 상세: 개발 [api/README.md](../api/README.md)

### 2026-06-26

- 작업자 : Hans
- **데이터 페칭에 TanStack Query(v5) 도입** — 서버 상태 캐싱·동기화 계층 정비 (사용자 화면 변화 없음, 내부 아키텍처)
  - 전역 `QueryClient`/`QueryClientProvider` + Devtools 구성 (`src/lib/query-client.ts`, `main.tsx`)
  - 기존 `useEffect + useState` 페칭 훅을 `useQuery`/`useMutation`으로 마이그레이션: `use-health`(폴링), `use-std-stats`, `use-std-test-items`(메인 테이블·낙관적 갱신), `use-notifications`(폴링·낙관적 읽음), `use-std-codes`(수제 캐시 → Query 캐시)
  - `StdTestItemEditModal`의 인라인 fetch 7개(참조 콤보·계단식 분류·제안)도 전환
  - 훅 반환 시그니처를 보존해 소비처(컴포넌트) 코드는 무수정. `Zustand`는 클라이언트/UI 상태 전용으로 역할 분리
  - 부수 개선: 관리자 표준코드 편집 시 `invalidateStdCodes`가 활성 쿼리를 즉시 refetch → **열려 있는 드롭다운도 즉시 최신값 반영**
  - 상세: 개발 [web/README.md](./README.md) _Data Fetching (Server State)_ 절

### 2026-06-25

- 작업자 : Hans
- **표준코드 관리(DW_STD_CODE)** 기능 추가 — `접근 권한 관리 > 표준코드 관리` 탭(관리자 전용)
  - 그룹별 계층형 코드 트리 CRUD, 다단 구조 지원
  - 드래그&드롭으로 정렬·계층(부모) 변경, ATTR 1~3 속성 칩 표시
  - 트리 검색(하위 포함)·모두 펼치기/접기·미사용 숨김, 코드명 인라인 편집, 펼침 상태 유지, 같은 레벨 복제
  - 상세: 개발 [std-codes/README.md](../api/src/std-codes/README.md), 사용자 매뉴얼 9.5절
- 미사용 placeholder였던 **재료 사양(material-specs)** 사이드바 메뉴 제거
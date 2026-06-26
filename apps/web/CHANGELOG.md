🔗 **[Main README로 이동](/README.md)**

# 변경 이력

### 2026-06-27

- 작업자 : Hans
- **품질·견고성 정비** (사용자 화면 변화 없음, 내부 개선)
  - **웹 lint 복구** — `react-hooks/set-state-in-effect` 위반 2건 해소
    - `classification-master`(분류 마스터)를 TanStack Query로 마이그레이션(`use-classification` 훅 신설), `useEffect` 내 수동 fetch 제거
    - `CommandPalette` — 닫힘 시 검색어 초기화를 effect→`onOpenChange` 래퍼로 변경
    - `login` 잔여 `console.log` 제거
  - **프런트엔드 테스트 도입** — Vitest + Testing Library(jsdom) 구성. 권한 게이팅(`useCan`)·`cn` 유틸 등 11개 테스트. `pnpm web:test`로 실행 (루트 `pnpm test`가 api Jest + web Vitest 모두 실행). 상세: [AGENTS.md](/AGENTS.md) 테스트 가이드
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
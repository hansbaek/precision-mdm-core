# DII팀 Frontend 개발 Boilerplate

- React + Typescript + Vite 기반의 프론트엔드 보일러 플레이트

## 변경 이력

- [보기](./CHANGELOG.md)

## 🚀 Key Features

- **Modern Tech Stack**: React 19, Vite 8, TypeScript 구성
- **Security First**: 보안 이슈를 방지하기 위해 `axios` 버전을 **1.13.6**으로 고정 관리
- **State Management**: 서버 상태는 `TanStack Query`(캐싱·동기화), 클라이언트/UI 상태는 `Zustand`로 역할 분리
- **Routing & Auth**: `react-router` v7 기반의 Role-based Protected Route 시스템 구축
- **UI/UX Components**:
  - Tailwind CSS v4 & Shadcn UI 활용 (`Lucide React` 아이콘 세트 포함)
  - `Framer Motion`을 이용한 애니메이션 컴포넌트 구성
  - 다국어 지원(i18next)

---

## 📂 Project Structure

```text
src/
├─ api/                    # Axios 인스턴스 및 API 인터페이스 정의
├─ assets/                 # 정적 리소스 (이미지 등)
├─ components/             # 공통 재사용 컴포넌트 (Shadcn 등)
├─ hooks/                  # 커스텀 훅 (서버 데이터는 useQuery 래핑 훅으로 제공)
├─ lib/                    # 기타 라이브러리 코드
│  └─ query-client.ts      # 전역 QueryClient (TanStack Query) 설정
├─ pages/                  # 페이지 단위 컴포넌트
│  ├─ home/                # 일반 홈 페이지
│  │  └─ index.tsx
│  ├─ login/               # 로그인 페이지
│  │  └─ index.tsx
│  ├─ unauthorized/        # 권한 없음 페이지
│  │  └─ index.tsx
│  ├─ logged-in-home/      # 로그인이 된 경우를 가정한 홈 페이지
│  │  └─ index.tsx
│  └─ layout-sample-pages/ # 레이아웃 예시 페이지 모음
│     ├─ with-sidebar/
│     │  └─ index.tsx      # 상단바와 사이드바가 모두 포함된 레이아웃
│     └─ without-sidebar/
│        └─ index.tsx      # 상단바만 포함된 레이아웃
├─ routers/                # 라우팅 설정 (Protected/Public Route 분리)
├─ i18n.ts                 # 다국어 설정
├─ main.tsx                # 엔트리 포인트
└─ types.ts                # 공용 타입 정의
```

---

## 🛠 Tech Stack

### Framework & Build Tool

| Category       | Tech              |
| :------------- | :---------------- |
| **Library**    | React 19 (Latest) |
| **Build Tool** | Vite 8            |
| **Language**   | TypeScript        |

### Libraries

- **Styling**: Tailwind CSS v4, Shadcn UI
- **Routing**: React Router v7
- **State (Client/UI)**: Zustand
- **State (Server)**: TanStack Query v5 (`@tanstack/react-query` + devtools)
- **Network**: Axios (Fixed version: 1.13.6) — TanStack Query의 `queryFn`에서 사용
- **Animation**: Framer Motion, Tw-animate-css
- **Internationalization**: i18next

---

## 💻 Getting Started

### Prerequisites

- Node.js (LTS 추천) (fnm을 이용해서 설치)
- pnpm (Corepack 사용 권장)

### Installation

루트 디렉터리에서 실행하세요.

```bash
corepack enable
pnpm install
```

### Development

```bash
pnpm dev
```

### Build & Preview

```bash
# Production 빌드
pnpm build

# 빌드 결과물 미리보기
pnpm preview
```

---

## 🛡 Security Note

본 보일러플레이트는 의존성 패키지의 보안 취약점에 대응하기 위해 특정 라이브러리의 버전을 엄격히 제한합니다.

- **Axios**: 알려진 보안 이슈 방지를 위해 `1.13.6` 버전 사용. 업데이트 시 팀 내 검토 필수.

---

## 🔄 Data Fetching (Server State)

서버 데이터는 직접 `useEffect + useState` 로 가져오지 말고 **TanStack Query**로 다룹니다. 캐싱·중복요청 dedup·재시도·폴링·낙관적 업데이트를 라이브러리가 담당하므로 Oracle 부하와 보일러플레이트가 함께 줄어듭니다.

- **Provider / Devtools**: `main.tsx`에서 `QueryClientProvider`로 앱을 감싸며, 전역 설정은 [`src/lib/query-client.ts`](src/lib/query-client.ts)에 있습니다. (전역 기본값: `staleTime 30s`, `retry 1`, `refetchOnWindowFocus false`)
- **조회**: `src/hooks/`의 `useQuery` 래핑 훅을 통해 노출합니다. (예: `use-std-codes`, `use-std-stats`, `use-std-test-items`, `use-health`, `use-notifications`)
- **`queryKey` 컨벤션**: `[도메인, ...식별자]` 배열. 필터·인자는 키에 포함해 값이 바뀔 때만 재조회되게 합니다. (예: `['std-test-items', { productLine, search, markets }]`, `['std-codes', grpId, level]`)
- **`staleTime` 가이드**:
  - 사실상 불변 참조 데이터(표준코드 등) → `Infinity` (명시적 무효화 전까지 재조회 안 함)
  - 가끔 바뀌는 데이터(통계·분류 목록) → 분 단위(`60s`~`5m`)
  - 상태 표시·알림처럼 항상 최신이 필요 → `0` + `refetchInterval`(폴링)
- **폴링**: `refetchInterval`(+필요 시 `refetchIntervalInBackground`)을 사용합니다. 직접 `setInterval` 금지.
- **변경/무효화**: 생성·수정·삭제는 `useMutation` 또는 API 함수로 처리하고, 성공 후 관련 `queryKey`를 `queryClient.invalidateQueries`로 무효화합니다. (예: 표준코드 편집 → `invalidateStdCodes(grpId)` 가 `['std-codes', grpId]` 무효화)
- **낙관적 업데이트**: `useMutation`의 `onMutate`에서 `setQueryData`로 즉시 반영하고, `onError`에서 무효화로 서버 진실에 재동기화합니다.

---

## 🧭 Navigation (Screen Routing)

인증 영역의 화면 전환은 **URL 기반**입니다. 모듈/탭이 경로에 반영되어 **딥링크·새로고침 유지·브라우저 뒤로/앞으로**가 동작합니다.

- **경로 규칙**: `/{module}/{tab}` (탭이 없는 모듈은 `/{module}`). 예: `/test-master/reports`, `/admin/users`, `/testing-protocols`.
- **셸**: [`App.tsx`](src/App.tsx)가 레이아웃 셸. `useLocation`으로 경로를 파싱하고, 사이드바/헤더/팔레트의 전환은 `useNavigate`로 URL을 바꾼다(상태 setter 아님).
- **정규화**: [`resolveActiveRoute`](src/lib/nav-config.ts)가 URL의 (module, tab)을 권한·구성에 비춰 유효한 값으로 정규화하고, `App`의 effect가 실제 URL을 canonical 경로로 교정한다(미허용 모듈/탭, `/` 진입 등). 권한 게이팅은 `ProtectedRoute`(로그인+권한 적재)와 `resolveActiveRoute`(메뉴 view 권한)에서 이뤄진다.
- **화면 레지스트리**: 어떤 (module/tab)에 어떤 화면을 렌더할지는 `App.tsx`의 `screens` 맵에 모여 있다. **화면 추가 = 맵 항목 + (탭이면) [`nav-config.ts`](src/lib/nav-config.ts)의 `MODULE_TABS` 항목 추가.**

---

## 📝 Rules & Conventions

1.  **Routing**: 최상위 인증 게이트는 `src/routers/`의 `ProtectedRoute`/`PublicRoute`를 사용하고, 인증 영역의 새 화면은 위 _Navigation_ 절대로 `App.tsx`의 `screens` 레지스트리와 `nav-config.ts`에 등록하세요.
2.  **State Management**: **서버 상태는 TanStack Query**(위 _Data Fetching_ 절), **클라이언트/UI 전역 상태는 Zustand**(`src/hooks/` 내 store 단위)로 분리해 관리합니다.
3.  **Styling**: 디자인 시스템 확장을 위해 Shadcn UI 컨벤션을 준수합니다.

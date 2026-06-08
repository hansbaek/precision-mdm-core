# DII팀 Frontend 개발 Boilerplate

- React + Typescript + Vite 기반의 프론트엔드 보일러 플레이트

## 변경 이력

- [보기](./CHANGELOG.md)

## 🚀 Key Features

- **Modern Tech Stack**: React 19, Vite 8, TypeScript 구성
- **Security First**: 보안 이슈를 방지하기 위해 `axios` 버전을 **1.13.6**으로 고정 관리
- **State Management**: `Zustand`를 이용한 상태 관리
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
├─ hooks/                  # 커스텀 훅
├─ lib/                    # 기타 라이브러리 코드
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
- **State**: Zustand
- **Network**: Axios (Fixed version: 1.13.6)
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

## 📝 Rules & Conventions

1.  **Routing**: 신규 페이지 추가 시 `src/routers/` 내 인증 권한 여부에 따라 `ProtectedRoute` 또는 `PublicRoute`를 적절히 사용하세요.
2.  **State Management**: 글로벌 상태는 `src/hooks/` 폴더 내 store 단위로 관리합니다.
3.  **Styling**: 디자인 시스템 확장을 위해 Shadcn UI 컨벤션을 준수합니다.

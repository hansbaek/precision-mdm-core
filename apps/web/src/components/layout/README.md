🔗 **[Main README로 이동](/README.md)**

# 🏗️ Layout Component Guide

이 프로젝트는 페이지 전환 애니메이션과 일관된 구조를 제공하기 위해 두 가지 타입의 레이아웃 컴포넌트를 사용합니다.
모든 레이아웃에는 **Framer Motion**을 활용한 부드러운 페이드인/업(Fade-in/up) 효과가 기본적으로 적용되어 있습니다.

## 1. 컴포넌트 종류

### 1️⃣ `Layout` (Simple)

- **용도**: 사이드바나 헤더 없이, 단순히 **페이지 전환 애니메이션**만 필요한 경우에 사용합니다. (예: 로그인 페이지, 전체 화면 랜딩 페이지 등)
- **주요 기능**: `initial`, `animate`, `exit` 상태를 통한 부드러운 트랜지션 제공.

### 2️⃣ `LayoutWithSidebar`

- **용도**: 대시보드나 설정 페이지처럼 **사이드바 내비게이션과 상단 헤더**가 필요한 일반적인 서비스 페이지에 사용합니다.
- **주요 기능**:
  - 사이드바 메뉴 표시
  - 페이지 타이틀 및 상단 헤더 버튼(headerButton) 커스텀
  - `hideSidebar` 옵션을 통해 사이드바를 숨기고 툴바 형태의 헤더만 노출 가능

---

## 2. 사용 방법

### 📌 LayoutWithSidebar 사용 예시 (일반 페이지)

상단 Navigation바와 사이드바가 포함된 표준 페이지를 만들 때 사용합니다.

```tsx
import { LayoutWithSidebar } from "@/components/layout/layout-with-sidebar";
import { Button } from "@/components/ui/button";

const MyPage = () => {
  return (
    <LayoutWithSidebar
      title="사용자 관리"
      headerButton={<Button>헤더 버튼</Button>} // Option입니다. 필요시 추가하면 됩니다.
    >
      <div>여기에 페이지 본문 내용을 작성합니다.</div>
    </LayoutWithSidebar>
  );
};
```

### 📌 LayoutWithSidebar (hideSidebar=true) 사용 예시 (일반 페이지)

상단 Navigation바만 포함된 표준 페이지를 만들 때 사용합니다.

```tsx
import { LayoutWithSidebar } from "@/components/layout/layout-with-sidebar";
import { Button } from "@/components/ui/button";

const MyPage = () => {
  return (
    <LayoutWithSidebar
      title="사용자 관리"
      hideSidebar={true}
      headerButton={<Button>헤더 버튼</Button>} // Option입니다. 필요시 추가하면 됩니다.
    >
      <div>여기에 페이지 본문 내용을 작성합니다.</div>
    </LayoutWithSidebar>
  );
};
```

### 📌 Layout 사용 예시 (단순 애니메이션)

UI 구조 없이 애니메이션만 필요한 경우에 사용합니다.

```tsx
import { Layout } from "@/components/layout/layout-simple";

const LoginPage = () => {
  return (
    <Layout>
      <div className="login-container">
        <h1>로그인</h1>
        {/* 로그인 폼 내용 */}
      </div>
    </Layout>
  );
};
```

---

## 3. LayoutWithSidebar 컴포넌트 속성 상세 설명

| Prop           | Type        | Default      | Description                                             |
| :------------- | :---------- | :----------- | :------------------------------------------------------ |
| `title`        | `string`    | **Required** | 페이지 상단에 표시될 제목                               |
| `children`     | `ReactNode` | **Required** | 페이지의 본문 내용                                      |
| `withMotion`   | `boolean`   | `true`       | 애니메이션 효과 적용 여부                               |
| `headerButton` | `ReactNode` | -            | 헤더 우측에 추가할 버튼이나 컴포넌트                    |
| `hideSidebar`  | `boolean`   | `false`      | `true` 설정 시 사이드바를 숨기고 툴바 레이아웃으로 변경 |

---

## 4. Sample 화면 경로

- 사이드바가 있는 샘플 : /layout-with-sidebar-sample
- 사이드바가 없는 샘플 페이지 : /layout-without-sidebar-sample

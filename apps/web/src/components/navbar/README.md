🔗 **[Main README로 이동](/README.md)**

# 📚 AppSidebar Component Guide

`AppSidebar`는 사이드바 네비게이션을 구성하기 위한 재사용 가능한 컴포넌트입니다.
카테고리 및 메뉴 구조는 `navCategories`만 수정하여 쉽게 커스터마이징할 수 있습니다.

## 📦 기본 사용법

사이드바 메뉴는 **`navCategories`** 배열을 수정하여 구성합니다.

## 🧱 데이터 구조

```ts
interface NavCategory {
  id: string; // 카테고리 고유 ID
  label: string; // 카테고리 이름
  menus: MenuItem[]; // 메뉴 리스트
}

interface MenuItem {
  id: string; // 메뉴 고유 ID
  label: string; // 메뉴 이름 (i18n 사용 가능)
  icon?: React.ReactElement; // 아이콘 (선택)
  href: string; // (현재 미사용, 확장용)
  subMenus: SubMenuItem[]; // 서브메뉴 리스트
}

interface SubMenuItem {
  label: string; // 서브메뉴 이름
  href: string; // 이동 경로
  icon?: React.ReactElement; // 아이콘 (선택)
}
```

---

## ✏️ 예시

```tsx
const navCategories = [
  {
    id: "samples",
    label: "Samples",
    menus: [
      {
        id: "sample1",
        label: t("navItem.sample1"),
        icon: <FolderClosedIcon />,
        href: "#",
        subMenus: [
          {
            label: t("navItem.sample1Group.item1"),
            href: "/sample1/item1",
            icon: <InfoIcon />,
          },
          {
            label: t("navItem.sample1Group.item2"),
            href: "/sample1/item2",
            icon: <LinkIcon />,
          },
        ],
      },
    ],
  },
];
```

---

## 🌍 다국어 (i18n)

- `react-i18next`의 `t()` 함수를 사용하여 메뉴 이름을 관리합니다.

### 예시 (`i18n.ts`)

```json
{
  "navItem": {
    "sample1": "Sample 1",
    "sample2": "Sample 2",
    "anotherSample": "Another Sample",
    "sample1Group": {
      "item1": "Item 1",
      "item2": "Item 2",
      "item3": "Item 3"
    },
    "sample2Group": {
      "item1": "Item 1",
      "item2": "Item 2"
    }
  }
}
```

## ⚠️ 주의사항

- `category.id`, `menu.id`는 반드시 **유니크**해야 합니다.
- `subMenus.href`는 `react-router`에 등록된 경로와 일치해야 합니다.
- `label`은 i18n 키와 연결되므로 `i18n.ts`과 반드시 동기화해야 합니다.

🔗 **[Main README로 이동](/README.md)**

# 변경 이력

### 2026-04-24

- 작업자 : 채민기
- 사이드바 토글 버튼 위치 수정(화면에 hover 되도록 변경)
- 사이드바 토글 시 사이트 배너는 그대로 유지되도록 변경
- 사이드바에 표시되는 메뉴 트리 수정(Category명 - Menus - Submenus)
- Login 화면 UI 변경(i-Research, i-PLM과 유사한 형태로 변경) 및 remember ID 버튼 추가

### 2026-04-23

- 작업자 : 류준상
- 엣지 브라우저에서 로그인 화면의 비밀번호 입력창에 비밀번호 표시 아이콘이 중복 출력되는 버그 수정

### 2026-04-23

- 작업자 : 채민기
- 사이드바 변경(직접 작성 -> ShadCN Sidebar 컴포넌트 활용)
- Dark/Light Theme변경 기능 추가(아이콘 및 동작 구현)
- Setting 아이콘 추가(마우스 hover 시 tooltip 출력)
- Navigation Bar 높이 변경
- Sidebar 토글버튼 추가
- Sidebar header와 Navigaton bar 하단 높이 정렬

### 2026-04-17

- 작업자 : 채민기
- profile-icon 컴포넌트의 다국어처리 누락부분 수정(이름 및 팀)
- 변경 이력을 별도 md파일로 분리(CHANGELOG.md)

### 2026-04-10

- 작업자 : 채민기
- 공통 컴포넌트 추가(LayoutWithSidebar, Profile-Icon, Navbar, Sidebar 등)
- 상세 설명은 각 컴포넌트의 README.md 참고
  - [Layout System Guide](./src/components/layout/README.md)
  - [Sidebar & Navigation Guide](./src/components/navbar/README.md)

### 2026-04-06

- 작업자 : 채민기
- 보일러플레이트 초기 설정
- 기본적인 UI 시스템 구축 및 샘플 페이지 구성(Login, 404, Unauthorized 등)

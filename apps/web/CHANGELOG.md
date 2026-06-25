🔗 **[Main README로 이동](/README.md)**

# 변경 이력

### 2026-06-25

- 작업자 : Hans
- **표준코드 관리(DW_STD_CODE)** 기능 추가 — `접근 권한 관리 > 표준코드 관리` 탭(관리자 전용)
  - 그룹별 계층형 코드 트리 CRUD, 다단 구조 지원
  - 드래그&드롭으로 정렬·계층(부모) 변경, ATTR 1~3 속성 칩 표시
  - 트리 검색(하위 포함)·모두 펼치기/접기·미사용 숨김, 코드명 인라인 편집, 펼침 상태 유지, 같은 레벨 복제
  - 상세: 개발 [std-codes/README.md](../api/src/std-codes/README.md), 사용자 매뉴얼 9.5절
- 미사용 placeholder였던 **재료 사양(material-specs)** 사이드바 메뉴 제거
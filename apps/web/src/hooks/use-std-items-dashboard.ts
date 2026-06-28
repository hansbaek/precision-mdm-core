import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { useStdTestItems } from './use-std-test-items';
import { getPreferences } from './use-preferences-store';
import type { FilterOptions, StdTestItem } from '@/types';

const INITIAL_FILTERS: FilterOptions = {
  productLine: 'ALL',
  searchQuery: '',
  markets: '',
};

/**
 * STD 시험항목 대시보드의 상태·핸들러를 한곳에 모은 훅.
 *
 * 과거 App.tsx 가 테이블 필터/정렬/페이지 + 상세·편집·삭제 모달 + 관련 핸들러를
 * 모두 직접 소유해 비대했다. 이 훅이 그 관심사를 캡슐화하고, App 은 셸 역할만 한다.
 * 목록(`items`)·상세 열기(`openDetail`)는 CommandPalette·Sidebar 도 공유하므로
 * **단일 소스**가 되도록 App 에서 한 번만 호출한다.
 */
export function useStdItemsDashboard(activeModule: string) {
  const { t } = useTranslation();

  // 사용자 환경설정(설정 모달)에 저장된 표시 기본값을 초기값으로 사용.
  const initialPrefs = getPreferences();
  const [filters, setFilters] = useState<FilterOptions>({
    ...INITIAL_FILTERS,
    productLine: initialPrefs.defaultProductLine,
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>({
    ...INITIAL_FILTERS,
    productLine: initialPrefs.defaultProductLine,
  });

  const [sortBy, setSortBy] = useState(initialPrefs.sortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    initialPrefs.sortOrder,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialPrefs.pageSize);

  const [editingItem, setEditingItem] = useState<StdTestItem | null>(null);
  const [creatingItem, setCreatingItem] = useState(false);
  const [deletingItem, setDeletingItem] = useState<StdTestItem | null>(null);
  // 편집 진입 위치 — 취소/저장 시 사용자를 그 자리로 되돌린다.
  const [editOrigin, setEditOrigin] = useState<'table' | 'detail'>('table');

  const {
    items,
    setItems,
    loading,
    error,
    reload,
  } = useStdTestItems(activeModule, appliedFilters);

  // ── 상세(읽기 전용) 모달은 URL(`?view=<id>`)을 단일 소스로 둔다 ──
  // 딥링크·새로고침·뒤로가기를 지원하기 위해 보고 있는 항목을 URL에서 파생한다.
  // (편집/생성/삭제 모달은 휘발성이라 URL 동기화 대상이 아니다.)
  const [searchParams, setSearchParams] = useSearchParams();
  const viewId = searchParams.get('view');
  const viewingItem = useMemo(
    () => (viewId ? items.find((it) => String(it.id) === viewId) ?? null : null),
    [viewId, items],
  );

  // 상세 열기 — 커맨드 팔레트·테이블·토스트 액션이 항목 객체로 호출한다.
  const openDetail = (item: StdTestItem) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('view', String(item.id));
      return next;
    });
  };
  // 닫기는 replace 로 — 뒤로가기 시 모달이 되살아나지 않도록.
  const closeDetail = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('view');
        return next;
      },
      { replace: true },
    );
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const ra = a[sortBy as keyof StdTestItem];
      const rb = b[sortBy as keyof StdTestItem];
      let cmp: number;
      if (typeof ra === 'number' && typeof rb === 'number') {
        cmp = ra - rb;
      } else {
        cmp = String(ra ?? '')
          .toLowerCase()
          .localeCompare(String(rb ?? '').toLowerCase());
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [items, sortBy, sortOrder]);

  // ── 핸들러 ──────────────────────────────────────────────
  const handleSaved = (updated: StdTestItem) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
    setEditingItem(null);
    // 상세에서 진입했다면 갱신값이 보이도록 상세로 복귀.
    if (editOrigin === 'detail') openDetail(updated);
    toast.success(`STD Item #${updated.id} 수정 완료`);
  };

  const handleEditFromTable = (item: StdTestItem) => {
    setEditOrigin('table');
    setEditingItem(item);
  };

  // "추가" — 생성 후 닫고, 새 행을 목록 상단에 노출 + 한 번에 보기 제공.
  const handleCreated = (created: StdTestItem) => {
    setItems((prev) => [created, ...prev]);
    setCreatingItem(false);
    setSortBy('id');
    setSortOrder('desc');
    setCurrentPage(1);
    toast.success(`STD Item #${created.id} 생성 완료`, {
      action: { label: '보기', onClick: () => openDetail(created) },
    });
  };

  // "추가 후 계속" — 생성하되 다음 입력을 위해 모달은 열어 둔다.
  const handleCreatedContinue = (created: StdTestItem) => {
    setItems((prev) => [created, ...prev]);
  };

  const handleDeleted = (id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setDeletingItem(null);
    // 삭제된 레코드를 보고 있었다면 상세도 닫는다.
    if (viewId && Number(viewId) === id) closeDetail();
    toast.success(`STD Item #${id} 삭제 완료`);
  };

  // 승인 워크플로: 비승인권자의 변경은 즉시 반영되지 않고 승인 대기로 제출된다.
  // 라이브 목록은 건드리지 않고 모달만 닫은 뒤 안내한다.
  const handleChangeRequested = (crId: number) => {
    setCreatingItem(false);
    setEditingItem(null);
    setDeletingItem(null);
    toast.message(t('app.approval.submitted'), {
      description: t('app.approval.submittedDesc', { id: crId }),
    });
  };

  const handleEditCancel = () => {
    // 상세에서 진입했다면 상세로 복귀(취소이므로 값은 그대로).
    if (editOrigin === 'detail' && editingItem) openDetail(editingItem);
    setEditingItem(null);
  };

  const handleSearchExecute = () => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const handleSearchReset = () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setCurrentPage(1);
  };

  return {
    /** 정렬 미적용 원본 개수(사이드바 배지용). */
    rawCount: items.length,
    /** 정렬 적용 목록 — 대시보드 테이블 + 커맨드 팔레트 공유. */
    sortedItems,
    /** 상세 모달 열기 — 커맨드 팔레트도 사용. */
    openDetail,

    /** DashboardPage 가 받는 props(네비 prop 제외). */
    dashboardSectionProps: {
      filters,
      setFilters,
      onSearch: handleSearchExecute,
      onReset: handleSearchReset,
      items: sortedItems,
      loading,
      error,
      onRetry: reload,
      onView: openDetail,
      onEdit: handleEditFromTable,
      onDelete: setDeletingItem,
      onAdd: () => setCreatingItem(true),
      sortBy,
      setSortBy,
      sortOrder,
      setSortOrder,
      currentPage,
      setCurrentPage,
      itemsPerPage,
      setItemsPerPage,
    },

    /** 상세 모달 props. */
    detailModalProps: {
      isOpen: viewingItem !== null,
      item: viewingItem,
      onClose: closeDetail,
      onEdit: (item: StdTestItem) => {
        closeDetail();
        setEditOrigin('detail');
        setEditingItem(item);
      },
      onDelete: setDeletingItem,
    },

    /** 편집/생성 모달 props. */
    editModalProps: {
      isOpen: editingItem !== null || creatingItem,
      item: creatingItem ? null : editingItem,
      mode: (creatingItem ? 'create' : 'edit') as 'create' | 'edit',
      onClose: creatingItem ? () => setCreatingItem(false) : handleEditCancel,
      onSaved: creatingItem ? handleCreated : handleSaved,
      onCreatedContinue: handleCreatedContinue,
      onPending: handleChangeRequested,
    },

    /** 삭제 확인 다이얼로그 props. */
    deleteDialogProps: {
      item: deletingItem,
      onClose: () => setDeletingItem(null),
      onDeleted: handleDeleted,
      onPending: handleChangeRequested,
    },
  };
}

export type StdItemsDashboard = ReturnType<typeof useStdItemsDashboard>;

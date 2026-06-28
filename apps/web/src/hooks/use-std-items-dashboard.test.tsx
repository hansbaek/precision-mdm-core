import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StdTestItem } from '@/types';

// 대시보드 훅 + 현재 location.search 를 함께 노출해 URL 동기화를 검증한다.
function useDashboardWithSearch() {
  const dash = useStdItemsDashboard('test-master');
  return { dash, search: useLocation().search };
}

// 외부 의존성(쿼리 훅/설정/토스트/i18n)을 격리해 대시보드 로직만 검증한다.
const { mockItems } = vi.hoisted(() => ({
  mockItems: [
    { id: 2, testItemName: 'B' },
    { id: 1, testItemName: 'A' },
    { id: 3, testItemName: 'C' },
  ] as unknown as StdTestItem[],
}));

vi.mock('./use-std-test-items', () => ({
  useStdTestItems: () => ({
    items: mockItems,
    setItems: vi.fn(),
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock('./use-preferences-store', () => ({
  getPreferences: () => ({
    defaultProductLine: 'TBR',
    sortBy: 'id',
    sortOrder: 'asc',
    pageSize: 20,
  }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), message: vi.fn() } }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { useStdItemsDashboard } from './use-std-items-dashboard';

/** MemoryRouter 래퍼 — useSearchParams 컨텍스트 제공. */
function makeWrapper(initialEntries: string[] = ['/test-master/dashboard']) {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );
}

describe('useStdItemsDashboard', () => {
  afterEach(() => vi.clearAllMocks());

  it('환경설정 기본값으로 초기화한다', () => {
    const { result } = renderHook(useDashboardWithSearch, { wrapper: makeWrapper() });
    expect(result.current.dash.dashboardSectionProps.filters.productLine).toBe('TBR');
    expect(result.current.dash.dashboardSectionProps.sortBy).toBe('id');
    expect(result.current.dash.dashboardSectionProps.sortOrder).toBe('asc');
    expect(result.current.dash.rawCount).toBe(3);
  });

  it('정렬 순서에 따라 목록을 정렬한다', () => {
    const { result } = renderHook(useDashboardWithSearch, { wrapper: makeWrapper() });
    expect(result.current.dash.sortedItems.map((i) => i.id)).toEqual([1, 2, 3]);

    act(() => result.current.dash.dashboardSectionProps.setSortOrder('desc'));
    expect(result.current.dash.sortedItems.map((i) => i.id)).toEqual([3, 2, 1]);
  });

  it('onReset 은 필터를 기본(ALL)으로 되돌린다', () => {
    const { result } = renderHook(useDashboardWithSearch, { wrapper: makeWrapper() });
    act(() => result.current.dash.dashboardSectionProps.onReset());
    expect(result.current.dash.dashboardSectionProps.filters).toEqual({
      productLine: 'ALL',
      searchQuery: '',
      markets: '',
    });
  });

  it('onAdd 는 생성 모달을 연다', () => {
    const { result } = renderHook(useDashboardWithSearch, { wrapper: makeWrapper() });
    expect(result.current.dash.editModalProps.isOpen).toBe(false);

    act(() => result.current.dash.dashboardSectionProps.onAdd());
    expect(result.current.dash.editModalProps.isOpen).toBe(true);
    expect(result.current.dash.editModalProps.mode).toBe('create');
    expect(result.current.dash.editModalProps.item).toBeNull();
  });

  it('openDetail 로 상세 모달을 열면 URL(?view=id)에 반영되고 닫으면 제거된다', () => {
    const { result } = renderHook(useDashboardWithSearch, { wrapper: makeWrapper() });
    expect(result.current.dash.detailModalProps.isOpen).toBe(false);

    act(() => result.current.dash.openDetail(mockItems[0]));
    expect(result.current.dash.detailModalProps.isOpen).toBe(true);
    expect(result.current.dash.detailModalProps.item?.id).toBe(2);
    expect(result.current.search).toBe('?view=2');

    act(() => result.current.dash.detailModalProps.onClose());
    expect(result.current.dash.detailModalProps.isOpen).toBe(false);
    expect(result.current.search).toBe('');
  });

  it('?view=<id> 딥링크로 진입하면 해당 상세 모달이 열린다', () => {
    const { result } = renderHook(useDashboardWithSearch, {
      wrapper: makeWrapper(['/test-master/dashboard?view=3']),
    });
    expect(result.current.dash.detailModalProps.isOpen).toBe(true);
    expect(result.current.dash.detailModalProps.item?.id).toBe(3);
  });

  it('목록에 없는 id 로 진입하면 상세는 열리지 않는다(graceful)', () => {
    const { result } = renderHook(useDashboardWithSearch, {
      wrapper: makeWrapper(['/test-master/dashboard?view=999']),
    });
    expect(result.current.dash.detailModalProps.isOpen).toBe(false);
  });
});

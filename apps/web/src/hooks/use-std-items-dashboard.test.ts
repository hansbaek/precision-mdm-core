import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StdTestItem } from '@/types';

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

describe('useStdItemsDashboard', () => {
  afterEach(() => vi.clearAllMocks());

  it('환경설정 기본값으로 초기화한다', () => {
    const { result } = renderHook(() => useStdItemsDashboard('test-master'));
    expect(result.current.dashboardSectionProps.filters.productLine).toBe('TBR');
    expect(result.current.dashboardSectionProps.sortBy).toBe('id');
    expect(result.current.dashboardSectionProps.sortOrder).toBe('asc');
    expect(result.current.rawCount).toBe(3);
  });

  it('정렬 순서에 따라 목록을 정렬한다', () => {
    const { result } = renderHook(() => useStdItemsDashboard('test-master'));
    expect(result.current.sortedItems.map((i) => i.id)).toEqual([1, 2, 3]);

    act(() => result.current.dashboardSectionProps.setSortOrder('desc'));
    expect(result.current.sortedItems.map((i) => i.id)).toEqual([3, 2, 1]);
  });

  it('onReset 은 필터를 기본(ALL)으로 되돌린다', () => {
    const { result } = renderHook(() => useStdItemsDashboard('test-master'));
    act(() => result.current.dashboardSectionProps.onReset());
    expect(result.current.dashboardSectionProps.filters).toEqual({
      productLine: 'ALL',
      searchQuery: '',
      markets: '',
    });
  });

  it('onAdd 는 생성 모달을 연다', () => {
    const { result } = renderHook(() => useStdItemsDashboard('test-master'));
    expect(result.current.editModalProps.isOpen).toBe(false);

    act(() => result.current.dashboardSectionProps.onAdd());
    expect(result.current.editModalProps.isOpen).toBe(true);
    expect(result.current.editModalProps.mode).toBe('create');
    expect(result.current.editModalProps.item).toBeNull();
  });

  it('openDetail 로 상세 모달을 열고 닫는다', () => {
    const { result } = renderHook(() => useStdItemsDashboard('test-master'));
    expect(result.current.detailModalProps.isOpen).toBe(false);

    act(() => result.current.openDetail(mockItems[0]));
    expect(result.current.detailModalProps.isOpen).toBe(true);
    expect(result.current.detailModalProps.item?.id).toBe(2);

    act(() => result.current.detailModalProps.onClose());
    expect(result.current.detailModalProps.isOpen).toBe(false);
  });
});

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStdTestItems } from '@/api/template';
import type { FilterOptions, StdTestItem } from '@/types';

const STD_ITEM_MODULES = new Set(['test-master', 'testing-protocols']);

export function useStdTestItems(activeModule: string, appliedFilters: FilterOptions) {
  const queryClient = useQueryClient();

  // 필터 값으로 키를 구성 — 객체 identity 변화가 아니라 실제 값이 바뀔 때만
  // 재조회된다(기존 effect deps의 appliedFilters 객체 churn 문제 해소).
  const queryKey = useMemo(
    () =>
      [
        'std-test-items',
        {
          productLine: appliedFilters.productLine,
          search: appliedFilters.searchQuery,
          markets: appliedFilters.markets,
        },
      ] as const,
    [appliedFilters.productLine, appliedFilters.searchQuery, appliedFilters.markets],
  );

  const query = useQuery({
    queryKey,
    queryFn: () =>
      getStdTestItems({
        productLine: appliedFilters.productLine,
        search: appliedFilters.searchQuery,
        markets: appliedFilters.markets,
      }),
    // test-master / testing-protocols 모듈에서만 조회(기존 모듈 가드 유지).
    enabled: STD_ITEM_MODULES.has(activeModule),
  });

  // 생성/수정/삭제 성공 후 현재 필터 키의 캐시를 직접 갱신한다.
  // (기존 setItems 의미 그대로 — 함수형/직접 값 모두 지원)
  const setItems = useCallback(
    (updater: StdTestItem[] | ((prev: StdTestItem[]) => StdTestItem[])) => {
      queryClient.setQueryData<StdTestItem[]>(queryKey, (prev) => {
        const base = prev ?? [];
        return typeof updater === 'function' ? updater(base) : updater;
      });
    },
    [queryClient, queryKey],
  );

  return {
    items: query.data ?? [],
    setItems,
    loading: query.isFetching,
    error: query.isError
      ? '데이터를 불러오지 못했습니다. API 서버 연결을 확인해주세요.'
      : null,
    reload: () => void query.refetch(),
  };
}

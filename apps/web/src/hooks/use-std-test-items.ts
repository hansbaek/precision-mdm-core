import { useEffect, useState } from 'react';
import { getStdTestItems } from '@/api/template';
import type { FilterOptions, StdTestItem } from '@/types';

const STD_ITEM_MODULES = new Set(['test-master', 'testing-protocols']);

export function useStdTestItems(activeModule: string, appliedFilters: FilterOptions) {
  const [items, setItems] = useState<StdTestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!STD_ITEM_MODULES.has(activeModule)) return;

    let ignore = false;

    const loadStdItems = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getStdTestItems({
          productLine: appliedFilters.productLine,
          search: appliedFilters.searchQuery,
          markets: appliedFilters.markets,
        });
        if (!ignore) {
          setItems(data);
        }
      } catch {
        if (!ignore) {
          setError('데이터를 불러오지 못했습니다. API 서버 연결을 확인해주세요.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadStdItems();

    return () => {
      ignore = true;
    };
  }, [activeModule, appliedFilters, reloadKey]);

  const reload = () => setReloadKey((current) => current + 1);

  return {
    items,
    setItems,
    loading,
    error,
    reload,
  };
}

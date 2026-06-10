import { useEffect, useState } from 'react';
import { getStdStats } from '@/api/template';
import type { StdStats } from '@/types';

const STATS_TABS = new Set(['analytics', 'reports']);

export function useStdStats(activeTab: string) {
  const [stats, setStats] = useState<StdStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!STATS_TABS.has(activeTab)) return;

    let ignore = false;

    const loadStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getStdStats();
        if (!ignore) {
          setStats(data);
        }
      } catch {
        if (!ignore) {
          setError('통계 데이터를 불러오지 못했습니다. API 서버 연결을 확인해주세요.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadStats();

    return () => {
      ignore = true;
    };
  }, [activeTab, reloadKey]);

  const reload = () => setReloadKey((current) => current + 1);

  return {
    stats,
    loading,
    error,
    reload,
  };
}

import { useQuery } from '@tanstack/react-query';
import { getStdStats } from '@/api/template';

const STATS_TABS = new Set(['analytics', 'reports']);

export function useStdStats(activeTab: string) {
  const query = useQuery({
    queryKey: ['std-stats'],
    queryFn: getStdStats,
    // analytics/reports 탭에서만 조회(기존 탭 가드 유지).
    enabled: STATS_TABS.has(activeTab),
    // 통계는 자주 바뀌지 않으므로 1분간 신선한 것으로 간주.
    staleTime: 60_000,
  });

  return {
    stats: query.data ?? null,
    loading: query.isFetching,
    error: query.isError
      ? '통계 데이터를 불러오지 못했습니다. API 서버 연결을 확인해주세요.'
      : null,
    reload: () => void query.refetch(),
  };
}

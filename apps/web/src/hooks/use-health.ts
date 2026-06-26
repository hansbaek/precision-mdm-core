import { useQuery } from '@tanstack/react-query';
import { getHealth } from '@/api/health';

/** 시스템 상태: 점검중(초기 로딩) → 정상 / 일부 장애 / 오프라인. */
export type HealthStatus = 'checking' | 'online' | 'degraded' | 'offline';

const POLL_INTERVAL_MS = 30_000;

/**
 * 백엔드 /health를 주기적으로 폴링해 시스템 상태를 반환한다.
 * - online: status === 'ok'
 * - degraded: 응답은 받았으나 일부 인디케이터 실패(status === 'error')
 * - offline: 네트워크/서버 무응답
 */
export function useHealth(): HealthStatus {
  const { data, isError } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    // 백그라운드에서도 30초마다 계속 프로빙(기존 setInterval 동작 유지).
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    // 상태 표시기는 항상 최신이어야 하므로 캐시를 신선하게 두지 않는다.
    staleTime: 0,
    // 무응답은 즉시 'offline'으로 표시 — 재시도로 지연시키지 않는다.
    retry: false,
  });

  if (isError) return 'offline';
  if (!data) return 'checking';
  return data.status === 'ok' ? 'online' : 'degraded';
}

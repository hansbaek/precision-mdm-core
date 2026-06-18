import { useEffect, useState } from 'react';
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
  const [status, setStatus] = useState<HealthStatus>('checking');

  useEffect(() => {
    let ignore = false;

    const probe = async () => {
      try {
        const res = await getHealth();
        if (!ignore) {
          setStatus(res.status === 'ok' ? 'online' : 'degraded');
        }
      } catch {
        if (!ignore) {
          setStatus('offline');
        }
      }
    };

    void probe();
    const timer = window.setInterval(() => void probe(), POLL_INTERVAL_MS);

    return () => {
      ignore = true;
      window.clearInterval(timer);
    };
  }, []);

  return status;
}

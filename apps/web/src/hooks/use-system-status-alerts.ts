import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useHealth, type HealthStatus } from '@/hooks/use-health';
import { usePreferencesStore } from '@/hooks/use-preferences-store';

/**
 * 시스템 상태 전환 시 토스트로 알린다(설정에서 켜진 경우만).
 * - online → degraded/offline: 경고/오류
 * - degraded/offline → online: 복구 안내
 */
export function useSystemStatusAlerts() {
  const status = useHealth();
  const notify = usePreferencesStore((s) => s.notifySystemStatus);
  const { t } = useTranslation();
  const prev = useRef<HealthStatus>('checking');

  useEffect(() => {
    const before = prev.current;
    prev.current = status;

    if (!notify) return;
    if (status === before) return;
    // 최초 checking → online 정착은 알리지 않는다.
    if (before === 'checking' && status === 'online') return;

    if (status === 'offline') {
      toast.error(t('health.offline'));
    } else if (status === 'degraded') {
      toast.warning(t('health.degraded'));
    } else if (
      status === 'online' &&
      (before === 'offline' || before === 'degraded')
    ) {
      toast.success(t('health.recovered'));
    }
  }, [status, notify, t]);
}

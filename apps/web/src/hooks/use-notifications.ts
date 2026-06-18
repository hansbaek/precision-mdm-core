import { useCallback, useEffect, useState } from 'react';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationView,
} from '@/api/notifications';

const POLL_INTERVAL_MS = 30_000;

/**
 * 내 알림을 주기적으로 폴링한다. 토큰이 있을 때만 동작하도록 호출 측에서 마운트 제어.
 */
export function useNotifications() {
  const [items, setItems] = useState<NotificationView[]>([]);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await getNotifications();
      if (res.ok && res.result) {
        setItems(res.result.items);
        setUnread(res.result.unread);
      }
    } catch {
      /* 폴링 실패는 무시(다음 주기 재시도). */
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const poll = async () => {
      try {
        const res = await getNotifications();
        if (!ignore && res.ok && res.result) {
          setItems(res.result.items);
          setUnread(res.result.unread);
        }
      } catch {
        /* 폴링 실패는 무시(다음 주기 재시도). */
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      ignore = true;
      window.clearInterval(timer);
    };
  }, []);

  const markRead = useCallback(
    async (notiId: number) => {
      // 낙관적 반영 후 서버 동기화. 실패 시 서버 상태로 재조회.
      setItems((prev) =>
        prev.map((n) => (n.notiId === notiId ? { ...n, isRead: true } : n)),
      );
      setUnread((u) => Math.max(0, u - 1));
      try {
        await markNotificationRead(notiId);
      } catch {
        void refresh();
      }
    },
    [refresh],
  );

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await markAllNotificationsRead();
    } catch {
      void refresh();
    }
  }, [refresh]);

  return { items, unread, markRead, markAllRead, refresh };
}

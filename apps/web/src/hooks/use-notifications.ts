import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CommonReturnType } from '@/api';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationView,
} from '@/api/notifications';

const POLL_INTERVAL_MS = 30_000;
const NOTIFICATIONS_KEY = ['notifications'] as const;

type NotificationsData = CommonReturnType<{
  items: NotificationView[];
  unread: number;
}>;

/**
 * 내 알림을 30초마다 폴링한다. 토큰이 있을 때만 마운트되도록 호출 측에서 제어.
 * 읽음 처리는 낙관적으로 즉시 반영하고, 실패 시 서버 상태로 재조회한다.
 */
export function useNotifications() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: getNotifications,
    // 백그라운드에서도 계속 폴링(기존 setInterval 동작 유지).
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  const items = data?.result?.items ?? [];
  const unread = data?.result?.unread ?? 0;

  // 낙관 반영 실패 시 서버 진실로 재동기화.
  const resyncOnError = () =>
    void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onMutate: (notiId: number) => {
      queryClient.setQueryData<NotificationsData>(NOTIFICATIONS_KEY, (prev) => {
        if (!prev?.result) return prev;
        return {
          ...prev,
          result: {
            items: prev.result.items.map((n) =>
              n.notiId === notiId ? { ...n, isRead: true } : n,
            ),
            unread: Math.max(0, prev.result.unread - 1),
          },
        };
      });
    },
    onError: resyncOnError,
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: () => {
      queryClient.setQueryData<NotificationsData>(NOTIFICATIONS_KEY, (prev) => {
        if (!prev?.result) return prev;
        return {
          ...prev,
          result: {
            items: prev.result.items.map((n) => ({ ...n, isRead: true })),
            unread: 0,
          },
        };
      });
    },
    onError: resyncOnError,
  });

  // mutate 는 렌더 간 안정적이므로 그대로 노출한다.
  // markRead(notiId) / markAllRead() 시그니처가 호출부와 일치.
  return {
    items,
    unread,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
  };
}

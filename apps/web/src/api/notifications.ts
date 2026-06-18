import { type CommonReturnType, axiosInstance } from '.';

export type NotificationType =
  | 'CHANGE_REQUEST_SUBMITTED'
  | 'CHANGE_REQUEST_APPROVED'
  | 'CHANGE_REQUEST_REJECTED'
  | 'SYSTEM';

export interface NotificationView {
  notiId: number;
  type: NotificationType;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

/** 내 알림 목록 + 안읽음 개수. */
export const getNotifications = (): Promise<
  CommonReturnType<{ items: NotificationView[]; unread: number }>
> => axiosInstance.get('/notifications').then((res) => res.data);

/** 단건 읽음 처리. */
export const markNotificationRead = (
  notiId: number,
): Promise<CommonReturnType<null>> =>
  axiosInstance.post(`/notifications/${notiId}/read`).then((res) => res.data);

/** 전체 읽음 처리. */
export const markAllNotificationsRead = (): Promise<CommonReturnType<null>> =>
  axiosInstance.post('/notifications/read-all').then((res) => res.data);

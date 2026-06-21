import { type CommonReturnType, axiosInstance } from '.';

export type ChangeOperation = 'CREATE' | 'UPDATE' | 'DELETE';
export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ChangeRequestView {
  crId: number;
  operation: ChangeOperation;
  targetId: number | null;
  summary: string | null;
  payload: unknown;
  requesterId: string;
  status: ChangeRequestStatus;
  reviewerId: string | null;
  reviewComment: string | null;
  createdAt: string;
  reviewedAt: string | null;
  /** 대기 목록 한정: 제출 이후 대상이 변경/삭제되어 승인 시 차단됨. */
  stale?: boolean;
}

/** 내가 제출한 변경요청. */
export const getMyChangeRequests = (): Promise<
  CommonReturnType<ChangeRequestView[]>
> => axiosInstance.get('/change-requests/mine').then((res) => res.data);

/** 승인 대기 목록 (승인권자). */
export const getPendingChangeRequests = (): Promise<
  CommonReturnType<ChangeRequestView[]>
> => axiosInstance.get('/change-requests/pending').then((res) => res.data);

/** 변경요청 승인 — 실제 데이터에 반영. */
export const approveChangeRequest = (
  crId: number,
): Promise<CommonReturnType<ChangeRequestView>> =>
  axiosInstance.post(`/change-requests/${crId}/approve`).then((res) => res.data);

/** 변경요청 반려. */
export const rejectChangeRequest = (
  crId: number,
  comment?: string,
): Promise<CommonReturnType<ChangeRequestView>> =>
  axiosInstance
    .post(`/change-requests/${crId}/reject`, { comment })
    .then((res) => res.data);

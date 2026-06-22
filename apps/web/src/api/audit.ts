import { axiosInstance } from '.';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'BULK_UPLOAD'
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'PERM_CHANGE';
export type AuditSource =
  | 'API'
  | 'APPROVAL'
  | 'EXCEL_UPLOAD'
  | 'AUTH'
  | 'ADMIN';

export interface AuditFieldChange {
  column: string;
  before: string | null;
  after: string | null;
}

export interface AuditLog {
  auditId: number;
  entityType: string;
  entityId: string | null;
  action: AuditAction;
  actorId: string;
  source: AuditSource;
  changes: AuditFieldChange[] | null;
  summary: string | null;
  createdAt: string;
}

export interface AuditQuery {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  action?: string;
  source?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

/** 변경 이력 조회(최신순, 페이징). data-audit 권한 필요. */
export const fetchAuditLogs = (
  query: AuditQuery,
): Promise<{ rows: AuditLog[]; total: number }> =>
  axiosInstance
    .get('/audit/logs', { params: query })
    .then((res) => res.data);

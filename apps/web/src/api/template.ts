import { axiosInstance, fileTimestamp } from './index';
import type { StdStats, StdTestItem } from '@/types';

export const downloadTemplateXlsx = async (): Promise<void> => {
  // axiosInstance 를 사용해 JWT 토큰을 자동 첨부(전역 인증 가드 통과).
  const response = await axiosInstance.get('/template/download', {
    responseType: 'blob',
  });

  const blob = response.data as Blob;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `TEMPLATE_STD_TEST_ITEM_${fileTimestamp()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export interface StdTestItemFilters {
  productLine?: string;
  search?: string;
  markets?: string;
}

export const getStdTestItems = (filters: StdTestItemFilters = {}): Promise<StdTestItem[]> => {
  const params: Record<string, string> = {};
  if (filters.productLine && filters.productLine !== 'ALL') params.productLine = filters.productLine;
  if (filters.search) params.search = filters.search;
  if (filters.markets) params.markets = filters.markets;
  return axiosInstance.get('/template/std-test-items', { params }).then(res => res.data);
};

/** 단건 조회 — 승인 검토 시 현재값(이전값) 비교용. */
export const getStdTestItem = (id: number): Promise<StdTestItem> =>
  axiosInstance.get(`/template/std-test-items/${id}`).then(res => res.data);

export type StdTestItemUpdate = Partial<{
  productLine: string;
  testItemName: string;
  testMethod: string;
  testCondition: string;
  cdnPattern: string;
  endurSvrty: string;
  certiTestYn: string;
  certiType: string;
  tempTire: string;
  snowMark: string;
  frt: string;
  utqg: string;
  por: string;
  radialBias: string;
  rimInch: string;
  grvDepth: string;
  ss: string;
  li: string;
  plyRating: string;
  tlIndicator: string;
  tbrPosition: string;
  tbrGrv3: string;
  tbrSegment: string;
  tbrItemCntPerBarcode: string;
  newSizeYn: string;
  sizeSmpl: string;
  markets: string;
}>;

/**
 * 승인 워크플로 결과. 승인권자는 즉시 반영(applied=true, result 포함),
 * 그 외 사용자는 승인 대기 등록(applied=false, crId 포함).
 */
export type SubmitResult<T> =
  | { applied: true; result: T }
  | { applied: false; crId: number };

export const updateStdTestItem = (
  id: number,
  data: StdTestItemUpdate,
): Promise<SubmitResult<StdTestItem>> =>
  axiosInstance.patch(`/template/std-test-items/${id}`, data).then(res => res.data);

/** Create — PRODUCT_LINE & TEST_ITEM_NAME required; TMPLT_ID/CREATED_AT server-assigned. */
export type StdTestItemCreate = StdTestItemUpdate & {
  productLine: string;
  testItemName: string;
};

export const createStdTestItem = (
  data: StdTestItemCreate,
): Promise<SubmitResult<StdTestItem>> =>
  axiosInstance.post('/template/std-test-items', data).then(res => res.data);

/** Hard delete — removes the row permanently (또는 승인 대기). */
export const deleteStdTestItem = (
  id: number,
): Promise<SubmitResult<{ deleted: true; id: number }>> =>
  axiosInstance.delete(`/template/std-test-items/${id}`).then(res => res.data);

export const getStdStats = (): Promise<StdStats> =>
  axiosInstance.get('/template/stats').then(res => res.data);

// ── Excel Template Upload (sync) ──────────────────────────────────────────

export type UploadErrorCode = 'INVALID_ID' | 'DUPLICATE_ID' | 'UNKNOWN_ID' | 'CELL_ERROR';

export interface UploadRowError {
  rowNumber: number;
  code: UploadErrorCode;
  message: string;
}

export interface UploadChange {
  column: string;
  before: string | null;
  after: string | null;
}

export interface UploadSummary {
  inserts: number;
  updates: number;
  deletes: number;
  unchanged: number;
}

export interface UploadPreviewResult {
  sheetName: string;
  fileRowCount: number;
  dbRowCount: number;
  valid: boolean;
  summary: UploadSummary;
  inserts: { rowNumber: number; values: Record<string, string | null>; markets: string[] }[];
  updates: { rowNumber: number; id: number; testItemName: string; changes: UploadChange[] }[];
  deletes: { id: number; productLine: string; testItemName: string }[];
  errors: UploadRowError[];
  warnings: { code: 'MASS_DELETE'; message: string }[];
}

export interface UploadApplyResult {
  applied: true;
  summary: Omit<UploadSummary, 'unchanged'>;
}

export const previewTemplateUpload = (file: File): Promise<UploadPreviewResult> => {
  const fd = new FormData();
  fd.append('file', file);
  return axiosInstance.post('/template/upload/preview', fd).then(res => res.data);
};

export const applyTemplateUpload = (file: File, force = false): Promise<UploadApplyResult> => {
  const fd = new FormData();
  fd.append('file', file);
  return axiosInstance
    .post('/template/upload/apply', fd, { params: force ? { force: 'true' } : {} })
    .then(res => res.data);
};

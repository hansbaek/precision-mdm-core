import { BASE_URL, axiosInstance } from './index';
import type { StdStats, StdTestItem } from '@/types';

export const downloadTemplateXlsx = async (): Promise<void> => {
  const response = await fetch(`${BASE_URL}/template/download`);
  if (!response.ok) throw new Error('Template download failed');

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'TEMPLATE_STD_TEST_ITEM.xlsx';
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

export const updateStdTestItem = (id: number, data: StdTestItemUpdate): Promise<StdTestItem> =>
  axiosInstance.patch(`/template/std-test-items/${id}`, data).then(res => res.data);

/** Create — PRODUCT_LINE & TEST_ITEM_NAME required; TMPLT_ID/CREATED_AT server-assigned. */
export type StdTestItemCreate = StdTestItemUpdate & {
  productLine: string;
  testItemName: string;
};

export const createStdTestItem = (data: StdTestItemCreate): Promise<StdTestItem> =>
  axiosInstance.post('/template/std-test-items', data).then(res => res.data);

/** Hard delete — removes the row permanently. */
export const deleteStdTestItem = (id: number): Promise<{ deleted: true; id: number }> =>
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

export type UploadErrorCode =
  | 'INVALID_ID'
  | 'DUPLICATE_ID'
  | 'UNKNOWN_ID'
  | 'CELL_ERROR';

export interface UploadRowError {
  /** Excel row number (1-based, header = row 1) */
  rowNumber: number;
  code: UploadErrorCode;
  message: string;
}

export interface UploadChange {
  column: string;
  before: string | null;
  after: string | null;
}

export interface UploadInsertRow {
  rowNumber: number;
  values: Record<string, string | null>;
  markets: string[];
}

export interface UploadUpdateRow {
  rowNumber: number;
  id: number;
  testItemName: string;
  changes: UploadChange[];
}

export interface UploadDeleteRow {
  id: number;
  productLine: string;
  testItemName: string;
}

export interface UploadWarning {
  code: 'MASS_DELETE';
  message: string;
}

export interface UploadSummary {
  inserts: number;
  updates: number;
  deletes: number;
  unchanged: number;
}

export interface UploadPreviewResponse {
  sheetName: string;
  fileRowCount: number;
  dbRowCount: number;
  valid: boolean;
  summary: UploadSummary;
  inserts: UploadInsertRow[];
  updates: UploadUpdateRow[];
  deletes: UploadDeleteRow[];
  errors: UploadRowError[];
  warnings: UploadWarning[];
}

export interface UploadApplyResponse {
  applied: true;
  summary: Omit<UploadSummary, 'unchanged'>;
}

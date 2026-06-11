export const TABLE_NAME = 'TEMPLATE_STD_TEST_ITEM';

export const PK_COL = 'TMPLT_ID';

/** Server-managed audit columns — never written from uploaded files. */
export const AUDIT_COLS = ['CREATED_AT', 'CREATED_BY'] as const;

/** 38 market flag columns, in fixed display order (matches ALL_MARKETS on the web side). */
export const MARKET_COLS = [
  'F1',
  'F2',
  'F3',
  'A0',
  'A1',
  'A2',
  'A3',
  'A4',
  'A5',
  'A6',
  'A7',
  'A8',
  'A9',
  'N1',
  'N2',
  'N3',
  'E1',
  'E2',
  'E3',
  'E4',
  'E5',
  'E6',
  'K1',
  'M1',
  'M2',
  'M3',
  'M4',
  'M5',
  'M6',
  'NA',
  'L1',
  'L2',
  'L3',
  'L4',
  'L5',
  'L6',
  'L7',
  'L8',
] as const;

export type MarketCol = (typeof MARKET_COLS)[number];

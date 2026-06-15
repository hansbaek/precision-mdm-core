/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


export interface UserProfile {
  userId: string;
  userName: string;
  userNameEng: string;
  teamName: string;
  teamNameEng: string;
  role: string;
}

export interface FilterOptions {
  productLine: string;
  searchQuery: string;
  markets: string;
}

export interface StdCode {
  codeGrpId: string;
  codeCd: string;
  codeNm: string;
  codeDesc: string;
  sortOrder: number;
  useYn: string;
}

export const ALL_MARKETS = [
  'F1', 'F2', 'F3',
  'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9',
  'N1', 'N2', 'N3',
  'E1', 'E2', 'E3', 'E4', 'E5', 'E6',
  'K1',
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6',
  'NA',
  'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8',
] as const;

export type MarketCode = (typeof ALL_MARKETS)[number];

export interface StdTestItem {
  id: number;
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
  markets: string[];
  marketFlags: Record<MarketCode, string>;
  createdAt: string;
  createdBy: string;
}

export interface StdStats {
  total: number;
  distinctProductLines: number;
  distinctTestMethods: number;
  distinctTestItems: number;
  avgMarketsPerItem: number;
  noMarketCount: number;
  byProductLine: { name: string; count: number }[];
  byTestMethod: { name: string; count: number }[];
  byTestItem: { name: string; count: number }[];
  marketCoverage: { code: string; count: number }[];
  recent: StdTestItem[];
}

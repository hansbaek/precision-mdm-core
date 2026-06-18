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

export type PermissionAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve';

/** 한 메뉴에 대한 현재 사용자의 권한 (백엔드 /auth/me·signin 응답). */
export interface MenuPermission {
  menuId: string;
  menuType: 'MODULE' | 'TAB';
  parentId: string | null;
  i18nKey: string | null;
  sortOrder: number | null;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  /** 변경 요청을 직접 반영·검토(승인/반려)할 수 있는가. */
  canApprove: boolean;
}

/** 사용자 표시 환경설정 (서버 동기화). 미설정 사용자는 null. */
export interface UserPreferences {
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  defaultProductLine: string;
  density: 'comfortable' | 'compact';
  notifySystemStatus: boolean;
}

/** 로그인 성공 응답. */
export interface AuthSession {
  /** 단기 액세스 토큰(JWT). */
  token: string;
  /** 장기 리프레시 토큰. 갱신마다 회전된다. */
  refreshToken: string;
  profile: UserProfile;
  menus: MenuPermission[];
  preferences: UserPreferences | null;
}

// ---- 관리자(권한 관리) ----
export interface AdminRole {
  roleId: string;
  roleNm: string;
  isSystemYn: string;
  sortOrder: number | null;
  useYn: string;
}

export interface AdminMenu {
  menuId: string;
  parentId: string | null;
  menuType: 'MODULE' | 'TAB';
  menuNm: string | null;
  i18nKey: string | null;
  sortOrder: number | null;
  useYn: string;
}

export interface RoleMenuPermission {
  menuId: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

export interface AdminUser {
  userId: string;
  userNm: string | null;
  userNmEng: string | null;
  teamNm: string | null;
  teamNmEng: string | null;
  authSource: string;
  roleId: string;
  roleNm: string | null;
  useYn: string;
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

/**
 * mcode → 필요 시험 매칭 상수.
 * 마켓 코드 체계 3종 중 template/md.MAIN_MKT 가 쓰는 38개 개별코드가 매칭 기준.
 */

/** 1자리 main_market(지역) → 38 개별 마켓코드 셋. (데이터 검증: scripts/verify-market-mapping.cjs) */
export const REGION_MAP: Record<string, string[]> = {
  A: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9'],
  C: ['A3'], // 중국
  E: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'],
  K: ['K1'], // 한국
  M: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'], // 중동
  N: ['NA'], // 북미
};

/**
 * 38 마켓코드 → 지역 그룹코드 (DW_STD_MARKET.MARKET_GROUP_CODE 기준).
 * `main_market`이 비었거나 OEM(2자리)일 때, md.MAIN_MKT를 그룹 단위로 집계해
 * 가장 많은 그룹을 대표마켓으로 삼는 데 사용. (E1~E6=EU 처럼 그룹이 다수면 그 그룹이 대표)
 */
export const CODE_TO_GROUP: Record<string, string> = {
  NA: 'NA',
  M1: 'ME', M2: 'ME', M3: 'ME', M4: 'ME', M5: 'ME', M6: 'ME',
  F1: 'AF', F2: 'AF', F3: 'AF',
  A1: 'AP', A2: 'AP', A3: 'AP', A5: 'AP', A7: 'AP',
  A0: 'AI', A4: 'AI', A6: 'AI', A8: 'AI', A9: 'AI', N1: 'AI', N2: 'AI', N3: 'AI',
  L1: 'SA', L2: 'SA', L3: 'SA', L4: 'SA', L5: 'SA', L6: 'SA', L7: 'SA', L8: 'SA',
  E1: 'EU', E2: 'EU', E3: 'EU', E4: 'EU', E5: 'EU', E6: 'EU',
  K1: 'KR',
};

/** 38개 표준 마켓코드 (md.MAIN_MKT 토큰 검증용). */
export const MARKET_38 = new Set<string>([
  'F1', 'F2', 'F3', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9',
  'N1', 'N2', 'N3', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'K1', 'M1', 'M2', 'M3',
  'M4', 'M5', 'M6', 'NA', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8',
]);

/**
 * 현재 타이어 소스에서 평가 불가한 조건 컬럼 (값이 있으면 "미평가" 경고로 표기, 행은 포함).
 *  - TEMP_TIRE / UTQG / NEW_SIZE_YN / TBR_GRV_3: 소스 추후 추가 예정
 *  - SIZE_SMPL: 특정 사이즈 샘플 지정(필터 아닌 샘플링 지시) → 매칭 제외
 */
export const DEFERRED_FILTER_COLS = [
  'TEMP_TIRE',
  'UTQG',
  'NEW_SIZE_YN',
  'TBR_GRV_3',
  'SIZE_SMPL',
] as const;

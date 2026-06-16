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

/** 38개 표준 마켓코드 (md.MAIN_MKT 토큰 검증용). */
export const MARKET_38 = new Set<string>([
  'F1', 'F2', 'F3', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9',
  'N1', 'N2', 'N3', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'K1', 'M1', 'M2', 'M3',
  'M4', 'M5', 'M6', 'NA', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8',
]);

/**
 * 현재 타이어 소스에서 평가 불가한 조건 컬럼 (값이 있으면 "미평가" 경고로 표기, 행은 포함).
 *  - RADIAL_BIAS: template 데이터가 '#'(치환자 sigil)로 오염 → 매칭 보류
 *  - TL_INDICATOR: 타이어측 소스 미확인
 *  - TEMP_TIRE / UTQG / NEW_SIZE_YN / TBR_GRV_3: 소스 추후 추가 예정
 *  - SIZE_SMPL: 특정 사이즈 샘플 지정(필터 아닌 샘플링 지시) → 매칭 제외
 */
export const DEFERRED_FILTER_COLS = [
  'RADIAL_BIAS',
  'TL_INDICATOR',
  'TEMP_TIRE',
  'UTQG',
  'NEW_SIZE_YN',
  'TBR_GRV_3',
  'SIZE_SMPL',
] as const;

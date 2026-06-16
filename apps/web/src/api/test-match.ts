import { axiosInstance } from './index';

export interface ResolvedMarket {
  /** 매칭에 사용된 38 마켓코드 셋 */
  codes: string[];
  /** 결정 근거: region:<X> | oem:<XX>→md최빈 | md최빈 | none */
  source: string;
}

export interface TireAttrs {
  mcode: string;
  productLine: string;
  mainMarket: string | null;
  market: ResolvedMarket;
  rimInch: number | null;
  ss: string | null;
  li: number | null;
  ply: number | null;
  grvDepth: number | null;
  radialBias: string | null;
  segment: string[];
  frt: string | null;
  por: string | null;
  winter: string | null;
  tirePosition: string | null;
}

export interface MatchedTest {
  id: number;
  productLine: string;
  testItemName: string;
  testMethod: string;
  testCondition: string;
  cdnPattern: string;
  endurSvrty: string;
  certiTestYn: string;
  certiType: string;
  /** 매칭에 기여한 마켓 코드(교집합) */
  marketHits: string[];
  /** 값이 있으나 평가 불가했던 조건 컬럼 (검토 필요) */
  unevaluated: string[];
}

export interface MatchResult {
  tire: TireAttrs;
  total: number;
  matchedCount: number;
  matched: MatchedTest[];
}

/** mcode 기준 필요 시험 매칭 */
export const matchTests = (mcode: string): Promise<MatchResult> =>
  axiosInstance.get('/test-match', { params: { mcode } }).then((res) => res.data);

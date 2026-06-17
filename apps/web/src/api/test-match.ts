import { axiosInstance, fileTimestamp } from './index';

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
  tireSize: string | null;
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
  tlIndicator: string | null;
}

export interface MatchedTest {
  id: number;
  productLine: string;
  testItemName: string;
  testMethod: string;
  testCondition: string;
  cdnPattern: string;
  /** CDN_PATTERN의 치환자를 타이어 실제 값으로 펼친 조건명 */
  expandedCondition: string;
  endurSvrty: string;
  certiTestYn: string;
  certiType: string;
  /** 매칭에 기여한 마켓 코드(교집합) */
  marketHits: string[];
  /** 값이 있으나 평가 불가했던 조건 컬럼 (검토 필요) */
  unevaluated: string[];
  /** 추출 이유 — 충족된 조건 목록 */
  reasons: ConditionReason[];
  /** 미평가 조건 상세 + 사유 */
  unevaluatedDetail: UnevaluatedDetail[];
}

export interface ConditionReason {
  col: string;
  templateValue: string;
  tireValue: string;
}

export interface UnevaluatedDetail {
  col: string;
  templateValue: string;
  reason: string;
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

/** 필요시험 보고서 xlsx 다운로드 */
export const exportTestMatchXlsx = async (mcode: string): Promise<void> => {
  // axiosInstance 로 JWT 토큰 자동 첨부(전역 인증 가드 통과).
  const res = await axiosInstance.get('/test-match/export', {
    params: { mcode },
    responseType: 'blob',
  });
  const blob = res.data as Blob;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `test-match-${mcode}_${fileTimestamp()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

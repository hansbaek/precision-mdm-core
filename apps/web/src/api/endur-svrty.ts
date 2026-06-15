import { axiosInstance } from './index';

export interface SvrtyCandidate {
  testCdnName: string;
  regulationCode: string;
  marketCode: string;
  rank: number;
  mandatory: boolean;
}

export interface SvrtySuggestResult {
  suggested: string | null;
  basis: SvrtyCandidate | null;
  candidates: SvrtyCandidate[];
  mandatory: { testCdnName: string; regulationCode: string }[];
  category: 'HS' | 'GE' | null;
  speedGrade: 'R_BELOW' | 'S_ABOVE' | null;
  speedGradeAssumed: boolean;
  unmappedMarkets: string[];
  reason?: 'UNSUPPORTED_METHOD' | 'NO_MARKETS' | 'NO_APPLICABLE_REGULATION';
}

/** 규제 코드 목록 — CERTI_TYPE 멀티콤보 옵션 소스 */
export const getRegulationCodes = (): Promise<string[]> =>
  axiosInstance.get('/endur-svrty/regulations').then(res => res.data);

/** 시장 기반 내구 가혹도 제안 ([별첨11] 순위 마스터 기반) */
export const suggestEndurSvrty = (params: {
  productLine: string;
  markets: string;
  testMethod?: string;
  ss?: string;
}): Promise<SvrtySuggestResult> =>
  axiosInstance.get('/endur-svrty/suggest', { params }).then(res => res.data);

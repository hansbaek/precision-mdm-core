import { axiosInstance } from './index';

/**
 * DW_HNT_CLASSIFICATION 기준 계층 조회 (mode 기본값 'Indoor' — 서버 측).
 * 수정화면의 계단식 콤보(그룹 → 항목 → 방법 → 조건) 데이터 소스.
 */

export const getTestClassificationGroups = (): Promise<string[]> =>
  axiosInstance.get('/test-classification/groups').then(res => res.data);

export const getTestClassificationItems = (group?: string): Promise<string[]> =>
  axiosInstance
    .get('/test-classification/items', { params: group ? { group } : {} })
    .then(res => res.data);

export const getTestClassificationMethods = (item: string, group?: string): Promise<string[]> =>
  axiosInstance
    .get('/test-classification/methods', { params: { item, ...(group ? { group } : {}) } })
    .then(res => res.data);

export const getTestClassificationConditions = (
  item: string,
  method: string,
  group?: string,
): Promise<string[]> =>
  axiosInstance
    .get('/test-classification/conditions', {
      params: { item, method, ...(group ? { group } : {}) },
    })
    .then(res => res.data);

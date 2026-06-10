import { BASE_URL, axiosInstance } from './index';
import type { StdStats, StdTestItem } from '@/types';

export const downloadTemplateXlsx = async (): Promise<void> => {
  const response = await fetch(`${BASE_URL}/template/download`);
  if (!response.ok) throw new Error('Template download failed');

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'TEMPLATE_STD_TEST_ITEM.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export interface StdTestItemFilters {
  productLine?: string;
  search?: string;
  markets?: string;
}

export const getStdTestItems = (filters: StdTestItemFilters = {}): Promise<StdTestItem[]> => {
  const params: Record<string, string> = {};
  if (filters.productLine && filters.productLine !== 'ALL') params.productLine = filters.productLine;
  if (filters.search) params.search = filters.search;
  if (filters.markets) params.markets = filters.markets;
  return axiosInstance.get('/template/std-test-items', { params }).then(res => res.data);
};

export type StdTestItemUpdate = Partial<{
  productLine: string;
  testItemName: string;
  testMethod: string;
  testCondition: string;
  markets: string;
}>;

export const updateStdTestItem = (id: number, data: StdTestItemUpdate): Promise<StdTestItem> =>
  axiosInstance.patch(`/template/std-test-items/${id}`, data).then(res => res.data);

export const getStdStats = (): Promise<StdStats> =>
  axiosInstance.get('/template/stats').then(res => res.data);

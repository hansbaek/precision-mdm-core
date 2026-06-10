import { axiosInstance } from './index';
import type { StdCode } from '@/types';

export const getStdCodes = (grpId: string, level?: number): Promise<StdCode[]> =>
  axiosInstance.get('/std-codes', { params: { grpId, ...(level !== undefined && { level }) } }).then((res) => res.data);

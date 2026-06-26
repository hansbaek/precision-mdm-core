import { useQuery } from '@tanstack/react-query';
import { getStdCodes, stdCodesKey } from '@/api/stdCodes';

export function useStdCodes(grpId: string, level?: number) {
  const query = useQuery({
    queryKey: stdCodesKey(grpId, level),
    queryFn: () => getStdCodes(grpId, level),
    // 표준코드는 사실상 불변 참조 데이터 — 명시적 무효화 전까지 재조회하지 않는다.
    // (관리자 편집 시 invalidateStdCodes 가 해당 그룹을 무효화)
    staleTime: Infinity,
  });

  return {
    data: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
  };
}

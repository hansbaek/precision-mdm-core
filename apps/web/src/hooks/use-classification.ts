import { useQuery } from '@tanstack/react-query';
import {
  getClassificationList,
  getClassificationModes,
} from '@/api/test-classification';

// 모드 목록 조회 실패 시 폴백(기존 동작 유지).
const FALLBACK_MODES = ['Indoor', 'Material', 'Outdoor'];

/** 분류 마스터 모드 목록. 조회 실패 시 기본 모드로 폴백. */
export function useClassificationModes(): string[] {
  const query = useQuery({
    queryKey: ['classification-modes'],
    queryFn: getClassificationModes,
  });
  if (query.isError) return FALLBACK_MODES;
  return query.data ?? [];
}

/** 모드/검색어로 분류 마스터 목록 조회. */
export function useClassificationList(mode: string, search: string) {
  const query = useQuery({
    // 값(객체 identity 아님)이 바뀔 때만 재조회.
    queryKey: ['classification-list', { mode, search }],
    queryFn: () => getClassificationList({ mode, search }),
  });

  return {
    rows: query.data ?? [],
    loading: query.isFetching,
    error: query.isError ? '분류 마스터를 불러오지 못했습니다.' : null,
  };
}

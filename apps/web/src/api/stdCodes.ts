import { axiosInstance } from './index';
import { queryClient } from '@/lib/query-client';
import type {
  StdCode,
  StdCodeCreate,
  StdCodeGroup,
  StdCodeNode,
  StdCodeUpdate,
} from '@/types';

/**
 * 표준코드는 세션 내내 사실상 불변인 참조 데이터다. 캐싱·dedup·무효화는
 * TanStack Query가 담당한다(useStdCodes 훅이 staleTime: Infinity 로 조회).
 * 쿼리 키는 ['std-codes', grpId, level] 형태이며, 관리자 편집 직후
 * invalidateStdCodes() 로 해당 그룹을 무효화하면 다음 조회부터 최신 값을 받는다.
 */
export const stdCodesKey = (grpId: string, level?: number) =>
  ['std-codes', grpId, level] as const;

export const getStdCodes = (grpId: string, level?: number): Promise<StdCode[]> =>
  axiosInstance
    .get('/std-codes', { params: { grpId, ...(level !== undefined && { level }) } })
    .then((res) => res.data);

/**
 * 표준코드 쿼리 무효화. grpId를 주면 해당 그룹의 모든 level 키를(접두 매칭),
 * 생략하면 전체를 무효화한다. 관리자 화면에서 편집 성공 후 호출한다.
 */
export const invalidateStdCodes = (grpId?: string): void => {
  void queryClient.invalidateQueries({
    queryKey: grpId === undefined ? ['std-codes'] : ['std-codes', grpId],
  });
};

// ---------- 관리(표준코드 관리) — admin 권한 ----------

/** 코드 그룹 목록(좌측 패널). */
export const getStdCodeGroups = (): Promise<StdCodeGroup[]> =>
  axiosInstance.get('/std-codes/groups').then((res) => res.data);

/** 선택 그룹의 코드 트리(모든 레벨·USE_YN 무관). */
export const getStdCodeTree = (grpId: string): Promise<StdCodeNode[]> =>
  axiosInstance
    .get('/std-codes/tree', { params: { grpId } })
    .then((res) => res.data);

/** 표준코드 생성. 성공 후 드롭다운 캐시를 무효화한다. */
export const createStdCode = async (
  payload: StdCodeCreate,
): Promise<StdCode> => {
  const res = await axiosInstance.post('/std-codes', payload);
  invalidateStdCodes(payload.codeGrpId);
  return res.data;
};

/** 표준코드 수정(PK·계층 불변). */
export const updateStdCode = async (
  grpId: string,
  lvl: number,
  cd: string,
  payload: StdCodeUpdate,
): Promise<StdCode> => {
  const res = await axiosInstance.patch(
    `/std-codes/${encodeURIComponent(grpId)}/${lvl}/${encodeURIComponent(cd)}`,
    payload,
  );
  invalidateStdCodes(grpId);
  return res.data;
};

/**
 * 표준코드 이동/정렬(트리 드래그&드롭). newParentCd 생략=루트, beforeCd 생략=맨 뒤.
 */
export const moveStdCode = async (
  grpId: string,
  lvl: number,
  cd: string,
  payload: { newParentCd?: string; beforeCd?: string },
): Promise<void> => {
  await axiosInstance.patch(
    `/std-codes/${encodeURIComponent(grpId)}/${lvl}/${encodeURIComponent(cd)}/move`,
    payload,
  );
  invalidateStdCodes(grpId);
};

/** 표준코드 삭제(USE_YN='N'). */
export const deleteStdCode = async (
  grpId: string,
  lvl: number,
  cd: string,
): Promise<void> => {
  await axiosInstance.delete(
    `/std-codes/${encodeURIComponent(grpId)}/${lvl}/${encodeURIComponent(cd)}`,
  );
  invalidateStdCodes(grpId);
};

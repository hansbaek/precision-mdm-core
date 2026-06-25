import { axiosInstance } from './index';
import type {
  StdCode,
  StdCodeCreate,
  StdCodeGroup,
  StdCodeNode,
  StdCodeUpdate,
} from '@/types';

/**
 * 표준코드는 세션 내내 사실상 불변인 참조 데이터다.
 * 진행 중(in-flight) 프로미스 단위로 캐싱해 StrictMode 더블 호출·페이지
 * 이동 재조회·동시 요청을 모두 dedup 한다. 관리자 편집 직후 즉시 반영이
 * 필요하면 invalidateStdCodes() 로 해당 키만 비운다.
 */
const cache = new Map<string, Promise<StdCode[]>>();

const cacheKey = (grpId: string, level?: number) =>
  `${grpId}|${level ?? ''}`;

const fetchStdCodes = (grpId: string, level?: number): Promise<StdCode[]> =>
  axiosInstance
    .get('/std-codes', { params: { grpId, ...(level !== undefined && { level }) } })
    .then((res) => res.data);

export const getStdCodes = (grpId: string, level?: number): Promise<StdCode[]> => {
  const key = cacheKey(grpId, level);
  const cached = cache.get(key);
  if (cached) return cached;

  const promise = fetchStdCodes(grpId, level).catch((err) => {
    // 실패한 프로미스는 캐시에 남기지 않아 다음 호출에서 재시도되게 한다.
    cache.delete(key);
    throw err;
  });
  cache.set(key, promise);
  return promise;
};

/**
 * 캐시 무효화. 인자를 주면 해당 그룹의 모든 level 키를, 생략하면 전체를 비운다.
 * 관리자 화면에서 표준코드 편집 성공 후 호출하면 다음 조회부터 최신 값을 받는다.
 */
export const invalidateStdCodes = (grpId?: string): void => {
  if (grpId === undefined) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(`${grpId}|`)) cache.delete(key);
  }
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

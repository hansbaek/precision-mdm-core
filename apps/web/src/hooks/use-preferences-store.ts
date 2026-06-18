import { create } from 'zustand';
import { PREFERENCES_STORAGE } from '@/constants';

export type TableDensity = 'comfortable' | 'compact';
export type SortOrder = 'asc' | 'desc';

/** 사용자별 표시 환경설정 — 시험항목 마스터 기본값. localStorage에 영속. */
export interface Preferences {
  /** 페이지당 항목 수 기본값. */
  pageSize: number;
  /** 기본 정렬 기준 컬럼. */
  sortBy: string;
  /** 기본 정렬 방향. */
  sortOrder: SortOrder;
  /** 기본 제품군 필터 (ALL = 전체). */
  defaultProductLine: string;
  /** 테이블 행 밀도. */
  density: TableDensity;
  /** 시스템 상태(서버/DB) 이상 시 토스트 알림 표시 여부. */
  notifySystemStatus: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  pageSize: 20,
  sortBy: 'id',
  sortOrder: 'asc',
  defaultProductLine: 'ALL',
  density: 'comfortable',
  notifySystemStatus: true,
};

const load = (): Preferences => {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE);
    if (!raw) return DEFAULT_PREFERENCES;
    // 저장된 일부 키만 있어도 기본값과 병합(스키마 확장 호환).
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<Preferences>) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

const persist = (prefs: Preferences) => {
  try {
    localStorage.setItem(PREFERENCES_STORAGE, JSON.stringify(prefs));
  } catch {
    /* 저장 실패는 무시 (프라이빗 모드 등). */
  }
};

interface PreferencesState extends Preferences {
  /** 일부 항목만 갱신 후 영속(로컬). */
  update: (patch: Partial<Preferences>) => void;
  /** 서버에서 받은 값으로 로컬 상태·저장소를 동기화(서버 재전송 없음). */
  hydrate: (prefs: Partial<Preferences> | null) => void;
  /** 기본값으로 초기화. */
  reset: () => void;
}

export const usePreferencesStore = create<PreferencesState>()((set, get) => ({
  ...load(),
  update: (patch) => {
    const next = { ...stripActions(get()), ...patch };
    persist(next);
    set(patch);
  },
  hydrate: (prefs) => {
    if (!prefs) return;
    const next = { ...stripActions(get()), ...prefs };
    persist(next);
    set(next);
  },
  reset: () => {
    persist(DEFAULT_PREFERENCES);
    set(DEFAULT_PREFERENCES);
  },
}));

/** 상태 객체에서 액션을 제외한 순수 Preferences만 추출. */
function stripActions(state: PreferencesState): Preferences {
  const {
    pageSize,
    sortBy,
    sortOrder,
    defaultProductLine,
    density,
    notifySystemStatus,
  } = state;
  return {
    pageSize,
    sortBy,
    sortOrder,
    defaultProductLine,
    density,
    notifySystemStatus,
  };
}

/** 컴포넌트 외부(초기 useState)에서 현재 환경설정을 읽기 위한 헬퍼. */
export const getPreferences = (): Preferences => stripActions(usePreferencesStore.getState());

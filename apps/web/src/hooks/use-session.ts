import { getMe, logout as logoutApi } from '@/api/auth';
import { LOCALSTORAGE_REFRESH_TOKEN } from '@/constants';
import { useAuthStore } from '@/hooks/use-auth-store';
import { usePermissionsStore } from '@/hooks/use-permissions-store';
import { usePreferencesStore } from '@/hooks/use-preferences-store';
import { useUserProfile } from '@/hooks/use-user-profile';
import type { AuthSession } from '@/types';

const EMPTY_PROFILE = {
  userId: '',
  userName: '',
  userNameEng: '',
  teamName: '',
  teamNameEng: '',
  role: '',
};

/** 로그인 성공 응답을 모든 스토어에 반영. */
export const applySession = (session: AuthSession) => {
  useAuthStore.getState().login(session.token, session.refreshToken);
  useUserProfile.getState().setProfile(session.profile);
  usePermissionsStore.getState().setMenus(session.menus);
  usePreferencesStore.getState().hydrate(session.preferences);
};

/** 토큰만 있는 상태(새로고침)에서 프로필·권한·환경설정을 서버에서 재적재. */
export const loadSession = async (): Promise<boolean> => {
  const res = await getMe();
  if (!res.ok || !res.result) return false;
  useUserProfile.getState().setProfile(res.result.profile);
  usePermissionsStore.getState().setMenus(res.result.menus);
  usePreferencesStore.getState().hydrate(res.result.preferences);
  return true;
};

/** 전체 세션 종료 — 로컬 토큰·프로필·권한 초기화(서버 폐기는 signOut). */
export const clearSession = () => {
  useAuthStore.getState().logout();
  useUserProfile.getState().setProfile(EMPTY_PROFILE);
  usePermissionsStore.getState().reset();
};

/**
 * 사용자 로그아웃: 서버에 리프레시 토큰 폐기를 요청한 뒤 로컬 세션을 정리한다.
 * 네트워크 실패 등으로 서버 폐기가 안 되더라도 로컬은 반드시 정리한다.
 */
export const signOut = async () => {
  const refreshToken = localStorage.getItem(LOCALSTORAGE_REFRESH_TOKEN);
  if (refreshToken) {
    try {
      await logoutApi(refreshToken);
    } catch {
      // 무시: 로컬 정리는 아래에서 보장.
    }
  }
  clearSession();
};

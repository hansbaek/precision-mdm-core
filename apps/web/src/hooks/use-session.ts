import { getMe } from '@/api/auth';
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
  useAuthStore.getState().login(session.token);
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

/** 전체 세션 종료 — 토큰·프로필·권한 초기화. */
export const clearSession = () => {
  useAuthStore.getState().logout();
  useUserProfile.getState().setProfile(EMPTY_PROFILE);
  usePermissionsStore.getState().reset();
};

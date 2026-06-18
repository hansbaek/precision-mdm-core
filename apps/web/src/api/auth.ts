import { type CommonReturnType, axiosInstance } from '.';
import type {
  AuthSession,
  MenuPermission,
  UserPreferences,
  UserProfile,
} from '@/types';

export const signIn = (data: {
  userId: string;
  password: string;
}): Promise<CommonReturnType<AuthSession>> =>
  axiosInstance.post('/auth/signin', data).then((res) => res.data);

export const getMe = (): Promise<
  CommonReturnType<{
    profile: UserProfile;
    menus: MenuPermission[];
    preferences: UserPreferences | null;
  }>
> => axiosInstance.get('/auth/me').then((res) => res.data);

/** 본인 표시 환경설정 저장. */
export const savePreferences = (
  prefs: UserPreferences,
): Promise<CommonReturnType<UserPreferences>> =>
  axiosInstance.put('/auth/preferences', prefs).then((res) => res.data);

export const changePassword = (data: {
  currentPassword: string;
  newPassword: string;
}): Promise<CommonReturnType<null>> =>
  axiosInstance.post('/auth/password', data).then((res) => res.data);

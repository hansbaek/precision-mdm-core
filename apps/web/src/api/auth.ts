import { type CommonReturnType, axiosInstance } from '.';
import type { AuthSession, MenuPermission, UserProfile } from '@/types';

export const signIn = (data: {
  userId: string;
  password: string;
}): Promise<CommonReturnType<AuthSession>> =>
  axiosInstance.post('/auth/signin', data).then((res) => res.data);

export const getMe = (): Promise<
  CommonReturnType<{ profile: UserProfile; menus: MenuPermission[] }>
> => axiosInstance.get('/auth/me').then((res) => res.data);

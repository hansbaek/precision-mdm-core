import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AUTH_FORCE_LOGOUT_EVENT } from '@/constants';
import { useAuthStore } from '@/hooks/use-auth-store';
import { usePermissionsStore } from '@/hooks/use-permissions-store';
import { usePreferencesStore } from '@/hooks/use-preferences-store';
import { useUserProfile } from '@/hooks/use-user-profile';
import { queryClient } from '@/lib/query-client';
import { useForceLogoutListener } from './use-force-logout';

const navigateMock = vi.fn();
vi.mock('react-router', () => ({ useNavigate: () => navigateMock }));
// 서버 폐기 호출(use-session.signOut)은 이 경로에 없지만, 안전하게 차단.
vi.mock('@/api/auth', () => ({
  getMe: vi.fn(),
  logout: vi.fn(),
}));

describe('useForceLogoutListener', () => {
  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('강제 로그아웃 이벤트 시 스토어/캐시 정리 + 로그인으로 이동', () => {
    // 로그인된 세션 상태를 구성.
    useAuthStore.setState({ isLoggedIn: true });
    useUserProfile.getState().setProfile({
      userId: 'u1',
      userName: '홍길동',
      userNameEng: 'Hong',
      teamName: '팀',
      teamNameEng: 'Team',
      role: 'ADMIN',
    });
    usePermissionsStore.getState().setMenus([
      {
        menuId: 'test-master.dashboard',
        menuType: 'TAB',
        parentId: 'test-master',
        i18nKey: null,
        sortOrder: 1,
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canApprove: false,
      },
    ]);
    usePreferencesStore.getState().update({ pageSize: 99 });
    queryClient.setQueryData(['regulation-codes'], ['A', 'B']);

    renderHook(() => useForceLogoutListener());
    window.dispatchEvent(new CustomEvent(AUTH_FORCE_LOGOUT_EVENT));

    expect(useAuthStore.getState().isLoggedIn).toBe(false);
    expect(useUserProfile.getState().userProfile.userId).toBe('');
    expect(usePermissionsStore.getState().loaded).toBe(false);
    expect(usePreferencesStore.getState().pageSize).toBe(20);
    expect(queryClient.getQueryData(['regulation-codes'])).toBeUndefined();
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('언마운트 후에는 이벤트에 반응하지 않는다', () => {
    const { unmount } = renderHook(() => useForceLogoutListener());
    unmount();
    window.dispatchEvent(new CustomEvent(AUTH_FORCE_LOGOUT_EVENT));
    expect(navigateMock).not.toHaveBeenCalled();
  });
});

import { create } from 'zustand';
import type { MenuPermission, PermissionAction } from '@/types';

interface PermissionsState {
  /** menuId → 권한. */
  menus: Record<string, MenuPermission>;
  /** /auth/me 또는 로그인으로 권한이 적재됐는지. */
  loaded: boolean;
  setMenus: (menus: MenuPermission[]) => void;
  reset: () => void;
}

const allow = (m: MenuPermission | undefined, action: PermissionAction) => {
  if (!m) return false;
  switch (action) {
    case 'view':
      return m.canView;
    case 'create':
      return m.canCreate;
    case 'update':
      return m.canUpdate;
    case 'delete':
      return m.canDelete;
    case 'approve':
      return m.canApprove;
  }
};

export const usePermissionsStore = create<PermissionsState>((set) => ({
  menus: {},
  loaded: false,
  setMenus: (menus) =>
    set({
      menus: Object.fromEntries(menus.map((m) => [m.menuId, m])),
      loaded: true,
    }),
  reset: () => set({ menus: {}, loaded: false }),
}));

/**
 * 권한 체크 훅. menus 변경에 반응해 리렌더된다.
 * 예: const can = useCan(); can('test-master.dashboard', 'create')
 */
export const useCan = () => {
  const menus = usePermissionsStore((s) => s.menus);
  return (menuId: string, action: PermissionAction = 'view') =>
    allow(menus[menuId], action);
};

/** 비반응형(이벤트 핸들러 등) 권한 체크. */
export const can = (menuId: string, action: PermissionAction = 'view') =>
  allow(usePermissionsStore.getState().menus[menuId], action);

import { beforeEach, describe, expect, it } from 'vitest';
import type { MenuPermission } from '@/types';
import { can, usePermissionsStore } from './use-permissions-store';

/** 테스트용 MenuPermission 생성 — 지정한 플래그만 켠다. */
function menu(
  menuId: string,
  flags: Partial<
    Pick<
      MenuPermission,
      'canView' | 'canCreate' | 'canUpdate' | 'canDelete' | 'canApprove'
    >
  > = {},
): MenuPermission {
  return {
    menuId,
    menuType: 'TAB',
    parentId: null,
    i18nKey: null,
    sortOrder: null,
    canView: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canApprove: false,
    ...flags,
  };
}

describe('usePermissionsStore / can', () => {
  beforeEach(() => {
    usePermissionsStore.getState().reset();
  });

  it('적재 전에는 어떤 권한도 거부한다 (사이드바 숨김의 기본값)', () => {
    expect(usePermissionsStore.getState().loaded).toBe(false);
    expect(can('test-master.dashboard', 'view')).toBe(false);
  });

  it('setMenus 후 menuId 로 인덱싱되고 loaded 가 true 가 된다', () => {
    usePermissionsStore.getState().setMenus([menu('a'), menu('b')]);
    const state = usePermissionsStore.getState();
    expect(state.loaded).toBe(true);
    expect(Object.keys(state.menus).sort()).toEqual(['a', 'b']);
  });

  it('액션별 플래그를 정확히 판정한다', () => {
    usePermissionsStore
      .getState()
      .setMenus([menu('m', { canView: true, canCreate: true })]);
    expect(can('m', 'view')).toBe(true);
    expect(can('m', 'create')).toBe(true);
    expect(can('m', 'update')).toBe(false);
    expect(can('m', 'delete')).toBe(false);
    expect(can('m', 'approve')).toBe(false);
  });

  it('action 기본값은 view 다', () => {
    usePermissionsStore.getState().setMenus([menu('m', { canView: true })]);
    expect(can('m')).toBe(true);
  });

  it('권한이 없는 메뉴는 거부한다 (조회 권한 없으면 사이드바에서 숨김)', () => {
    usePermissionsStore.getState().setMenus([menu('visible', { canView: true })]);
    expect(can('hidden', 'view')).toBe(false);
  });

  it('reset 후 모든 권한이 다시 거부된다', () => {
    usePermissionsStore.getState().setMenus([menu('m', { canView: true })]);
    usePermissionsStore.getState().reset();
    expect(can('m', 'view')).toBe(false);
    expect(usePermissionsStore.getState().loaded).toBe(false);
  });
});

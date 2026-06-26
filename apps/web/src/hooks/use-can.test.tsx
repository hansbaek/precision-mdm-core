import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { MenuPermission } from '@/types';
import { useCan, usePermissionsStore } from './use-permissions-store';

function menu(menuId: string, canView: boolean): MenuPermission {
  return {
    menuId,
    menuType: 'TAB',
    parentId: null,
    i18nKey: null,
    sortOrder: null,
    canView,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canApprove: false,
  };
}

/** useCan 으로 조회 권한이 있을 때만 메뉴 항목을 렌더하는 최소 컴포넌트. */
function MenuLink({ menuId }: { menuId: string }) {
  const can = useCan();
  if (!can(menuId, 'view')) return null;
  return <a href={`/${menuId}`}>{menuId}</a>;
}

describe('useCan (사이드바 항목 게이팅)', () => {
  beforeEach(() => usePermissionsStore.getState().reset());
  afterEach(() => usePermissionsStore.getState().reset());

  it('조회 권한이 없으면 항목을 렌더하지 않는다', () => {
    render(<MenuLink menuId="reports" />);
    expect(screen.queryByText('reports')).not.toBeInTheDocument();
  });

  it('권한이 적재되면 반응형으로 항목이 나타난다', () => {
    render(<MenuLink menuId="reports" />);
    expect(screen.queryByText('reports')).not.toBeInTheDocument();

    act(() => {
      usePermissionsStore.getState().setMenus([menu('reports', true)]);
    });
    expect(screen.getByText('reports')).toBeInTheDocument();
  });
});

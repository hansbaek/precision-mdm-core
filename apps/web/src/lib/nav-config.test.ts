import { describe, expect, it } from 'vitest';
import { resolveActiveRoute, visibleTabs, type Can } from './nav-config';

/** 허용 메뉴 집합으로 can() 흉내. `menuId` 또는 `menuId.action` 매칭. */
function canFrom(allowed: string[]): Can {
  const set = new Set(allowed);
  return (menuId, action = 'view') =>
    set.has(menuId) || set.has(`${menuId}.${action}`);
}

describe('visibleTabs', () => {
  it('권한 비귀속 모듈(admin)은 모든 탭을 노출한다', () => {
    const tabs = visibleTabs('admin', canFrom([]));
    expect(tabs.map((t) => t.id)).toEqual(['permissions', 'users', 'std-codes']);
  });

  it('test-master 탭은 메뉴 view 권한으로 필터된다', () => {
    const can = canFrom(['test-master.dashboard', 'test-master.reports']);
    const tabs = visibleTabs('test-master', can);
    // approvals 는 dashboard 권한으로 노출되므로 함께 포함된다.
    expect(tabs.map((t) => t.id)).toEqual(['dashboard', 'reports', 'approvals']);
  });

  it('탭이 없는 모듈은 빈 배열', () => {
    expect(visibleTabs('testing-protocols', canFrom([]))).toEqual([]);
  });
});

describe('resolveActiveRoute', () => {
  const fullCan = canFrom([
    'test-master',
    'test-master.dashboard',
    'test-master.test-match',
    'test-master.analytics',
    'test-master.reports',
    'admin',
  ]);

  it('유효한 모듈/탭은 그대로 유지한다', () => {
    const r = resolveActiveRoute('test-master', 'reports', fullCan);
    expect(r.module).toBe('test-master');
    expect(r.tab).toBe('reports');
  });

  it('빈 모듈("/")은 첫 허용 모듈의 첫 탭으로 정규화한다', () => {
    const r = resolveActiveRoute('', '', fullCan);
    expect(r.module).toBe('test-master');
    expect(r.tab).toBe('dashboard');
  });

  it('view 권한 없는 모듈은 첫 허용 모듈로 대체한다', () => {
    const r = resolveActiveRoute('vehicle-config', '', fullCan);
    expect(r.module).toBe('test-master');
  });

  it('모듈에 없는 탭은 첫 노출 탭으로 대체한다', () => {
    const r = resolveActiveRoute('test-master', 'bogus', fullCan);
    expect(r.tab).toBe('dashboard');
  });

  it('탭 없는 모듈은 tab=""', () => {
    const can = canFrom(['testing-protocols']);
    const r = resolveActiveRoute('testing-protocols', '', can);
    expect(r.module).toBe('testing-protocols');
    expect(r.tab).toBe('');
  });

  it('권한 메뉴가 없으면 admin 탭(권한 비귀속)을 기본 노출한다', () => {
    const r = resolveActiveRoute('admin', '', canFrom(['admin']));
    expect(r.module).toBe('admin');
    expect(r.tab).toBe('permissions');
  });
});

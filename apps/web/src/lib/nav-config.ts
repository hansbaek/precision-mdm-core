/** 사이드바 모듈·상단 탭 네비게이션 설정. App 셸이 화면 전환에 사용한다. */

/** 사이드바 모듈 → 종속 상단 탭. 탭이 없는 모듈은 탭 바가 숨겨진다. */
export const MODULE_TABS: Record<
  string,
  { id: string; labelKey: string }[]
> = {
  'test-master': [
    { id: 'dashboard', labelKey: 'app.tabs.dashboard' },
    { id: 'test-match', labelKey: 'app.tabs.testMatch' },
    { id: 'analytics', labelKey: 'app.tabs.analytics' },
    { id: 'reports', labelKey: 'app.tabs.reports' },
    { id: 'approvals', labelKey: 'app.tabs.approvals' },
  ],
  admin: [
    { id: 'permissions', labelKey: 'app.tabs.permissions' },
    { id: 'users', labelKey: 'app.tabs.users' },
    { id: 'std-codes', labelKey: 'app.tabs.stdCodes' },
  ],
};

/**
 * 탭이 메뉴 권한으로 게이팅되는 모듈. 이 모듈의 탭은 `<module>.<tab>` 메뉴의
 * view 권한으로 필터된다. admin 등 그 외 모듈의 탭은 모듈 자체의 노출 여부로만
 * 제어된다(내부 탭에는 별도 메뉴가 없음).
 */
export const PERMISSION_BACKED_MODULES = new Set(['test-master']);

/** 사이드바 모듈 id 순서 (권한 기반 기본 모듈 선택용). */
export const ALL_MODULE_IDS = [
  'test-master',
  'testing-protocols',
  'vehicle-config',
  'data-audit',
  'admin',
];

/** 준비중 모듈명 → i18n 키. */
export const MODULE_NAME_KEY: Record<string, string> = {
  'vehicle-config': 'app.nav.vehicleConfig',
  'data-audit': 'app.nav.dataAudit',
};

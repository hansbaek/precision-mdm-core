import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

// ── 셸/데이터 의존성은 라우팅 글루 검증에 불필요하므로 스텁 처리 ──
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
vi.mock('./hooks/use-permissions-store', () => ({
  useCan: () => () => true, // 권한 게이팅은 nav-config.test 에서 별도 검증
}));
vi.mock('./hooks/use-system-status-alerts', () => ({
  useSystemStatusAlerts: () => undefined,
}));
vi.mock('./hooks/use-std-stats', () => ({
  useStdStats: () => ({ stats: null, loading: false, error: null, reload: vi.fn() }),
}));
vi.mock('./hooks/use-std-items-dashboard', () => ({
  useStdItemsDashboard: () => ({
    dashboardSectionProps: {},
    rawCount: 0,
    sortedItems: [],
    openDetail: vi.fn(),
    detailModalProps: {},
    editModalProps: {},
    deleteDialogProps: {},
  }),
}));

// 셸 자식은 스텁(부수효과 차단).
vi.mock('./components/Sidebar', () => ({ default: () => <div /> }));
vi.mock('./components/Header', () => ({ default: () => <div /> }));
vi.mock('./components/CommandPalette', () => ({ default: () => <div /> }));
vi.mock('./components/LegalModal', () => ({ default: () => <div /> }));
vi.mock('./components/dashboard/dashboard-modals', () => ({
  default: () => <div />,
}));

// 라우트 화면은 식별 가능한 스텁으로.
const stub = (label: string) => ({ default: () => <div>{label}</div> });
vi.mock('./pages/dashboard-page', () => stub('DASHBOARD'));
vi.mock('./pages/test-match-page', () => stub('TEST-MATCH'));
vi.mock('./pages/analytics-page', () => stub('ANALYTICS'));
vi.mock('./pages/reports-page', () => stub('REPORTS'));
vi.mock('./pages/approvals-page', () => stub('APPROVALS'));
vi.mock('./pages/classification-master', () => stub('CLASSIFICATION'));
vi.mock('./pages/audit-log-page', () => stub('AUDIT'));
vi.mock('./pages/admin/permission-matrix', () => stub('PERMISSIONS'));
vi.mock('./pages/admin/std-codes', () => stub('STD-CODES'));
vi.mock('./pages/admin/users', () => stub('USERS'));

import App from './App';

/** 현재 URL 경로를 DOM에 노출(정규화 검증용). */
function LocationProbe() {
  const { pathname } = useLocation();
  return <div data-testid="loc">{pathname}</div>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe('App routing (URL ↔ 화면)', () => {
  it('유효한 경로의 화면을 렌더한다', async () => {
    renderAt('/test-master/reports');
    expect(await screen.findByText('REPORTS')).toBeInTheDocument();
  });

  it('탭 없는 모듈을 렌더한다', async () => {
    renderAt('/testing-protocols');
    expect(await screen.findByText('CLASSIFICATION')).toBeInTheDocument();
  });

  it('admin 하위 탭을 렌더한다', async () => {
    renderAt('/admin/users');
    expect(await screen.findByText('USERS')).toBeInTheDocument();
  });

  it('루트("/")는 기본 모듈/탭으로 정규화한다', async () => {
    renderAt('/');
    expect(await screen.findByText('DASHBOARD')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('loc')).toHaveTextContent(
        '/test-master/dashboard',
      ),
    );
  });

  it('잘못된 탭은 첫 탭으로 정규화한다', async () => {
    renderAt('/test-master/bogus');
    expect(await screen.findByText('DASHBOARD')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('loc')).toHaveTextContent(
        '/test-master/dashboard',
      ),
    );
  });
});

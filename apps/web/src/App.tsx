/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import CommandPalette from './components/CommandPalette';
import DashboardModals from './components/dashboard/dashboard-modals';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import LegalModal from './components/LegalModal';
import Sidebar from './components/Sidebar';
import { Spinner } from './components/ui/spinner';
import { useStdStats } from './hooks/use-std-stats';
import { useStdItemsDashboard } from './hooks/use-std-items-dashboard';
import { useCan } from './hooks/use-permissions-store';
import { useSystemStatusAlerts } from './hooks/use-system-status-alerts';
import {
  MODULE_NAME_KEY,
  resolveActiveRoute,
  visibleTabs,
} from './lib/nav-config';
import type { LegalKind } from './content/legal';

// 화면은 라우트 단위로 코드 스플리팅(초기 번들 축소). 진입 시 청크 로드.
const AnalyticsPage = lazy(() => import('./pages/analytics-page'));
const ApprovalsPage = lazy(() => import('./pages/approvals-page'));
const AuditLogPage = lazy(() => import('./pages/audit-log-page'));
const ClassificationMaster = lazy(() => import('./pages/classification-master'));
const DashboardPage = lazy(() => import('./pages/dashboard-page'));
const ReportsPage = lazy(() => import('./pages/reports-page'));
const TestMatchPage = lazy(() => import('./pages/test-match-page'));
const PermissionMatrixPage = lazy(() => import('./pages/admin/permission-matrix'));
const StdCodesAdminPage = lazy(() => import('./pages/admin/std-codes'));
const UsersAdminPage = lazy(() => import('./pages/admin/users'));

/** 모듈(+탭)에 대한 정규 경로. 탭이 없는 모듈은 `/module`. */
const pathOf = (module: string, tab: string) =>
  tab ? `/${module}/${tab}` : `/${module}`;

export default function App() {
  const { t } = useTranslation();
  const can = useCan();
  const navigate = useNavigate();
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalKind | null>(null);
  // 필요시험조회 / 보고서 탭이 공유하는 현재 mcode. App(레이아웃)은 탭 전환 간
  // 마운트 유지되므로 여기 상태로 둬도 탭 이동 후 보존된다.
  const [sharedMcode, setSharedMcode] = useState('');

  // 시스템 상태 전환 시 토스트 알림(설정 토글로 제어).
  useSystemStatusAlerts();

  // ── 활성 모듈/탭은 URL에서 파생 (딥링크·새로고침·뒤로가기 지원) ──
  // URL이 부정확/미허용이어도 렌더는 항상 유효한 모듈·탭으로 정규화한다
  // (실제 URL은 아래 effect가 canonical 로 맞춘다).
  const [, urlModule = '', urlTab = ''] = location.pathname.split('/');
  const {
    module: activeModule,
    tab: activeTab,
    tabs: moduleTabs,
  } = resolveActiveRoute(urlModule, urlTab, can);

  // STD 시험항목 대시보드 상태/핸들러(테이블·모달)는 전용 훅에 캡슐화.
  // 목록/상세는 Sidebar·CommandPalette 도 공유하므로 여기서 한 번만 호출(단일 소스).
  const dash = useStdItemsDashboard(activeModule);

  const {
    stats: stdStats,
    loading: statsLoading,
    error: statsError,
    reload: reloadStats,
  } = useStdStats(activeTab);

  // ── 내비게이션(상태 setter 대신 URL 이동) ──
  const handleModuleChange = (m: string) =>
    navigate(pathOf(m, visibleTabs(m, can)[0]?.id ?? ''));
  const setActiveTab = (tab: string) => navigate(pathOf(activeModule, tab));
  // 커맨드 팔레트의 탭 선택 — 모든 탭은 시험항목기준마스터 종속이므로 모듈도 함께.
  const goToTab = (tab: string) => navigate(pathOf('test-master', tab));

  // 실제 URL을 정규 경로로 교정(미허용 모듈/탭, 또는 "/" 진입 시).
  // 쿼리스트링(`?view=` 등 모달 딥링크)은 보존한다.
  useEffect(() => {
    const target = pathOf(activeModule, activeTab);
    if (activeModule && location.pathname !== target) {
      navigate(`${target}${location.search}`, { replace: true });
    }
  }, [activeModule, activeTab, location.pathname, location.search, navigate]);

  // (모듈, 탭) → 화면 레지스트리. 화면 추가는 여기 항목 추가로 끝난다.
  // 일부 화면은 props가 달라 렌더 함수(클로저)로 둔다.
  const screens: Record<string, () => ReactNode> = {
    'test-master/dashboard': () => (
      <DashboardPage
        activeModule={activeModule}
        setActiveModule={handleModuleChange}
        {...dash.dashboardSectionProps}
      />
    ),
    'test-master/test-match': () => (
      <TestMatchPage initialMcode={sharedMcode} onQueried={setSharedMcode} />
    ),
    'test-master/analytics': () => (
      <AnalyticsPage
        stats={stdStats}
        loading={statsLoading}
        error={statsError}
        onRetry={reloadStats}
      />
    ),
    'test-master/reports': () => (
      <ReportsPage initialMcode={sharedMcode} onQueried={setSharedMcode} />
    ),
    'test-master/approvals': () => <ApprovalsPage />,
    'testing-protocols': () => <ClassificationMaster />,
    'data-audit': () => <AuditLogPage />,
    'admin/permissions': () => <PermissionMatrixPage />,
    'admin/users': () => <UsersAdminPage />,
    'admin/std-codes': () => <StdCodesAdminPage />,
  };

  const renderContent = () => {
    const key = activeTab ? `${activeModule}/${activeTab}` : activeModule;
    const render = screens[key] ?? screens[activeModule];
    if (render) return render();
    return (
      <ModulePlaceholder
        title={t(MODULE_NAME_KEY[activeModule] ?? 'app.nav.testMaster')}
        onBack={() => handleModuleChange('test-master')}
        backLabel={t('app.nav.testMaster')}
      />
    );
  };

  return (
    <div className="flex h-screen w-full bg-background select-none overflow-hidden">
      <Sidebar
        activeModule={activeModule}
        setActiveModule={handleModuleChange}
        itemsCount={dash.rawCount}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          tabs={moduleTabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenPalette={() => setPaletteOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-8 bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeModule}:${activeTab}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* 키 기반 리마운트 → 탭 이동 시 ErrorBoundary 자동 리셋.
                  Suspense 는 lazy 화면 청크 로딩 중 스피너를 표시. */}
              <ErrorBoundary>
                <Suspense
                  fallback={
                    <div className="flex justify-center py-20">
                      <Spinner className="h-6 w-6" />
                    </div>
                  }
                >
                  {renderContent()}
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="h-12 bg-sidebar border-t border-sidebar-border px-6 flex items-center justify-between text-2xs text-sidebar-foreground shrink-0">
          <span>{t('app.footer.copyright')}</span>
          <div className="flex items-center gap-4 text-sidebar-foreground/70 font-semibold select-none">
            <button
              type="button"
              onClick={() => setLegalDoc('privacy')}
              className="hover:text-white transition-all cursor-pointer"
            >
              {t('app.footer.privacy')}
            </button>
            <span>|</span>
            <button
              type="button"
              onClick={() => setLegalDoc('terms')}
              className="hover:text-white transition-all cursor-pointer"
            >
              {t('app.footer.terms')}
            </button>
          </div>
        </footer>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        items={dash.sortedItems}
        onSelectTab={goToTab}
        onSelectModule={handleModuleChange}
        onViewItem={dash.openDetail}
      />

      <DashboardModals dashboard={dash} />

      <LegalModal kind={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
}

/** 아직 구현되지 않은 사이드바 모듈용 placeholder. */
function ModulePlaceholder({
  title,
  onBack,
  backLabel,
}: {
  title: string;
  onBack: () => void;
  backLabel: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="bg-card border border-border rounded-xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xs select-none">
      <h3 className="text-base font-extrabold text-primary font-hanken">{title}</h3>
      <p className="text-xs text-secondary leading-relaxed">{t('app.comingSoon')}</p>
      <button
        onClick={onBack}
        className="text-xs font-extrabold text-accent hover:underline"
      >
        ← {backLabel}
      </button>
    </div>
  );
}

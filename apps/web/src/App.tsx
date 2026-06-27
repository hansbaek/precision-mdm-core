/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import CommandPalette from './components/CommandPalette';
import DashboardModals from './components/dashboard/dashboard-modals';
import Header from './components/Header';
import LegalModal from './components/LegalModal';
import Sidebar from './components/Sidebar';
import { useStdStats } from './hooks/use-std-stats';
import { useStdItemsDashboard } from './hooks/use-std-items-dashboard';
import { useCan } from './hooks/use-permissions-store';
import { useSystemStatusAlerts } from './hooks/use-system-status-alerts';
import {
  ALL_MODULE_IDS,
  MODULE_NAME_KEY,
  MODULE_TABS,
  PERMISSION_BACKED_MODULES,
} from './lib/nav-config';
import AnalyticsPage from './pages/analytics-page';
import ApprovalsPage from './pages/approvals-page';
import AuditLogPage from './pages/audit-log-page';
import ClassificationMaster from './pages/classification-master';
import DashboardPage from './pages/dashboard-page';
import ReportsPage from './pages/reports-page';
import TestMatchPage from './pages/test-match-page';
import PermissionMatrixPage from './pages/admin/permission-matrix';
import StdCodesAdminPage from './pages/admin/std-codes';
import UsersAdminPage from './pages/admin/users';
import type { LegalKind } from './content/legal';

export default function App() {
  const { t } = useTranslation();
  const can = useCan();
  const [activeModule, setActiveModule] = useState('test-master');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalKind | null>(null);
  // 필요시험조회 / 보고서 탭이 공유하는 현재 mcode (탭 이동 후에도 유지).
  const [sharedMcode, setSharedMcode] = useState('');

  // 시스템 상태 전환 시 토스트 알림(설정 토글로 제어).
  useSystemStatusAlerts();

  // STD 시험항목 대시보드 상태/핸들러(테이블·모달)는 전용 훅에 캡슐화.
  // 목록/상세는 Sidebar·CommandPalette 도 공유하므로 여기서 한 번만 호출(단일 소스).
  const dash = useStdItemsDashboard(activeModule);

  const {
    stats: stdStats,
    loading: statsLoading,
    error: statsError,
    reload: reloadStats,
  } = useStdStats(activeTab);

  // 권한 view 가 있는 탭만. 권한 비귀속 모듈(admin 등)은 모든 탭 노출.
  const visibleTabs = (m: string) => {
    const tabs = MODULE_TABS[m] ?? [];
    if (!PERMISSION_BACKED_MODULES.has(m)) return tabs;
    return tabs.filter((tab) => {
      // 승인/변경요청 탭은 별도 메뉴가 없으므로 대시보드 조회 권한으로 노출.
      if (tab.id === 'approvals') return can(`${m}.dashboard`, 'view');
      return can(`${m}.${tab.id}`, 'view');
    });
  };

  // 사이드바 모듈 전환 → 그 모듈의 기본(첫) 허용 탭으로 리셋. 탭 없으면 ''.
  const handleModuleChange = (m: string) => {
    setActiveModule(m);
    setActiveTab(visibleTabs(m)[0]?.id ?? '');
  };

  // 권한 적재 후 현재 모듈이 비허용이면 첫 허용 모듈로 전환(빈 화면 방지).
  useEffect(() => {
    if (!can(activeModule, 'view')) {
      const first = ALL_MODULE_IDS.find((m) => can(m, 'view'));
      if (first) {
        setActiveModule(first);
        setActiveTab(visibleTabs(first)[0]?.id ?? '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule, can]);

  // 커맨드 팔레트의 탭 선택 — 모든 탭은 시험항목기준마스터 종속이므로 모듈도 함께 설정.
  const goToTab = (tabId: string) => {
    setActiveModule('test-master');
    setActiveTab(tabId);
  };

  // (모듈, 탭) 조합으로 본문 결정.
  const renderContent = () => {
    if (activeModule === 'test-master') {
      if (activeTab === 'test-match')
        return <TestMatchPage initialMcode={sharedMcode} onQueried={setSharedMcode} />;
      if (activeTab === 'analytics')
        return (
          <AnalyticsPage
            stats={stdStats}
            loading={statsLoading}
            error={statsError}
            onRetry={reloadStats}
          />
        );
      if (activeTab === 'reports')
        return <ReportsPage initialMcode={sharedMcode} onQueried={setSharedMcode} />;
      if (activeTab === 'approvals') return <ApprovalsPage />;
      return (
        <DashboardPage
          activeModule={activeModule}
          setActiveModule={handleModuleChange}
          {...dash.dashboardSectionProps}
        />
      );
    }
    if (activeModule === 'testing-protocols') return <ClassificationMaster />;
    if (activeModule === 'data-audit') return <AuditLogPage />;
    if (activeModule === 'admin') {
      if (activeTab === 'users') return <UsersAdminPage />;
      if (activeTab === 'std-codes') return <StdCodesAdminPage />;
      return <PermissionMatrixPage />;
    }
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
          tabs={visibleTabs(activeModule)}
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
              {renderContent()}
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

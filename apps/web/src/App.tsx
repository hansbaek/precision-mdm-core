/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import CommandPalette from './components/CommandPalette';
import ConfirmDeleteDialog from './components/ConfirmDeleteDialog';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StdTestItemDetailModal from './components/StdTestItemDetailModal';
import StdTestItemEditModal from './components/StdTestItemEditModal';
import { useStdStats } from './hooks/use-std-stats';
import { useStdTestItems } from './hooks/use-std-test-items';
import AnalyticsPage from './pages/analytics-page';
import ClassificationMaster from './pages/classification-master';
import DashboardPage from './pages/dashboard-page';
import ReportsPage from './pages/reports-page';
import TestMatchPage from './pages/test-match-page';
import type { FilterOptions, StdTestItem } from './types';

const INITIAL_FILTERS: FilterOptions = {
  productLine: 'ALL',
  searchQuery: '',
  markets: '',
};

/** 사이드바 모듈 → 종속 상단 탭. 탭이 없는 모듈은 탭 바가 숨겨진다. */
const MODULE_TABS: Record<string, { id: string; labelKey: string }[]> = {
  'test-master': [
    { id: 'dashboard', labelKey: 'app.tabs.dashboard' },
    { id: 'test-match', labelKey: 'app.tabs.testMatch' },
    { id: 'analytics', labelKey: 'app.tabs.analytics' },
    { id: 'reports', labelKey: 'app.tabs.reports' },
  ],
};
const tabsFor = (m: string) => MODULE_TABS[m] ?? [];

/** 준비중 모듈명 → i18n 키. */
const MODULE_NAME_KEY: Record<string, string> = {
  'material-specs': 'app.nav.materialSpecs',
  'vehicle-config': 'app.nav.vehicleConfig',
  'data-audit': 'app.nav.dataAudit',
};

export default function App() {
  const { t } = useTranslation();
  const [activeModule, setActiveModule] = useState('test-master');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [paletteOpen, setPaletteOpen] = useState(false);

  const [filters, setFilters] = useState<FilterOptions>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>(INITIAL_FILTERS);

  // 필요시험조회 / 보고서 탭이 공유하는 현재 mcode (탭 이동 후에도 유지).
  const [sharedMcode, setSharedMcode] = useState('');

  const [stdSortBy, setStdSortBy] = useState('id');
  const [stdSortOrder, setStdSortOrder] = useState<'asc' | 'desc'>('asc');
  const [stdCurrentPage, setStdCurrentPage] = useState(1);
  const [stdItemsPerPage, setStdItemsPerPage] = useState(20);
  const [viewingStdItem, setViewingStdItem] = useState<StdTestItem | null>(null);
  const [editingStdItem, setEditingStdItem] = useState<StdTestItem | null>(null);
  const [creatingStdItem, setCreatingStdItem] = useState(false);
  const [deletingStdItem, setDeletingStdItem] = useState<StdTestItem | null>(null);
  // Where the edit modal was opened from — cancel/save return the user there.
  const [editOrigin, setEditOrigin] = useState<'table' | 'detail'>('table');

  const {
    items: stdItems,
    setItems: setStdItems,
    loading: stdLoading,
    error: stdError,
    reload: reloadStdItems,
  } = useStdTestItems(activeModule, appliedFilters);

  const {
    stats: stdStats,
    loading: statsLoading,
    error: statsError,
    reload: reloadStats,
  } = useStdStats(activeTab);

  const sortedStdItems = useMemo(() => {
    return [...stdItems].sort((a, b) => {
      const ra = a[stdSortBy as keyof StdTestItem];
      const rb = b[stdSortBy as keyof StdTestItem];
      let cmp: number;

      if (typeof ra === 'number' && typeof rb === 'number') {
        cmp = ra - rb;
      } else {
        cmp = String(ra ?? '').toLowerCase().localeCompare(String(rb ?? '').toLowerCase());
      }

      return stdSortOrder === 'asc' ? cmp : -cmp;
    });
  }, [stdItems, stdSortBy, stdSortOrder]);

  const handleStdItemSaved = (updated: StdTestItem) => {
    setStdItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setEditingStdItem(null);
    // Entered from detail view → return there with the updated values visible.
    if (editOrigin === 'detail') setViewingStdItem(updated);
    toast.success(`STD Item #${updated.id} 수정 완료`);
  };

  const handleEditFromTable = (item: StdTestItem) => {
    setEditOrigin('table');
    setEditingStdItem(item);
  };

  // "추가" — create and close. Surface the new row at the top of the list and
  // offer a one-click view so the user can confirm what was saved.
  const handleStdItemCreated = (created: StdTestItem) => {
    setStdItems((prev) => [created, ...prev]);
    setCreatingStdItem(false);
    setStdSortBy('id');
    setStdSortOrder('desc');
    setStdCurrentPage(1);
    toast.success(`STD Item #${created.id} 생성 완료`, {
      action: { label: '보기', onClick: () => setViewingStdItem(created) },
    });
  };

  // "추가 후 계속" — create but keep the modal open for the next entry.
  const handleStdItemCreatedContinue = (created: StdTestItem) => {
    setStdItems((prev) => [created, ...prev]);
  };

  const handleStdItemDeleted = (id: number) => {
    setStdItems((prev) => prev.filter((it) => it.id !== id));
    setDeletingStdItem(null);
    // Close the detail view if it was showing the deleted record.
    setViewingStdItem((cur) => (cur && cur.id === id ? null : cur));
    toast.success(`STD Item #${id} 삭제 완료`);
  };

  const handleEditCancel = () => {
    // Entered from detail view → return there (values unchanged on cancel).
    if (editOrigin === 'detail' && editingStdItem) setViewingStdItem(editingStdItem);
    setEditingStdItem(null);
  };

  const handleSearchExecute = () => {
    setAppliedFilters(filters);
    setStdCurrentPage(1);
  };

  const handleSearchReset = () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setStdCurrentPage(1);
  };

  // 사이드바 모듈 전환 → 그 모듈의 기본(첫) 탭으로 리셋. 탭 없으면 ''.
  const handleModuleChange = (m: string) => {
    setActiveModule(m);
    setActiveTab(tabsFor(m)[0]?.id ?? '');
  };

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
      return (
        <DashboardPage
          activeModule={activeModule}
          setActiveModule={handleModuleChange}
          filters={filters}
          setFilters={setFilters}
          onSearch={handleSearchExecute}
          onReset={handleSearchReset}
          items={sortedStdItems}
          loading={stdLoading}
          error={stdError}
          onRetry={reloadStdItems}
          onView={setViewingStdItem}
          onEdit={handleEditFromTable}
          onDelete={setDeletingStdItem}
          onAdd={() => setCreatingStdItem(true)}
          sortBy={stdSortBy}
          setSortBy={setStdSortBy}
          sortOrder={stdSortOrder}
          setSortOrder={setStdSortOrder}
          currentPage={stdCurrentPage}
          setCurrentPage={setStdCurrentPage}
          itemsPerPage={stdItemsPerPage}
          setItemsPerPage={setStdItemsPerPage}
        />
      );
    }
    if (activeModule === 'testing-protocols') return <ClassificationMaster />;
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
        itemsCount={stdItems.length}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          tabs={tabsFor(activeModule)}
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
            <a href="#privacy" className="hover:text-white transition-all">
              {t('app.footer.privacy')}
            </a>
            <span>|</span>
            <a href="#teams" className="hover:text-white transition-all">
              {t('app.footer.terms')}
            </a>
          </div>
        </footer>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        items={sortedStdItems}
        onSelectTab={goToTab}
        onSelectModule={handleModuleChange}
        onViewItem={setViewingStdItem}
      />

      <StdTestItemDetailModal
        isOpen={viewingStdItem !== null}
        item={viewingStdItem}
        onClose={() => setViewingStdItem(null)}
        onEdit={(item) => {
          setViewingStdItem(null);
          setEditOrigin('detail');
          setEditingStdItem(item);
        }}
        onDelete={setDeletingStdItem}
      />

      <StdTestItemEditModal
        isOpen={editingStdItem !== null || creatingStdItem}
        item={creatingStdItem ? null : editingStdItem}
        mode={creatingStdItem ? 'create' : 'edit'}
        onClose={creatingStdItem ? () => setCreatingStdItem(false) : handleEditCancel}
        onSaved={creatingStdItem ? handleStdItemCreated : handleStdItemSaved}
        onCreatedContinue={handleStdItemCreatedContinue}
      />

      <ConfirmDeleteDialog
        item={deletingStdItem}
        onClose={() => setDeletingStdItem(null)}
        onDeleted={handleStdItemDeleted}
      />
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

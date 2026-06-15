/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

import CommandPalette from './components/CommandPalette';
import ConfirmDeleteDialog from './components/ConfirmDeleteDialog';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StdTestItemDetailModal from './components/StdTestItemDetailModal';
import StdTestItemEditModal from './components/StdTestItemEditModal';
import { useStdStats } from './hooks/use-std-stats';
import { useStdTestItems } from './hooks/use-std-test-items';
import AnalyticsPage from './pages/analytics-page';
import DashboardPage from './pages/dashboard-page';
import ReportsPage from './pages/reports-page';
import type { FilterOptions, StdTestItem } from './types';

const INITIAL_FILTERS: FilterOptions = {
  productLine: 'ALL',
  searchQuery: '',
  markets: '',
};

export default function App() {
  const [activeModule, setActiveModule] = useState('test-master');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [paletteOpen, setPaletteOpen] = useState(false);

  const [filters, setFilters] = useState<FilterOptions>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>(INITIAL_FILTERS);

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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    if (tab === 'analytics' || tab === 'reports') {
      setActiveModule('data-audit');
    } else {
      setActiveModule('test-master');
    }
  };

  return (
    <div className="flex h-screen w-full bg-background select-none overflow-hidden">
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        itemsCount={stdItems.length}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onOpenPalette={() => setPaletteOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-8 bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="space-y-6"
            >
              {activeTab === 'dashboard' ? (
                <DashboardPage
                  activeModule={activeModule}
                  setActiveModule={setActiveModule}
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
              ) : activeTab === 'analytics' ? (
                <AnalyticsPage
                  stats={stdStats}
                  loading={statsLoading}
                  error={statsError}
                  onRetry={reloadStats}
                />
              ) : (
                <ReportsPage stats={stdStats} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="h-12 bg-sidebar border-t border-sidebar-border px-6 flex items-center justify-between text-2xs text-sidebar-foreground shrink-0">
          <span>&copy; 2026 Hankook Tire & Technology. All Rights Reserved.</span>
          <div className="flex items-center gap-4 text-sidebar-foreground/70 font-semibold select-none">
            <a href="#privacy" className="hover:text-white transition-all">
              Privacy Policy
            </a>
            <span>|</span>
            <a href="#teams" className="hover:text-white transition-all">
              Terms of Service
            </a>
          </div>
        </footer>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        items={sortedStdItems}
        onSelectTab={handleTabChange}
        onSelectModule={(module) => {
          setActiveTab('dashboard');
          setActiveModule(module);
        }}
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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { CheckCircle } from 'lucide-react';

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
  const [globalSearch, setGlobalSearch] = useState('');

  const [filters, setFilters] = useState<FilterOptions>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>(INITIAL_FILTERS);

  const [stdSortBy, setStdSortBy] = useState('id');
  const [stdSortOrder, setStdSortOrder] = useState<'asc' | 'desc'>('asc');
  const [stdCurrentPage, setStdCurrentPage] = useState(1);
  const [stdItemsPerPage, setStdItemsPerPage] = useState(20);
  const [viewingStdItem, setViewingStdItem] = useState<StdTestItem | null>(null);
  const [editingStdItem, setEditingStdItem] = useState<StdTestItem | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleStdItemSaved = (updated: StdTestItem) => {
    setStdItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    triggerToast(`STD Item #${updated.id} 수정 완료`);
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
    <div className="flex h-screen w-full bg-surface-base select-none overflow-hidden">
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        itemsCount={stdItems.length}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
        />

        <main className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f7f9fb]">
          {toastMessage && <ToastMessage message={toastMessage} />}

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
              onEdit={setEditingStdItem}
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
        </main>

        <footer className="h-12 bg-primary border-t border-transparent px-6 flex items-center justify-between text-[11px] text-[#eff1f3] shrink-0">
          <span>&copy; 2026 Hankook Tire & Technology. All Rights Reserved.</span>
          <div className="flex items-center gap-4 text-[#eff1f3]/70 font-semibold select-none">
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

      <StdTestItemDetailModal
        isOpen={viewingStdItem !== null}
        item={viewingStdItem}
        onClose={() => setViewingStdItem(null)}
        onEdit={(item) => {
          setViewingStdItem(null);
          setEditingStdItem(item);
        }}
      />

      <StdTestItemEditModal
        isOpen={editingStdItem !== null}
        item={editingStdItem}
        onClose={() => setEditingStdItem(null)}
        onSaved={handleStdItemSaved}
      />
    </div>
  );
}

function ToastMessage({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 bg-primary border border-[#003366] text-white px-5 py-4 rounded-sm flex items-center gap-3 shadow-2xl z-50 animate-fade-in text-xs">
      <CheckCircle className="h-4.5 w-4.5 text-accent animate-pulse" />
      <span className="font-bold">{message}</span>
    </div>
  );
}

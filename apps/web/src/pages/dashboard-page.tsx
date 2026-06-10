import type { Dispatch, SetStateAction } from 'react';
import { AlertCircle, Download, Settings } from 'lucide-react';
import { downloadTemplateXlsx } from '@/api/template';
import FilterPanel from '@/components/FilterPanel';
import StdTestItemTable from '@/components/StdTestItemTable';
import type { FilterOptions, StdTestItem } from '@/types';

type SortOrder = 'asc' | 'desc';

interface DashboardPageProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  filters: FilterOptions;
  setFilters: Dispatch<SetStateAction<FilterOptions>>;
  onSearch: () => void;
  onReset: () => void;
  items: StdTestItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onView: (item: StdTestItem) => void;
  onEdit: (item: StdTestItem) => void;
  sortBy: string;
  setSortBy: (field: string) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
}

interface StdItemsSectionProps {
  breadcrumb: string;
  title: string;
  showFilters?: boolean;
  showToolbar?: boolean;
  filters: FilterOptions;
  setFilters: Dispatch<SetStateAction<FilterOptions>>;
  onSearch: () => void;
  onReset: () => void;
  items: StdTestItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onView: (item: StdTestItem) => void;
  onEdit: (item: StdTestItem) => void;
  sortBy: string;
  setSortBy: (field: string) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
}

export default function DashboardPage(props: DashboardPageProps) {
  if (props.activeModule === 'test-master') {
    return (
      <StdItemsSection
        {...props}
        breadcrumb="MDM Home / 시험항목 기준정보 관리 (R&D Master)"
        title="Test Item Master Database"
        showFilters
        showToolbar
      />
    );
  }

  if (props.activeModule === 'testing-protocols') {
    return (
      <StdItemsSection
        {...props}
        breadcrumb="MDM Home / STD 시험 항목 템플릿 (Testing Protocols)"
        title="Standard Test Item Matrix"
      />
    );
  }

  return (
    <VirtualizedModulePlaceholder
      activeModule={props.activeModule}
      setActiveModule={props.setActiveModule}
    />
  );
}

function StdItemsSection({
  breadcrumb,
  title,
  showFilters = false,
  showToolbar = false,
  filters,
  setFilters,
  onSearch,
  onReset,
  items,
  loading,
  error,
  onRetry,
  onView,
  onEdit,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
}: StdItemsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <nav className="text-[11px] text-[#545f72] font-medium uppercase tracking-widest font-hanken">
          {breadcrumb}
        </nav>
        <h2 className="font-hanken font-extrabold text-primary text-2xl tracking-tight mt-1.5 uppercase">
          {title}
        </h2>
      </div>

      {showFilters && (
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          onSearch={onSearch}
          onReset={onReset}
        />
      )}

      {showToolbar && (
        <div className="flex items-center justify-end gap-2">
          <button
            id="btn-toolbar-download"
            onClick={() => downloadTemplateXlsx()}
            className="text-xs text-[#545f72] hover:text-primary hover:bg-surface-base border border-border-subtle bg-white px-4 py-2 rounded-sm flex items-center gap-1.5 transition-all font-medium h-10 cursor-pointer shadow-xs"
          >
            <Download className="h-4 w-4 text-primary" />
            Excel Template Download
          </button>
        </div>
      )}

      <div className="w-full">
        {loading ? (
          <StdItemsLoadingState />
        ) : error ? (
          <StdItemsErrorState error={error} onRetry={onRetry} />
        ) : (
          <StdTestItemTable
            items={items}
            onView={onView}
            onEdit={onEdit}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
          />
        )}
      </div>
    </div>
  );
}

function StdItemsLoadingState() {
  return (
    <div className="bg-white border border-border-subtle rounded-sm p-16 flex flex-col items-center justify-center gap-4 shadow-xs">
      <div className="h-8 w-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold text-secondary">
        TEMPLATE_STD_TEST_ITEM 데이터 로딩 중...
      </span>
    </div>
  );
}

function StdItemsErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-sm p-8 flex flex-col items-center gap-3">
      <AlertCircle className="h-8 w-8 text-rose-500" />
      <p className="text-sm font-bold text-rose-700">{error}</p>
      <button
        onClick={onRetry}
        className="mt-1 px-4 py-2 bg-primary text-white text-xs font-bold rounded-sm hover:bg-[#003366] transition-colors cursor-pointer"
      >
        재시도
      </button>
    </div>
  );
}

function VirtualizedModulePlaceholder({
  activeModule,
  setActiveModule,
}: {
  activeModule: string;
  setActiveModule: (module: string) => void;
}) {
  return (
    <div className="bg-white border border-border-subtle rounded-sm p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm select-none">
      <Settings
        className="h-12 w-12 text-slate-300 mx-auto animate-spin"
        style={{ animationDuration: '6s' }}
      />
      <h3 className="text-base font-bold text-primary font-hanken">
        [{activeModule.toUpperCase()}] Module Is Currently Virtualized
      </h3>
      <p className="text-xs text-secondary leading-relaxed">
        R&D 고유 위상 체계가 Test Item Master 핵심 DB 영역에 통합 조립 중입니다. 해당 모듈의
        커스텀 기준정보는 Master Data Management 탭에서 생성 및 교류하여 주시기 바랍니다.
      </p>
      <div className="pt-2">
        <button
          onClick={() => setActiveModule('test-master')}
          className="bg-primary hover:bg-[#003366] text-white font-extrabold text-xs py-2.5 px-5 rounded-sm transition-all cursor-pointer shadow-sm"
        >
          Test Item Master 데이터로 회귀
        </button>
      </div>
    </div>
  );
}

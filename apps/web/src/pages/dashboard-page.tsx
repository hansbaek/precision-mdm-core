import { useState, type Dispatch, type SetStateAction } from 'react';
import { AlertCircle, Download, Plus, Settings, Upload } from 'lucide-react';
import { downloadTemplateXlsx } from '@/api/template';
import FilterPanel from '@/components/FilterPanel';
import StdTestItemTable from '@/components/StdTestItemTable';
import TableSkeleton from '@/components/TableSkeleton';
import TemplateUploadModal from '@/components/TemplateUploadModal';
import { Button } from '@/components/ui/button';
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
  onDelete: (item: StdTestItem) => void;
  onAdd: () => void;
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
  onDelete: (item: StdTestItem) => void;
  onAdd: () => void;
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
  onDelete,
  onAdd,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
}: StdItemsSectionProps) {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-2xs text-secondary font-medium uppercase tracking-widest font-hanken">
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
          <Button
            id="btn-toolbar-add"
            onClick={onAdd}
            className="text-xs font-bold bg-accent hover:bg-accent-hover text-white mr-auto"
          >
            <Plus className="h-4 w-4" />
            신규 항목 추가
          </Button>
          <Button
            id="btn-toolbar-download"
            variant="outline"
            onClick={() => downloadTemplateXlsx()}
            className="text-xs font-medium text-secondary"
          >
            <Download className="h-4 w-4 text-primary" />
            Excel Template Download
          </Button>
          <Button
            id="btn-toolbar-upload"
            variant="outline"
            onClick={() => setUploadOpen(true)}
            className="text-xs font-medium text-secondary"
          >
            <Upload className="h-4 w-4 text-accent" />
            Excel Template Upload
          </Button>
          <TemplateUploadModal
            isOpen={uploadOpen}
            onClose={() => setUploadOpen(false)}
            onApplied={onRetry}
          />
        </div>
      )}

      <div className="w-full">
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <StdItemsErrorState error={error} onRetry={onRetry} />
        ) : (
          <StdTestItemTable
            items={items}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            onResetFilters={onReset}
          />
        )}
      </div>
    </div>
  );
}

function StdItemsErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-8 flex flex-col items-center gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm font-bold text-destructive">{error}</p>
      <Button size="sm" onClick={onRetry} className="mt-1 text-xs font-bold">
        재시도
      </Button>
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
    <div className="bg-card border border-border rounded-xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xs select-none">
      <Settings
        className="h-12 w-12 text-muted-foreground/40 mx-auto animate-spin"
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
        <Button onClick={() => setActiveModule('test-master')} className="font-extrabold text-xs">
          Test Item Master 데이터로 회귀
        </Button>
      </div>
    </div>
  );
}

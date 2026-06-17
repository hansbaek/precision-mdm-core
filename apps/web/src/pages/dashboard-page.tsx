import { useState, type Dispatch, type SetStateAction } from 'react';
import { AlertCircle, Download, Plus, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { downloadTemplateXlsx } from '@/api/template';
import FilterPanel from '@/components/FilterPanel';
import StdTestItemTable from '@/components/StdTestItemTable';
import TableSkeleton from '@/components/TableSkeleton';
import TemplateUploadModal from '@/components/TemplateUploadModal';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-permissions-store';
import type { FilterOptions, StdTestItem } from '@/types';

const DASHBOARD_MENU = 'test-master.dashboard';

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
  const { t } = useTranslation();
  return (
    <StdItemsSection
      {...props}
      breadcrumb={t('app.dashboard.breadcrumb')}
      title={t('app.dashboard.title')}
      showFilters
      showToolbar
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
  const { t } = useTranslation();
  const can = useCan();
  const canCreate = can(DASHBOARD_MENU, 'create');
  const canUpdate = can(DASHBOARD_MENU, 'update');
  const canDelete = can(DASHBOARD_MENU, 'delete');
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
          {canCreate && (
            <Button
              id="btn-toolbar-add"
              onClick={onAdd}
              className="text-xs font-bold bg-accent hover:bg-accent-hover text-white mr-auto"
            >
              <Plus className="h-4 w-4" />
              {t('app.dashboard.addItem')}
            </Button>
          )}
          <Button
            id="btn-toolbar-download"
            variant="outline"
            onClick={() => downloadTemplateXlsx()}
            className={`text-xs font-medium text-secondary${canCreate ? '' : ' ml-auto'}`}
          >
            <Download className="h-4 w-4 text-primary" />
            {t('app.dashboard.excelDownload')}
          </Button>
          {canUpdate && (
            <Button
              id="btn-toolbar-upload"
              variant="outline"
              onClick={() => setUploadOpen(true)}
              className="text-xs font-medium text-secondary"
            >
              <Upload className="h-4 w-4 text-accent" />
              {t('app.dashboard.excelUpload')}
            </Button>
          )}
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
            canEdit={canUpdate}
            canDelete={canDelete}
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

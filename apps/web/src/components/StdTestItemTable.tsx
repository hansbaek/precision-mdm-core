import { useState } from 'react';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  MoreVertical,
  Rows3,
  StretchHorizontal,
  Trash2,
} from 'lucide-react';

import EmptyState from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { StdTestItem } from '../types';
import { ALL_MARKETS } from '../types';

interface Props {
  items: StdTestItem[];
  onView: (item: StdTestItem) => void;
  onEdit: (item: StdTestItem) => void;
  onDelete: (item: StdTestItem) => void;
  sortBy: string;
  setSortBy: (f: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (o: 'asc' | 'desc') => void;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (n: number) => void;
  onResetFilters?: () => void;
  /** 권한 기반 행 액션 노출 (기본 true). */
  canEdit?: boolean;
  canDelete?: boolean;
}

function MarketChips({ active }: { active: string[] }) {
  const activeSet = new Set(active);
  return (
    <div className="flex flex-wrap gap-x-[3px] gap-y-[2px] max-w-[520px]">
      {ALL_MARKETS.map(code => {
        const on = activeSet.has(code);
        return (
          <span
            key={code}
            className={`text-2xs font-mono font-bold leading-none ${
              on ? 'text-info' : 'text-muted-foreground/40'
            }`}
          >
            {code}
          </span>
        );
      })}
    </div>
  );
}

function SortTh({
  field,
  label,
  sortBy,
  sortOrder,
  onSort,
  className = '',
}: {
  field: string;
  label: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  className?: string;
}) {
  const isActive = sortBy === field;
  const ariaSort = isActive ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none';

  return (
    <TableHead aria-sort={ariaSort} className={`px-4 h-12 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="flex items-center gap-1.5 w-full uppercase tracking-widest font-hanken font-bold text-2xs text-secondary hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:text-foreground"
      >
        {label}
        {isActive
          ? sortOrder === 'asc'
            ? <ChevronUp className="h-3 w-3 text-accent shrink-0" />
            : <ChevronDown className="h-3 w-3 text-accent shrink-0" />
          : <ArrowUpDown className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
      </button>
    </TableHead>
  );
}

export default function StdTestItemTable({
  items, onView, onEdit, onDelete,
  sortBy, setSortBy, sortOrder, setSortOrder,
  currentPage, setCurrentPage, itemsPerPage, setItemsPerPage,
  onResetFilters,
  canEdit = true, canDelete = true,
}: Props) {
  const [compact, setCompact] = useState(false);

  const handleSort = (field: string) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const total = items.length;
  const start = (currentPage - 1) * itemsPerPage;
  const end = Math.min(start + itemsPerPage, total);
  const pageItems = items.slice(start, end);
  const totalPages = Math.ceil(total / itemsPerPage) || 1;

  const cellPad = compact ? 'py-1.5' : 'py-3';

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col select-none shadow-xs">

      {/* Table */}
      <div className="overflow-x-auto w-full">
        <Table className="text-left">
          <TableHeader>
            <TableRow className="bg-muted border-b border-border hover:bg-muted sticky top-0 z-[1]">
              <SortTh field="id" label="ID" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="w-16 font-mono" />
              <SortTh field="productLine" label="Product Line" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="w-28" />
              <SortTh field="testItemName" label="Test Item" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="w-40" />
              <SortTh field="testMethod" label="Method" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="w-32" />
              <TableHead className="px-4 h-12 w-32 uppercase tracking-widest font-hanken font-bold text-2xs text-secondary">Condition</TableHead>
              <SortTh field="certiType" label="Certi Type" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="w-28" />
              <TableHead className="px-4 h-12 uppercase tracking-widest font-hanken font-bold text-2xs text-secondary">Market</TableHead>
              <TableHead className="px-4 h-12 text-center w-20 uppercase tracking-widest font-hanken font-bold text-2xs text-secondary">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <EmptyState
                    message="표시할 항목이 없습니다."
                    description="필터 조건을 조정하거나 초기화해 보세요."
                    actionLabel={onResetFilters ? '필터 초기화' : undefined}
                    onAction={onResetFilters}
                  />
                </TableCell>
              </TableRow>
            ) : pageItems.map(item => (
              <TableRow
                key={item.id}
                onClick={() => onView(item)}
                className="hover:bg-muted/50 transition-colors cursor-pointer border-border"
              >
                {/* ID */}
                <TableCell className={`px-4 ${cellPad} font-mono font-bold text-primary text-xs w-16`}>
                  {item.id}
                </TableCell>

                {/* Product Line */}
                <TableCell className={`px-4 ${cellPad} font-bold text-xs`}>
                  <Badge className="bg-info-container text-info border-info/20 rounded-md font-mono text-2xs font-bold">
                    {item.productLine || '–'}
                  </Badge>
                </TableCell>

                {/* Test Item */}
                <TableCell className={`px-4 ${cellPad} text-foreground font-semibold text-xs whitespace-normal`}>
                  {item.testItemName || '–'}
                </TableCell>

                {/* Method */}
                <TableCell className={`px-4 ${cellPad} font-mono font-bold text-foreground text-xs`}>
                  {item.testMethod || '–'}
                </TableCell>

                {/* Condition */}
                <TableCell className={`px-4 ${cellPad} text-muted-foreground font-mono text-xs`}>
                  {item.testCondition || '–'}
                </TableCell>

                {/* Certi Type */}
                <TableCell className={`px-4 ${cellPad} text-xs`}>
                  {item.certiType
                    ? (
                      <Badge variant="outline" className="rounded-md font-mono text-2xs font-bold text-muted-foreground">
                        {item.certiType}
                      </Badge>
                    )
                    : <span className="text-muted-foreground/40 font-mono">–</span>}
                </TableCell>

                {/* Market chips */}
                <TableCell className={`px-4 ${cellPad}`}>
                  <MarketChips active={item.markets} />
                </TableCell>

                {/* Actions */}
                <TableCell
                  className={`px-4 ${cellPad} text-center`}
                  onClick={e => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`항목 #${item.id} 작업 메뉴`}
                        className="rounded-full text-muted-foreground"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onSelect={() => onView(item)} className="font-semibold text-xs">
                        <Eye />
                        상세 보기
                      </DropdownMenuItem>
                      {canEdit && (
                        <DropdownMenuItem onSelect={() => onEdit(item)} className="font-semibold text-xs">
                          <Edit />
                          수정 (Edit)
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => onDelete(item)}
                            variant="destructive"
                            className="font-semibold text-xs"
                          >
                            <Trash2 />
                            삭제 (Delete)
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer / Pagination */}
      <div className="bg-muted/50 border-t border-border px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary select-none font-bold">
        <div className="flex items-center gap-3">
          <div aria-live="polite" className="font-semibold">
            Showing <span className="font-bold text-primary">{total ? start + 1 : 0}</span> to{' '}
            <span className="font-bold text-primary">{end}</span> of{' '}
            <span className="font-bold text-primary font-mono">{total}</span> items
          </div>

          {/* Density toggle */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="넓은 행 간격 (Comfortable)"
                  aria-pressed={!compact}
                  onClick={() => setCompact(false)}
                  className={`p-1.5 transition-colors cursor-pointer ${!compact ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
                >
                  <StretchHorizontal className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Comfortable</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="좁은 행 간격 (Compact)"
                  aria-pressed={compact}
                  onClick={() => setCompact(true)}
                  className={`p-1.5 transition-colors cursor-pointer ${compact ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
                >
                  <Rows3 className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Compact</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <nav aria-label="페이지 탐색" className="flex items-center gap-1.5">
          <PagBtn label="|<" ariaLabel="첫 페이지" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
          <PagBtn label="<" ariaLabel="이전 페이지" onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))} disabled={currentPage === 1} />
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => totalPages <= 5 || Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
            .map((p, idx, arr) => {
              if (idx > 0 && arr[idx - 1] !== p - 1)
                return [
                  <span key={`dots-${p}`} className="w-8 h-8 flex items-center justify-center font-mono text-muted-foreground">…</span>,
                  <PagNumBtn key={p} p={p} current={currentPage} onClick={() => setCurrentPage(p)} />,
                ];
              return <PagNumBtn key={p} p={p} current={currentPage} onClick={() => setCurrentPage(p)} />;
            })}
          <PagBtn label=">" ariaLabel="다음 페이지" onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages} />
          <PagBtn label=">|" ariaLabel="마지막 페이지" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
        </nav>

        <div className="flex items-center gap-2">
          <span className="text-secondary text-xs">Items per page:</span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
          >
            <SelectTrigger size="sm" className="font-mono font-bold text-xs w-20" aria-label="페이지당 항목 수">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map(n => (
                <SelectItem key={n} value={String(n)} className="font-mono text-xs">{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function PagBtn({ label, ariaLabel, onClick, disabled }: { label: string; ariaLabel: string; onClick: () => void; disabled: boolean }) {
  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className="font-mono text-2xs font-bold"
    >
      {label}
    </Button>
  );
}

function PagNumBtn({ p, current, onClick }: { p: number; current: number; onClick: () => void }) {
  const isActive = current === p;
  return (
    <Button
      variant={isActive ? 'default' : 'outline'}
      size="icon-sm"
      aria-label={`${p} 페이지`}
      aria-current={isActive ? 'page' : undefined}
      onClick={onClick}
      className="font-mono font-bold text-xs"
    >
      {p}
    </Button>
  );
}

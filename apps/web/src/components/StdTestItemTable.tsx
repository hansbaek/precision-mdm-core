import React, { useState } from 'react';
import { ArrowUpDown, Eye, Edit, MoreVertical } from 'lucide-react';
import type { StdTestItem } from '../types';
import { ALL_MARKETS } from '../types';

interface Props {
  items: StdTestItem[];
  onView: (item: StdTestItem) => void;
  onEdit: (item: StdTestItem) => void;
  sortBy: string;
  setSortBy: (f: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (o: 'asc' | 'desc') => void;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (n: number) => void;
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
            className={`text-[10px] font-mono font-bold leading-none ${
              on ? 'text-[#1a56db]' : 'text-slate-300'
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
  onSort,
  className = '',
}: {
  field: string;
  label: string;
  onSort: (field: string) => void;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1.5">
        {label}
        <ArrowUpDown className="h-3 w-3 text-slate-400 shrink-0" />
      </div>
    </th>
  );
}

export default function StdTestItemTable({
  items, onView, onEdit,
  sortBy, setSortBy, sortOrder, setSortOrder,
  currentPage, setCurrentPage, itemsPerPage, setItemsPerPage,
}: Props) {
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const handleSort = (field: string) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  React.useEffect(() => {
    const close = () => setActiveMenuId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const total = items.length;
  const start = (currentPage - 1) * itemsPerPage;
  const end = Math.min(start + itemsPerPage, total);
  const pageItems = items.slice(start, end);
  const totalPages = Math.ceil(total / itemsPerPage) || 1;

  return (
    <div className="bg-white border border-border-subtle rounded-sm overflow-hidden flex flex-col select-none">

      {/* Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f1f5f9] border-b border-border-subtle text-[11px] text-secondary uppercase tracking-widest font-hanken font-bold h-12 sticky top-0">
              <SortTh field="id" label="ID" onSort={handleSort} className="w-16 font-mono" />
              <SortTh field="productLine" label="Product Line" onSort={handleSort} className="w-28" />
              <SortTh field="testItemName" label="Test Item" onSort={handleSort} className="w-40" />
              <SortTh field="testMethod" label="Method" onSort={handleSort} className="w-32" />
              <th className="px-4 py-2.5 w-32">Condition</th>
              <SortTh field="certiType" label="Certi Type" onSort={handleSort} className="w-28" />
              <th className="px-4 py-2.5">Market</th>
              <th className="px-4 py-2.5 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-14 text-center text-slate-400 font-medium">
                  표시할 항목이 없습니다.
                </td>
              </tr>
            ) : pageItems.map(item => (
              <tr
                key={item.id}
                onClick={() => onView(item)}
                className="hover:bg-surface-base transition-all cursor-pointer"
              >
                {/* ID */}
                <td className="px-4 py-3 font-mono font-bold text-primary text-xs w-16">
                  {item.id}
                </td>

                {/* Product Line */}
                <td className="px-4 py-3 font-bold text-xs">
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-sm font-mono text-[11px]">
                    {item.productLine || '–'}
                  </span>
                </td>

                {/* Test Item */}
                <td className="px-4 py-3 text-slate-700 font-semibold text-xs">
                  {item.testItemName || '–'}
                </td>

                {/* Method */}
                <td className="px-4 py-3 font-mono font-bold text-slate-800 text-xs">
                  {item.testMethod || '–'}
                </td>

                {/* Condition */}
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                  {item.testCondition || '–'}
                </td>

                {/* Certi Type */}
                <td className="px-4 py-3 text-xs">
                  {item.certiType
                    ? <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-sm font-mono text-[11px] font-bold">{item.certiType}</span>
                    : <span className="text-slate-300 font-mono">–</span>}
                </td>

                {/* Market chips */}
                <td className="px-4 py-3">
                  <MarketChips active={item.markets} />
                </td>

                {/* Actions */}
                <td
                  className="px-4 py-3 text-center relative"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={e => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); }}
                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 transition-all"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {activeMenuId === item.id && (
                    <div className="absolute right-6 top-10 w-36 bg-white border border-border-subtle rounded-sm shadow-md py-1.5 text-left z-20 animate-fade-in">
                      <button
                        onClick={() => { onView(item); setActiveMenuId(null); }}
                        className="w-full px-4 py-2 hover:bg-surface-base text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold text-xs"
                      >
                        <Eye className="h-4 w-4 text-slate-400" />
                        상세 보기
                      </button>
                      <button
                        onClick={() => { onEdit(item); setActiveMenuId(null); }}
                        className="w-full px-4 py-2 hover:bg-surface-base text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold text-xs"
                      >
                        <Edit className="h-4 w-4 text-slate-400" />
                        수정 (Edit)
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="bg-slate-50 border-t border-border-subtle px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary select-none font-bold rounded-b-sm">
        <div className="font-noto font-semibold">
          Showing <span className="font-bold text-primary">{total ? start + 1 : 0}</span> to{' '}
          <span className="font-bold text-primary">{end}</span> of{' '}
          <span className="font-bold text-primary font-mono">{total}</span> items
        </div>

        <div className="flex items-center gap-1.5">
          <PagBtn label="|<" onClick={() => setCurrentPage(1)}            disabled={currentPage === 1} />
          <PagBtn label="<"  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))} disabled={currentPage === 1} />
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => totalPages <= 5 || Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
            .map((p, idx, arr) => {
              if (idx > 0 && arr[idx - 1] !== p - 1)
                return [
                  <span key={`dots-${p}`} className="w-8 h-8 flex items-center justify-center font-mono text-slate-400">…</span>,
                  <PagNumBtn key={p} p={p} current={currentPage} onClick={() => setCurrentPage(p)} />,
                ];
              return <PagNumBtn key={p} p={p} current={currentPage} onClick={() => setCurrentPage(p)} />;
            })}
          <PagBtn label=">"  onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages} />
          <PagBtn label=">|" onClick={() => setCurrentPage(totalPages)}   disabled={currentPage === totalPages} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-secondary text-xs">Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="bg-white border border-border-subtle rounded-sm py-1 px-2.5 outline-none font-bold h-8 cursor-pointer font-mono text-center text-xs text-slate-700"
          >
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function PagBtn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 bg-white border border-border-subtle rounded-sm hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all font-mono cursor-pointer flex items-center justify-center text-[10px] font-bold"
    >
      {label}
    </button>
  );
}

function PagNumBtn({ p, current, onClick }: { p: number; current: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-sm font-mono font-bold transition-all cursor-pointer flex items-center justify-center text-xs ${
        current === p
          ? 'bg-primary text-white border border-primary shadow-sm'
          : 'bg-white border border-border-subtle hover:bg-slate-50 text-slate-700'
      }`}
    >
      {p}
    </button>
  );
}

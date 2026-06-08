/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MoreVertical, ArrowUpDown, Edit, Eye, Trash2, CheckSquare, AlertTriangle } from 'lucide-react';
import type { TestItem } from '../types';

interface TestItemTableProps {
  items: TestItem[];
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onEdit: (item: TestItem) => void;
  onView: (item: TestItem) => void;
  onDelete: (id: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
  sortBy: string;
  setSortBy: (field: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  onBulkStatusChange: (status: 'Active' | 'Pending' | 'Inactive') => void;
  onBulkDelete: () => void;
}

export default function TestItemTable({
  items,
  selectedIds,
  setSelectedIds,
  onEdit,
  onView,
  onDelete,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onBulkStatusChange,
  onBulkDelete
}: TestItemTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Sorting Handler
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(items.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Pagination Math
  const totalItemsCount = items.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItemsCount);
  const paginatedItems = items.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalItemsCount / itemsPerPage) || 1;

  // Toggle Row Options Dropdown
  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  // Close menus on outside click handler
  React.useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <div className="bg-white border border-border-subtle rounded-sm overflow-hidden flex flex-col select-none">
      
      {/* 1. Bulk Edit Action Overlay (Shows when items are checked) */}
      {selectedIds.length > 0 && (
        <div id="bulk-edit-strip" className="bg-surface-base border-b border-accent/20 px-5 py-3 flex items-center justify-between animate-fade-in text-xs font-noto">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="h-4.5 w-4.5 text-accent" />
            <span className="font-bold text-slate-700">
              <span className="text-accent font-extrabold font-mono text-sm">{selectedIds.length}</span>개 R&D 항목 선택됨 (Bulk Selection)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="bulk-btn-active"
              onClick={() => onBulkStatusChange('Active')}
              className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-sm transition-all font-bold cursor-pointer text-[11px]"
            >
              Active로 변경
            </button>
            <button
              id="bulk-btn-inactive"
              onClick={() => onBulkStatusChange('Inactive')}
              className="px-3.5 py-1.5 hover:bg-rose-50 text-rose-700 bg-white border border-slate-200 rounded-sm transition-all font-bold cursor-pointer text-[11px]"
            >
              Inactive로 변경
            </button>
            <button
              id="bulk-btn-delete"
              onClick={onBulkDelete}
              className="px-3.5 py-1.5 hover:bg-rose-600 hover:text-white text-rose-600 bg-white border border-rose-200 rounded-sm transition-all font-bold flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              선택 삭제 (Delete)
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Data Grid Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f1f5f9] border-b border-border-subtle text-[11px] text-secondary uppercase tracking-widest font-hanken font-bold h-12 select-none sticky top-0">
              {/* Checkbox column */}
              <th className="px-5 py-2.5 w-12 text-center">
                <input
                  id="select-all-checkbox"
                  type="checkbox"
                  checked={items.length > 0 && selectedIds.length === items.length}
                  onChange={handleSelectAll}
                  className="rounded-sm cursor-pointer border-slate-300 accent-accent h-4 w-4"
                />
              </th>
              
              <th 
                className="px-5 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors font-mono w-32"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-1.5">
                  TEST ITEM ID
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              <th 
                className="px-5 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-1.5">
                  CATEGORY
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              <th 
                className="px-5 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('nameKr')}
              >
                <div className="flex items-center gap-1.5">
                  TEST ITEM NAME
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              <th 
                className="px-5 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('specification')}
              >
                <div className="flex items-center gap-1.5">
                  SPECIFICATION
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              <th className="px-5 py-2.5 font-noto">UNIT</th>

              <th 
                className="px-5 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors text-center w-32"
                onClick={() => handleSort('mandatory')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  MANDATORY
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              <th 
                className="px-5 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors w-32"
                onClick={() => handleSort('lastUpdated')}
              >
                <div className="flex items-center gap-1.5">
                  LAST UPDATED
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              <th 
                className="px-5 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors w-28"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1.5">
                  STATUS
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>

              <th className="px-5 py-2.5 text-center w-24">ACTIONS</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs font-noto">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-5 py-14 text-center text-slate-400 font-medium bg-white">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertTriangle className="h-8 w-8 text-slate-300" />
                    <span className="font-bold text-slate-700">일치하는 R&D 시험 항목이 없습니다.</span>
                    <span className="text-[10px] text-slate-400 font-mono">No matching Test Items found. Adjust filters.</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <tr 
                    key={item.id}
                    id={`table-row-${item.id}`}
                    onClick={() => onView(item)}
                    className={`hover:bg-surface-base transition-all cursor-pointer ${
                      isSelected ? 'bg-accent/5 font-medium' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-5 py-3 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        id={`checkbox-row-${item.id}`}
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                        className="rounded-sm cursor-pointer border-slate-300 accent-accent h-4 w-4"
                      />
                    </td>

                    {/* Test Item ID (JetBrains Mono for Technical IDs) */}
                    <td className="px-5 py-3.5 font-mono font-bold text-primary tracking-tight text-xs">
                      {item.id}
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3.5 text-secondary font-bold text-xs">
                      {item.category}
                    </td>

                    {/* Test Item Name (KR) + (EN) */}
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      <div className="flex flex-col">
                        <span className="text-slate-950 font-extrabold text-[12.5px] font-noto">{item.nameKr}</span>
                        <span className="text-[10px] text-secondary font-mono font-medium mt-0.5">
                          ({item.nameEn})
                        </span>
                      </div>
                    </td>

                    {/* Specification */}
                    <td className="px-5 py-3.5 text-slate-600 font-bold font-mono">
                      {item.specification}
                    </td>

                    {/* Unit */}
                    <td className="px-5 py-3.5 text-slate-600 font-bold font-mono">
                      {item.unit}
                    </td>

                    {/* Mandatory Badge */}
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold select-none ${
                        item.mandatory === 'REQUIRED'
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {item.mandatory}
                      </span>
                    </td>

                    {/* Last Updated */}
                    <td className="px-5 py-3.5 text-slate-400 font-mono font-semibold">
                      {item.lastUpdated}
                    </td>

                    {/* Status Dot */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 font-extrabold">
                        <span className={`h-2 w-2 rounded-full ring-2 ring-white ${
                          item.status === 'Active'
                            ? 'bg-emerald-500'
                            : item.status === 'Pending'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                        }`} />
                        <span className={
                          item.status === 'Active'
                            ? 'text-emerald-700'
                            : item.status === 'Pending'
                              ? 'text-amber-700'
                              : 'text-rose-700'
                        }>
                          {item.status}
                        </span>
                      </div>
                    </td>

                    {/* Row Actions ellipses Menu */}
                    <td className="px-5 py-3.5 text-center relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        id={`btn-row-action-${item.id}`}
                        onClick={(e) => toggleDropdown(item.id, e)}
                        className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 transition-all"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {/* Dropdown Options Box */}
                      {activeMenuId === item.id && (
                        <div 
                          id={`dropdown-menu-${item.id}`}
                          className="absolute right-6 top-10 w-40 bg-white border border-border-subtle rounded-sm shadow-md py-1.5 text-left z-20 animate-fade-in font-noto overflow-hidden"
                        >
                          <button
                            id={`opt-view-${item.id}`}
                            onClick={() => onView(item)}
                            className="w-full px-4 py-2 hover:bg-surface-base text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                          >
                            <Eye className="h-4 w-4 text-slate-400" />
                            <span>상세 보기 (View)</span>
                          </button>
                          <button
                            id={`opt-edit-${item.id}`}
                            onClick={() => onEdit(item)}
                            className="w-full px-4 py-2 hover:bg-surface-base text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer font-semibold"
                          >
                            <Edit className="h-4 w-4 text-slate-400" />
                            <span>수정 (Edit)</span>
                          </button>
                          <div className="border-t border-border-subtle my-1" />
                          <button
                            id={`opt-delete-${item.id}`}
                            onClick={() => onDelete(item.id)}
                            className="w-full px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 transition-colors cursor-pointer font-extrabold"
                          >
                            <Trash2 className="h-4 w-4 text-rose-450" />
                            <span>삭제 (Delete)</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Grid Table Footer control bar */}
      <div className="bg-slate-50 border-t border-border-subtle px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary select-none font-bold rounded-b-sm">
        
        {/* Pagination Status Text */}
        <div className="font-noto font-semibold">
          Showing <span className="font-bold text-primary">{totalItemsCount ? startIndex + 1 : 0}</span> to{' '}
          <span className="font-bold text-primary">{endIndex}</span> of{' '}
          <span className="font-bold text-primary font-mono">{totalItemsCount}</span> items
        </div>

        {/* Paginator Controls */}
        <div className="flex items-center gap-1.5">
          {/* First Page */}
          <button
            id="pag-first"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="w-8 h-8 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-all font-mono cursor-pointer flex items-center justify-center text-[10px] font-bold"
          >
            {'|<'}
          </button>
          
          {/* Previous Page */}
          <button
            id="pag-prev"
            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-all font-mono cursor-pointer flex items-center justify-center text-[10px] font-bold"
          >
            {'<'}
          </button>

          {/* Render Page Numbers carefully */}
          {Array.from({ length: totalPages }, (_, idx) => {
            const p = idx + 1;
            // Only draw relevant bounds for clean pagination if plenty of pages
            if (totalPages > 5 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
              if (p === 2 && currentPage > 4) {
                return (
                  <span key="dots-start" className="w-8 h-8 flex items-center justify-center font-mono text-slate-400">
                    ...
                  </span>
                );
              }
              if (p === totalPages - 1 && currentPage < totalPages - 3) {
                return (
                  <span key="dots-end" className="w-8 h-8 flex items-center justify-center font-mono text-slate-400">
                    ...
                  </span>
                );
              }
              return null;
            }

            const isCurrent = currentPage === p;
            return (
              <button
                key={p}
                id={`pag-page-${p}`}
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded-sm font-mono font-bold transition-all cursor-pointer flex items-center justify-center text-xs ${
                  isCurrent
                    ? 'bg-primary text-white border border-primary shadow-sm'
                    : 'bg-white border border-border-subtle hover:bg-slate-50 text-slate-700'
                }`}
              >
                {p}
              </button>
            );
          })}

          {/* Next Page */}
          <button
            id="pag-next"
            onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 bg-white border border-border-subtle rounded-sm hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-all font-mono cursor-pointer flex items-center justify-center text-[10px] font-bold"
          >
            {'>'}
          </button>

          {/* Last Page */}
          <button
            id="pag-last"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 bg-white border border-border-subtle rounded-sm hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-all font-mono cursor-pointer flex items-center justify-center text-[10px] font-bold"
          >
            {'>|'}
          </button>
        </div>

        {/* Selected Density Controls */}
        <div className="flex items-center gap-2 font-noto">
          <span className="text-secondary text-xs">Items per page:</span>
          <select
            id="select-items-per-page"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-border-subtle rounded-sm py-1 px-2.5 focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none font-bold h-8 cursor-pointer font-mono text-center text-xs text-slate-700"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        
      </div>
    </div>
  );
}

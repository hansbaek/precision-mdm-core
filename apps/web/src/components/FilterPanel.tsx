/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { PRODUCT_LINES, CATEGORIES } from '../types';
import type { FilterOptions } from '../types';

interface FilterPanelProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onSearch: () => void;
  onReset: () => void;
}

export default function FilterPanel({ filters, setFilters, onSearch, onReset }: FilterPanelProps) {
  
  const handleFilterChange = (field: keyof FilterOptions, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="bg-white border border-border-subtle rounded-sm p-5 text-slate-800 select-none relative overflow-hidden">
      {/* 5-Column Grid Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 제품라인 (Product Line) */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-noto">
            제품라인 / Product Line
          </label>
          <select
            id="filter-product-line"
            value={filters.productLine}
            onChange={(e) => handleFilterChange('productLine', e.target.value)}
            className="w-full text-xs text-slate-700 bg-surface-base hover:bg-slate-100/70 border border-border-subtle rounded-sm px-3.5 outline-none transition-all font-bold h-10 cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="">All Product Lines</option>
            {PRODUCT_LINES.map((pl) => (
              <option key={pl.value} value={pl.value}>
                {pl.label}
              </option>
            ))}
          </select>
        </div>

        {/* 시험분류 (Test Category) */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-noto">
            시험분류 / Test Category
          </label>
          <select
            id="filter-category"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full text-xs text-slate-700 bg-surface-base hover:bg-slate-100/70 border border-border-subtle rounded-sm px-3.5 outline-none transition-all font-bold h-10 cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* 시험항목명 (Test Item Name) */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-noto">
            시험항목명 / Test Item Name
          </label>
          <input
            id="filter-search-query"
            type="text"
            placeholder="Search item name..."
            value={filters.searchQuery}
            onKeyDown={handleKeyDown}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            className="w-full text-xs text-slate-700 bg-surface-base hover:bg-slate-100 border border-border-subtle rounded-sm px-3.5 outline-none transition-all font-bold h-10 focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {/* 상태 (Status) */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-noto">
            기준 상태 / Status
          </label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full text-xs text-slate-700 bg-surface-base hover:bg-slate-100/70 border border-border-subtle rounded-sm px-3.5 outline-none transition-all font-bold h-10 cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="">All</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* 등록기간 (Date Range) */}
        <div className="flex flex-col">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-noto">
            등록기간 / Date Range
          </label>
          <div className="flex items-center gap-1.5 h-10">
            <div className="relative flex-1">
              <input
                id="filter-start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full text-[11px] text-slate-700 bg-surface-base border border-border-subtle rounded-sm px-2 outline-none font-mono h-9 cursor-pointer focus:border-primary"
               />
            </div>
            <span className="text-secondary font-bold text-xs">~</span>
            <div className="relative flex-1">
              <input
                id="filter-end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full text-[11px] text-slate-700 bg-surface-base border border-border-subtle rounded-sm px-2 outline-none font-mono h-9 cursor-pointer focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Buttons: Reset & Search */}
      <div className="mt-5 flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
        <button
          id="btn-filter-reset"
          onClick={onReset}
          className="text-xs text-secondary hover:text-primary hover:border-secondary bg-white border border-border-subtle px-5 rounded-sm flex items-center gap-1.5 transition-all font-bold h-10 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
        <button
          id="btn-filter-search"
          onClick={onSearch}
          className="text-xs text-white bg-primary hover:bg-[#003366] px-6 rounded-sm flex items-center gap-1.5 transition-all font-bold h-10 cursor-pointer shadow-sm"
        >
          <Search className="h-3.5 w-3.5" />
          Search
        </button>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, RotateCcw, AlertTriangle } from 'lucide-react';
import { useStdCodes } from '../hooks/use-std-codes';
import { ALL_MARKETS } from '../types';
import type { FilterOptions } from '../types';

interface FilterPanelProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onSearch: () => void;
  onReset: () => void;
}

const MARKET_SET = new Set<string>(ALL_MARKETS);

export default function FilterPanel({ filters, setFilters, onSearch, onReset }: FilterPanelProps) {
  const { data: productLines } = useStdCodes('PRODUCT_LINE', 2);

  // Validate the free-text Market input against the known market codes.
  const marketTokens = filters.markets
    .split(/[,\s]+/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);
  const unknownMarkets = [...new Set(marketTokens.filter((t) => !MARKET_SET.has(t)))];
  const knownCount = marketTokens.length - marketTokens.filter((t) => !MARKET_SET.has(t)).length;
  const allUnknown = marketTokens.length > 0 && knownCount === 0;

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
      {/* 3-Column Grid Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 제품라인 (Product Line) */}
        <div>
          <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">
            제품라인 / Product Line
          </label>
          <select
            id="filter-product-line"
            value={filters.productLine}
            onChange={(e) => handleFilterChange('productLine', e.target.value)}
            className="w-full text-xs text-slate-700 bg-surface-base hover:bg-slate-100/70 border border-border-subtle rounded-sm px-3.5 outline-none transition-all font-bold h-10 cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            {productLines.map((pl) => (
              <option key={pl.codeCd} value={pl.codeCd}>
                {pl.codeCd}
              </option>
            ))}
          </select>
        </div>

        {/* 시험항목명 (Test Item Name) */}
        <div>
          <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">
            시험 항목 / Test Item
          </label>
          <input
            id="filter-search-query"
            type="text"
            placeholder="Search item / method / condition..."
            value={filters.searchQuery}
            onKeyDown={handleKeyDown}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            className="w-full text-xs text-slate-700 bg-surface-base hover:bg-slate-100 border border-border-subtle rounded-sm px-3.5 outline-none transition-all font-bold h-10 focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {/* 시장 (Market) — 콤마/스페이스로 여러 개 입력 */}
        <div>
          <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">
            시장 / Market
          </label>
          <input
            id="filter-markets"
            type="text"
            placeholder="예: A0, K1 NA (콤마·스페이스 구분)"
            value={filters.markets}
            onKeyDown={handleKeyDown}
            onChange={(e) => handleFilterChange('markets', e.target.value)}
            className={`w-full text-xs text-slate-700 bg-surface-base hover:bg-slate-100 border rounded-sm px-3.5 outline-none transition-all font-bold h-10 font-mono uppercase focus:ring-2 ${
              unknownMarkets.length > 0
                ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                : 'border-border-subtle focus:border-primary focus:ring-primary/10'
            }`}
          />
          {unknownMarkets.length > 0 && (
            <p className="mt-1.5 flex items-start gap-1 text-[10px] font-bold text-rose-600 leading-snug">
              <AlertTriangle className="h-3 w-3 shrink-0 mt-px" />
              <span>
                알 수 없는 시장 코드: <span className="font-mono">{unknownMarkets.join(', ')}</span>
                {allUnknown ? ' — 조회 결과가 없습니다.' : ' (무시됨)'}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Buttons: Reset & Search */}
      <div className="mt-5 flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle">
        <button
          id="btn-filter-reset"
          onClick={onReset}
          className="text-xs text-secondary hover:text-primary hover:border-secondary bg-white border border-border-subtle px-5 rounded-sm flex items-center gap-1.5 transition-all font-bold h-6 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
        <button
          id="btn-filter-search"
          onClick={onSearch}
          className="text-xs text-white bg-primary hover:bg-[#003366] px-6 rounded-sm flex items-center gap-1.5 transition-all font-bold h-6 cursor-pointer shadow-sm"
        >
          <Search className="h-3.5 w-3.5" />
          Search
        </button>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, RotateCcw, Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStdCodes } from '../hooks/use-std-codes';
import { ALL_MARKETS } from '../types';
import type { FilterOptions } from '../types';

interface FilterPanelProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onSearch: () => void;
  onReset: () => void;
}

export default function FilterPanel({ filters, setFilters, onSearch, onReset }: FilterPanelProps) {
  const { data: productLines } = useStdCodes('PRODUCT_LINE', 2);

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
    <div className="bg-card border border-border rounded-xl p-5 text-foreground select-none relative shadow-xs">
      {/* 3-Column Grid Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 제품라인 (Product Line) */}
        <div>
          <label
            htmlFor="filter-product-line"
            className="block text-2xs font-medium text-muted-foreground uppercase tracking-widest mb-2"
          >
            제품라인 / Product Line
          </label>
          <Select
            value={filters.productLine}
            onValueChange={(value) => handleFilterChange('productLine', value)}
          >
            <SelectTrigger
              id="filter-product-line"
              className="w-full h-10 data-[size=default]:h-10 text-xs font-bold font-mono"
            >
              <SelectValue placeholder="제품라인 선택" />
            </SelectTrigger>
            <SelectContent>
              {productLines.map((pl) => (
                <SelectItem key={pl.codeCd} value={pl.codeCd} className="text-xs font-mono font-bold">
                  {pl.codeCd}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 시험항목명 (Test Item Name) */}
        <div>
          <label
            htmlFor="filter-search-query"
            className="block text-2xs font-medium text-muted-foreground uppercase tracking-widest mb-2"
          >
            시험 항목 / Test Item
          </label>
          <input
            id="filter-search-query"
            type="text"
            placeholder="Search item / method / condition..."
            value={filters.searchQuery}
            onKeyDown={handleKeyDown}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            className="w-full text-xs text-foreground bg-background hover:bg-muted/60 border border-border rounded-lg px-3.5 outline-none transition-all font-bold h-10 focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </div>

        {/* 시장 (Market) — 멀티셀렉트 */}
        <div>
          <label className="block text-2xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
            시장 / Market
          </label>
          <MarketMultiSelect
            value={filters.markets}
            onChange={(value) => handleFilterChange('markets', value)}
          />
        </div>
      </div>

      {/* Buttons: Reset & Search */}
      <div className="mt-5 flex items-center justify-end gap-2.5 pt-4 border-t border-border">
        <Button id="btn-filter-reset" variant="outline" size="sm" onClick={onReset} className="text-xs font-bold">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
        <Button id="btn-filter-search" size="sm" onClick={onSearch} className="text-xs font-bold px-6">
          <Search className="h-3.5 w-3.5" />
          Search
        </Button>
      </div>
    </div>
  );
}

/**
 * Markets are stored upstream as a comma-separated string (FilterOptions.markets),
 * so this control parses/serializes that format — hooks and API stay untouched.
 */
function MarketMultiSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    const tokens = value
      .split(/[,\s]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    return new Set(tokens);
  }, [value]);

  const toggle = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(ALL_MARKETS.filter((m) => next.has(m)).join(','));
  };

  const selectedList = ALL_MARKETS.filter((m) => selected.has(m));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id="filter-markets"
          type="button"
          role="combobox"
          aria-expanded={open}
          className="w-full min-h-10 flex items-center gap-1.5 flex-wrap text-xs text-foreground bg-background hover:bg-muted/60 border border-border rounded-lg px-3 py-1.5 outline-none transition-all font-bold cursor-pointer focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {selectedList.length === 0 ? (
            <span className="text-muted-foreground/70 font-medium">전체 시장 (선택 안 함)</span>
          ) : (
            selectedList.map((code) => (
              <Badge
                key={code}
                variant="secondary"
                className="font-mono text-2xs gap-0.5 rounded-md bg-info-container text-info border-info/20"
                asChild
              >
                <span>
                  {code}
                  {/* Block the trigger's pointerdown/click so removal doesn't toggle the popover */}
                  <span
                    role="button"
                    aria-label={`${code} 제거`}
                    className="inline-flex items-center justify-center -mr-0.5 p-0.5 rounded-sm cursor-pointer opacity-60 hover:opacity-100 hover:bg-info/10"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(code);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </span>
              </Badge>
            ))
          )}
          <ChevronsUpDown className="h-3.5 w-3.5 ml-auto shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder="시장 코드 검색..." />
          <CommandList className="max-h-56">
            <CommandEmpty>해당 시장 코드가 없습니다.</CommandEmpty>
            <CommandGroup>
              {ALL_MARKETS.map((code) => {
                const on = selected.has(code);
                return (
                  <CommandItem
                    key={code}
                    value={code}
                    onSelect={() => toggle(code)}
                    className="font-mono font-bold text-xs"
                  >
                    <Check className={`h-3.5 w-3.5 ${on ? 'opacity-100 text-info' : 'opacity-0'}`} />
                    {code}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

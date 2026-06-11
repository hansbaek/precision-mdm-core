/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Check, ChevronsUpDown, Eraser } from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';

interface SearchComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Allow selecting an empty value (blank rows exist in TEMPLATE). */
  allowClear?: boolean;
  mono?: boolean;
  id?: string;
}

/**
 * Single-select searchable combobox (list-only — no free input by policy).
 * A current value that is not in the reference list is pinned at the top as
 * "(기준 외)" so legacy rows stay selectable without re-introducing typos.
 */
export default function SearchCombobox({
  value,
  onChange,
  options,
  placeholder = '선택...',
  disabled = false,
  loading = false,
  allowClear = false,
  mono = false,
  id,
}: SearchComboboxProps) {
  const [open, setOpen] = useState(false);

  const valueInOptions = value === '' || options.includes(value);

  const select = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={`w-full h-9 flex items-center gap-1.5 text-xs text-foreground bg-card hover:bg-muted/60 border border-border rounded-lg px-3 outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 ${mono ? 'font-mono' : ''}`}
        >
          {value ? (
            <span className="truncate font-semibold">
              {value}
              {!valueInOptions && (
                <span className="ml-1.5 text-2xs text-warning font-bold">(기준 외)</span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground/70">{placeholder}</span>
          )}
          {loading ? (
            <Spinner className="h-3.5 w-3.5 ml-auto shrink-0 text-muted-foreground" />
          ) : (
            <ChevronsUpDown className="h-3.5 w-3.5 ml-auto shrink-0 text-muted-foreground" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0">
        <Command>
          <CommandInput placeholder="검색..." />
          <CommandList className="max-h-56">
            <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
            <CommandGroup>
              {allowClear && value !== '' && (
                <CommandItem value="__clear__" onSelect={() => select('')} className="text-xs text-muted-foreground">
                  <Eraser className="h-3.5 w-3.5" />
                  (빈값으로 지우기)
                </CommandItem>
              )}
              {!valueInOptions && value !== '' && (
                <CommandItem
                  value={`__current__ ${value}`}
                  onSelect={() => select(value)}
                  className={`text-xs font-semibold ${mono ? 'font-mono' : ''}`}
                >
                  <Check className="h-3.5 w-3.5 opacity-100 text-warning" />
                  {value}
                  <span className="text-2xs text-warning font-bold">(기준 외)</span>
                </CommandItem>
              )}
              {options.map((opt) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => select(opt)}
                  className={`text-xs ${mono ? 'font-mono' : ''}`}
                >
                  <Check className={`h-3.5 w-3.5 ${value === opt ? 'opacity-100 text-info' : 'opacity-0'}`} />
                  {opt}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

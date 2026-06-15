/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface MultiComboboxProps {
  /** Serialized multi-value string, e.g. "A, D, T" */
  value: string;
  onChange: (value: string) => void;
  options: string[];
  /** Joins selected tokens — defaults to ', ' to match existing DB format. */
  separator?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  /** Option highlighted (focused) by default when the list opens — selection unchanged until clicked. */
  defaultHighlight?: string;
}

/**
 * Multi-select combobox over a serialized string value (generalized from the
 * market filter in FilterPanel). Legacy tokens outside the option list stay
 * visible as removable "(기준 외)" chips; new tokens come from the list only.
 */
export default function MultiCombobox({
  value,
  onChange,
  options,
  separator = ', ',
  placeholder = '선택...',
  disabled = false,
  id,
  defaultHighlight,
}: MultiComboboxProps) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    return value
      .split(/,\s*/)
      .map((t) => t.trim())
      .filter(Boolean);
  }, [value]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const serialize = (tokens: string[]) => {
    // Known options keep list order; legacy tokens trail in original order.
    const inList = options.filter((o) => tokens.includes(o));
    const legacy = tokens.filter((t) => !options.includes(t));
    return [...inList, ...legacy].join(separator);
  };

  const toggle = (token: string) => {
    const next = selectedSet.has(token)
      ? selected.filter((t) => t !== token)
      : [...selected, token];
    onChange(serialize(next));
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
          className="w-full min-h-9 flex items-center gap-1.5 flex-wrap text-xs text-foreground bg-card hover:bg-muted/60 border border-border rounded-lg px-3 py-1.5 outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {selected.length === 0 ? (
            <span className="text-muted-foreground/70">{placeholder}</span>
          ) : (
            selected.map((token) => {
              const legacy = !options.includes(token);
              return (
                <Badge
                  key={token}
                  variant="secondary"
                  className={`font-mono text-2xs gap-0.5 rounded-md ${
                    legacy
                      ? 'bg-warning-container text-warning border-warning/20'
                      : 'bg-info-container text-info border-info/20'
                  }`}
                  asChild
                >
                  <span>
                    {token}
                    {legacy && <span className="font-sans">(기준 외)</span>}
                    <span
                      role="button"
                      aria-label={`${token} 제거`}
                      className="inline-flex items-center justify-center -mr-0.5 p-0.5 rounded-sm cursor-pointer opacity-60 hover:opacity-100"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(token);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </span>
                </Badge>
              );
            })
          )}
          <ChevronsUpDown className="h-3.5 w-3.5 ml-auto shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-56 p-0">
        <Command defaultValue={defaultHighlight}>
          <CommandInput placeholder="검색..." />
          <CommandList className="max-h-56">
            <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const on = selectedSet.has(opt);
                return (
                  <CommandItem key={opt} value={opt} onSelect={() => toggle(opt)} className="text-xs font-semibold">
                    <Check className={`h-3.5 w-3.5 ${on ? 'opacity-100 text-info' : 'opacity-0'}`} />
                    {opt}
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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import {
  BarChart3,
  Compass,
  Database,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Moon,
  ShieldCheck,
  Sun,
  Tractor,
} from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useTheme } from '@/components/theme/use-theme';
import type { StdTestItem } from '@/types';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: StdTestItem[];
  onSelectTab: (tab: string) => void;
  onSelectModule: (module: string) => void;
  onViewItem: (item: StdTestItem) => void;
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileText },
];

const MODULES = [
  { id: 'test-master', label: 'Test Item Master', icon: Database },
  { id: 'material-specs', label: 'Material Specs', icon: FileSpreadsheet },
  { id: 'vehicle-config', label: 'Vehicle Config', icon: Tractor },
  { id: 'testing-protocols', label: 'Testing Protocols', icon: Compass },
  { id: 'data-audit', label: 'Data Audit', icon: ShieldCheck },
];

export default function CommandPalette({
  open,
  onOpenChange,
  items,
  onSelectTab,
  onSelectModule,
  onViewItem,
}: CommandPaletteProps) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  const runAndClose = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="MDM Command Palette"
      description="페이지 이동, 모듈 전환, 시험 항목 검색"
    >
      <CommandInput placeholder="Search MDM Index... (페이지 / 모듈 / 시험 항목)" />
      <CommandList>
        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>

        <CommandGroup heading="페이지 (Pages)">
          {TABS.map((tab) => (
            <CommandItem
              key={tab.id}
              value={`page ${tab.label}`}
              onSelect={() => runAndClose(() => onSelectTab(tab.id))}
            >
              <tab.icon />
              <span>{tab.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="모듈 (Modules)">
          {MODULES.map((module) => (
            <CommandItem
              key={module.id}
              value={`module ${module.label}`}
              onSelect={() => runAndClose(() => onSelectModule(module.id))}
            >
              <module.icon />
              <span>{module.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="테마 (Theme)">
          <CommandItem
            value="theme toggle dark light 테마 전환"
            onSelect={() => runAndClose(() => setTheme(theme === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'light' ? <Moon /> : <Sun />}
            <span>{theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}</span>
          </CommandItem>
        </CommandGroup>

        {items.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`시험 항목 (Test Items · ${items.length})`}>
              {items.slice(0, 50).map((item) => (
                <CommandItem
                  key={item.id}
                  value={`item #${item.id} ${item.productLine} ${item.testItemName} ${item.testMethod}`}
                  onSelect={() => runAndClose(() => onViewItem(item))}
                >
                  <FlaskConical />
                  <span className="font-mono font-bold text-primary shrink-0">#{item.id}</span>
                  <span className="truncate">{item.testItemName || '–'}</span>
                  <span className="ml-auto text-2xs text-muted-foreground font-mono shrink-0">
                    {item.productLine || '–'}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
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
  { id: 'dashboard', labelKey: 'app.tabs.dashboard', icon: LayoutDashboard },
  { id: 'test-match', labelKey: 'app.tabs.testMatch', icon: FlaskConical },
  { id: 'analytics', labelKey: 'app.tabs.analytics', icon: BarChart3 },
  { id: 'reports', labelKey: 'app.tabs.reports', icon: FileText },
];

// 사이드바(Sidebar.tsx)의 모듈 순서와 일치시킨다.
const MODULES = [
  { id: 'test-master', labelKey: 'app.nav.testMaster', icon: Database },
  { id: 'testing-protocols', labelKey: 'app.nav.classificationMaster', icon: Compass },
  { id: 'material-specs', labelKey: 'app.nav.materialSpecs', icon: FileSpreadsheet },
  { id: 'vehicle-config', labelKey: 'app.nav.vehicleConfig', icon: Tractor },
  { id: 'data-audit', labelKey: 'app.nav.dataAudit', icon: ShieldCheck },
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
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

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

  // 팔레트를 닫으면 다음에 열 때 깨끗한 상태로 보이도록 검색어를 비운다.
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  // cmdk는 "렌더된" 항목만 필터링하므로, 항목 그룹은 전체 목록을 직접 검색한 뒤
  // 상위 결과만 렌더링한다. 이렇게 해야 항목 수가 크게 늘어도 검색이 전수를 대상으로
  // 동작하고, DOM 부담은 RENDER_CAP개로 제한된다.
  const RENDER_CAP = 50;
  const matchedItems = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return items;
    return items.filter((item) => {
      const haystack =
        `#${item.id} ${item.productLine ?? ''} ${item.testItemName ?? ''} ${item.testMethod ?? ''}`.toLowerCase();
      return tokens.every((tk) => haystack.includes(tk));
    });
  }, [items, query]);
  const visibleItems = matchedItems.slice(0, RENDER_CAP);

  const runAndClose = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="MDM Command Palette"
      description={t('app.palette.desc')}
    >
      <CommandInput placeholder={t('app.palette.placeholder')} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{t('app.palette.empty')}</CommandEmpty>

        <CommandGroup heading={t('app.palette.pages')}>
          {TABS.map((tab) => (
            <CommandItem
              key={tab.id}
              value={`page ${t(tab.labelKey)}`}
              onSelect={() => runAndClose(() => onSelectTab(tab.id))}
            >
              <tab.icon />
              <span>{t(tab.labelKey)}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t('app.palette.modules')}>
          {MODULES.map((module) => (
            <CommandItem
              key={module.id}
              value={`module ${t(module.labelKey)}`}
              onSelect={() => runAndClose(() => onSelectModule(module.id))}
            >
              <module.icon />
              <span>{t(module.labelKey)}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t('app.palette.theme')}>
          <CommandItem
            value="theme toggle dark light 테마 전환"
            onSelect={() => runAndClose(() => setTheme(theme === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'light' ? <Moon /> : <Sun />}
            <span>{theme === 'light' ? t('app.palette.toDark') : t('app.palette.toLight')}</span>
          </CommandItem>
        </CommandGroup>

        {visibleItems.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`${t('app.palette.testItems')} · ${matchedItems.length}`}>
              {visibleItems.map((item) => (
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
              {matchedItems.length > visibleItems.length && (
                <div className="px-2 py-1.5 text-2xs text-muted-foreground">
                  {t('app.palette.moreResults', {
                    count: matchedItems.length - visibleItems.length,
                  })}
                </div>
              )}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

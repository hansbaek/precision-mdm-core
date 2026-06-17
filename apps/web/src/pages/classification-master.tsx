import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Layers, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  getClassificationList,
  getClassificationModes,
  type ClassificationRow,
} from '@/api/test-classification';

const PAGE_SIZE = 50;

export default function ClassificationMaster() {
  const { t } = useTranslation();
  const [modes, setModes] = useState<string[]>([]);
  const [mode, setMode] = useState('Indoor');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [item, setItem] = useState('');
  const [rows, setRows] = useState<ClassificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getClassificationModes()
      .then(setModes)
      .catch(() => setModes(['Indoor', 'Material', 'Outdoor']));
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    getClassificationList({ mode, search })
      .then((data) => {
        if (ignore) return;
        setRows(data);
        setGroup('');
        setItem('');
        setPage(1);
      })
      .catch(() => !ignore && setError('분류 마스터를 불러오지 못했습니다.'))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [mode, search]);

  // 그룹/항목 캐스케이드 — 현재 모드 데이터셋에서 파생 (모드와 항상 일관).
  const groupOptions = useMemo(
    () => [...new Set(rows.map((r) => r.group).filter(Boolean))].sort(),
    [rows],
  );
  const itemOptions = useMemo(
    () =>
      [
        ...new Set(
          rows
            .filter((r) => !group || r.group === group)
            .map((r) => r.item)
            .filter(Boolean),
        ),
      ].sort(),
    [rows, group],
  );

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) => (!group || r.group === group) && (!item || r.item === item),
      ),
    [rows, group, item],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const onGroupChange = (g: string) => {
    setGroup(g);
    setItem('');
    setPage(1);
  };
  const onItemChange = (it: string) => {
    setItem(it);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-2xs text-secondary font-medium uppercase tracking-widest font-hanken">
          {t('app.classification.breadcrumb')}
        </nav>
        <h2 className="font-hanken font-extrabold text-primary text-2xl tracking-tight mt-1.5 uppercase">
          {t('app.classification.title')}
        </h2>
        <p className="text-xs text-secondary mt-1">{t('app.classification.desc')}</p>
      </div>

      {/* 필터 */}
      <section className="bg-card border border-border rounded-xl shadow-xs p-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-2xs font-bold text-secondary uppercase tracking-wider">{t('app.classification.mode')}</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-xs font-mono bg-card text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          >
            <option value="ALL">{t('app.classification.allMode')}</option>
            {modes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-2xs font-bold text-secondary uppercase tracking-wider">{t('app.classification.group')}</label>
          <select
            value={group}
            onChange={(e) => onGroupChange(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-xs bg-card text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 max-w-48"
          >
            <option value="">{t('app.classification.allGroups')}</option>
            {groupOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-2xs font-bold text-secondary uppercase tracking-wider">{t('app.classification.item')}</label>
          <select
            value={item}
            onChange={(e) => onItemChange(e.target.value)}
            disabled={itemOptions.length === 0}
            className="border border-border rounded-lg px-3 py-2 text-xs bg-card text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 max-w-48 disabled:opacity-50"
          >
            <option value="">{t('app.classification.allItems')}</option>
            {itemOptions.map((it) => (
              <option key={it} value={it}>
                {it}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 min-w-56 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput.trim())}
            placeholder={t('app.classification.searchPlaceholder')}
            className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-xs focus:border-primary focus:ring-2 focus:ring-ring/30 outline-none text-foreground bg-card"
          />
        </div>
        <Button
          size="sm"
          onClick={() => setSearch(searchInput.trim())}
          className="text-xs font-bold bg-accent hover:bg-accent-hover text-white"
        >
          <Search className="h-3.5 w-3.5" />
          {t('search')}
        </Button>
        {(search || searchInput || group || item) && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setGroup('');
              setItem('');
              setPage(1);
            }}
            className="text-xs font-medium"
          >
            {t('app.classification.reset')}
          </Button>
        )}
        <span className="text-2xs text-secondary font-mono ml-auto">
          {loading ? t('loading') : t('app.classification.count', { n: filtered.length })}
        </span>
      </section>

      {error ? (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-8 flex flex-col items-center gap-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-bold text-destructive">{error}</p>
        </div>
      ) : loading ? (
        <div className="bg-card border border-border rounded-xl p-12 flex justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <section className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 text-2xs uppercase tracking-wider text-secondary">
                  <th className="px-4 py-2.5 text-left font-bold">{t('app.classification.colMode')}</th>
                  <th className="px-4 py-2.5 text-left font-bold">{t('app.classification.colGroup')}</th>
                  <th className="px-4 py-2.5 text-left font-bold">{t('app.classification.colItem')}</th>
                  <th className="px-4 py-2.5 text-left font-bold">{t('app.classification.colMethod')}</th>
                  <th className="px-4 py-2.5 text-left font-bold">{t('app.classification.colCondition')}</th>
                  <th className="px-4 py-2.5 text-left font-bold">{t('app.classification.colLevel')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      {t('app.classification.noRows')}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono text-secondary">{r.mode || '–'}</td>
                      <td className="px-4 py-2 text-foreground">{r.group || '–'}</td>
                      <td className="px-4 py-2 font-bold text-foreground">{r.item || '–'}</td>
                      <td className="px-4 py-2 text-secondary">{r.method || '–'}</td>
                      <td className="px-4 py-2 font-mono text-secondary">{r.condition || '–'}</td>
                      <td className="px-4 py-2">
                        <span className="text-2xs font-mono font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                          {r.level || '–'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs">
              <span className="text-2xs text-muted-foreground font-mono">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-xs font-bold"
                >
                  {t('app.classification.prev')}
                </Button>
                <span className="font-mono text-2xs text-secondary">
                  {page} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="text-xs font-bold"
                >
                  {t('app.classification.next')}
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      <p className="text-2xs text-muted-foreground flex items-center gap-1.5">
        <Layers className="h-3 w-3" />
        {t('app.classification.readonly')}
      </p>
    </div>
  );
}

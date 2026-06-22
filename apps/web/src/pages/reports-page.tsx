import { useEffect, useState } from 'react';
import { AlertTriangle, Download, FileText, Printer, Search } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  exportTestMatchXlsx,
  matchTests,
  type MatchResult,
  type MatchedTest,
  type TireAttrs,
} from '@/api/test-match';

/** 조건 컬럼 → i18n 라벨 (없으면 컬럼명 그대로). */
const label = (t: TFunction, col: string) => t(`app.col.${col}`, col);

interface Props {
  /** 탭 간 공유되는 현재 mcode (있으면 기본값 + 자동 실행). */
  initialMcode?: string;
  /** 조회 실행 성공 시 공유 mcode 갱신. */
  onQueried?: (mcode: string) => void;
}

export default function ReportsPage({ initialMcode = '', onQueried }: Props) {
  const { t } = useTranslation();
  const [mcode, setMcode] = useState(initialMcode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);

  const runWith = async (raw: string) => {
    const mc = raw.trim();
    if (!mc) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await matchTests(mc));
      onQueried?.(mc);
    } catch (e) {
      setResult(null);
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        const serverMsg = (e.response.data as { message?: string } | undefined)?.message;
        setError(serverMsg || `mcode '${mc}'`);
      } else {
        setError(t('error.default'));
      }
    } finally {
      setLoading(false);
    }
  };
  const run = () => runWith(mcode);

  // 마운트 시 공유 mcode(필요시험조회에서 입력한 값)가 있으면 기본값으로 자동 실행.
  useEffect(() => {
    if (initialMcode) void runWith(initialMcode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <nav className="text-2xs text-secondary font-bold uppercase tracking-widest font-mono">
          {t('app.reports.breadcrumb')}
        </nav>
        <h2 className="font-hanken font-extrabold text-primary text-2xl tracking-tight mt-1.5 uppercase">
          {t('app.reports.title')}
        </h2>
        <p className="text-xs text-secondary mt-1">{t('app.reports.desc')}</p>
      </div>

      {/* 검색/인쇄 바 — 인쇄 시 숨김 */}
      <section className="bg-card border border-border rounded-xl shadow-xs p-5 flex items-center gap-3 print:hidden">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={mcode}
            onChange={(e) => setMcode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            placeholder={t('app.reports.placeholder')}
            className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-xs font-mono focus:border-primary focus:ring-2 focus:ring-ring/30 outline-none text-foreground bg-card transition-all"
          />
        </div>
        <Button
          size="sm"
          onClick={run}
          disabled={loading || !mcode.trim()}
          className="text-xs font-bold bg-accent hover:bg-accent-hover text-white px-5"
        >
          {loading ? <Spinner className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
          {loading ? t('app.reports.generating') : t('app.reports.generate')}
        </Button>
        {result && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              className="text-xs font-bold"
            >
              <Printer className="h-3.5 w-3.5" />
              {t('app.reports.print')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                exportTestMatchXlsx(result.tire.mcode).catch(() =>
                  toast.error(t('app.reports.excelFailed')),
                )
              }
              className="text-xs font-bold"
            >
              <Download className="h-3.5 w-3.5 text-success" />
              {t('app.reports.excel')}
            </Button>
          </>
        )}
      </section>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold px-4 py-3 rounded-lg flex items-center gap-2 print:hidden">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && <Report result={result} />}
    </div>
  );
}

function Report({ result }: { result: MatchResult }) {
  const { t } = useTranslation();
  const { tire, matched, matchedCount, total } = result;
  // 전체 미평가 요약 (컬럼별 영향 시험 수)
  const uneval = new Map<string, { reason: string; count: number }>();
  for (const m of matched)
    for (const u of m.unevaluatedDetail) {
      const cur = uneval.get(u.col);
      uneval.set(u.col, { reason: u.reason, count: (cur?.count ?? 0) + 1 });
    }

  return (
    <div className="bg-card border border-border rounded-xl shadow-xs max-w-4xl mx-auto print:border-0 print:shadow-none">
      {/* 문서 헤더 */}
      <div className="border-b border-border p-6 text-center">
        <h4 className="text-sm font-bold tracking-widest text-primary uppercase">
          Hankook Tire &amp; Technology
        </h4>
        <h3 className="text-lg font-bold mt-1 text-primary font-hanken">{t('app.reports.docTitle')}</h3>
        <div className="flex justify-between text-2xs text-secondary font-mono mt-4">
          <span>MCODE: {tire.mcode}</span>
          <span>{t('app.reports.issueDate')}: {new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>

      {/* 타이어 속성 요약 */}
      <div className="p-6 border-b border-border">
        <h5 className="text-2xs font-extrabold text-secondary uppercase tracking-widest mb-2">
          {t('app.reports.targetTire')}
        </h5>
        <TireSummary tire={tire} />
        <p className="text-2xs text-muted-foreground mt-3">
          {t('app.reports.matchSummary', { total, matched: matchedCount })}
        </p>
      </div>

      {/* 미평가 요약 */}
      {uneval.size > 0 && (
        <div className="p-6 border-b border-border bg-warning-container/30">
          <h5 className="text-2xs font-extrabold text-warning uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t('app.reports.unevalSummary')}
          </h5>
          <ul className="space-y-1 text-xs text-foreground/90">
            {[...uneval.entries()].map(([col, { reason, count }]) => (
              <li key={col} className="flex items-center gap-2">
                <span className="font-bold font-mono text-warning">{label(t, col)}</span>
                <span className="text-muted-foreground">— {reason}</span>
                <span className="text-2xs text-muted-foreground/70">({t('app.reports.affected', { n: count })})</span>
              </li>
            ))}
          </ul>
          <p className="text-2xs text-muted-foreground mt-2">※ {t('app.reports.unevalNote')}</p>
        </div>
      )}

      {/* 시험별 추출 이유 */}
      <div className="p-6 space-y-4">
        <h5 className="text-2xs font-extrabold text-secondary uppercase tracking-widest flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          {t('app.reports.extractedTests')} ({matched.length})
        </h5>
        {matched.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('app.reports.noTests')}</p>
        ) : (
          matched.map((m) => <TestBlock key={m.id} test={m} />)
        )}
      </div>
    </div>
  );
}

function TireSummary({ tire }: { tire: TireAttrs }) {
  const { t } = useTranslation();
  const cells: [string, React.ReactNode][] = [
    [t('app.col.PRODUCT_LINE'), tire.productLine || '–'],
    [t('app.testMatch.repMarket'), tire.market.codes.join(', ') || '–'],
    [t('common.size'), tire.tireSize || '–'],
    ['SS', tire.ss || '–'],
    ['LI', tire.li ?? '–'],
    ['PLY', tire.ply ?? '–'],
    [t('app.col.RIM_INCH'), tire.rimInch ?? '–'],
    ['TL', tire.tlIndicator || '–'],
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
      {cells.map(([k, v]) => (
        <div key={k} className="flex flex-col">
          <span className="text-2xs font-bold text-secondary uppercase">{k}</span>
          <span className="text-xs font-mono font-bold text-foreground">{v}</span>
        </div>
      ))}
    </div>
  );
}

function TestBlock({ test }: { test: MatchedTest }) {
  const { t } = useTranslation();
  return (
    <div className="border border-border rounded-lg p-4 break-inside-avoid">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="font-bold text-sm text-foreground">
          <span className="font-mono text-2xs text-muted-foreground mr-2">#{test.id}</span>
          {test.testItemName}
          {test.testMethod && <span className="text-secondary font-medium"> / {test.testMethod}</span>}
        </div>
        <span className="font-mono text-sm text-secondary shrink-0">
          {test.expandedCondition || test.testCondition || ''}
        </span>
      </div>

      {/* 추출 이유 */}
      <div className="space-y-1">
        <span className="text-2xs font-bold text-success uppercase tracking-wider">{t('app.reports.reason')}</span>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
          {test.reasons.map((r, i) => (
            <li key={i} className="text-xs flex items-baseline gap-1.5">
              <span className="text-success font-bold">✓</span>
              <span className="font-bold text-foreground">{label(t, r.col)}</span>
              <span className="font-mono text-2xs text-muted-foreground">
                {r.col === 'MARKET' || r.col === 'PRODUCT_LINE'
                  ? r.tireValue
                  : `${r.tireValue} ⟵ ${r.templateValue}`}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 미평가 */}
      {test.unevaluatedDetail.length > 0 && (
        <div className="space-y-1 mt-2 pt-2 border-t border-border/60">
          <span className="text-2xs font-bold text-warning uppercase tracking-wider">{t('app.reports.uneval')}</span>
          <ul className="space-y-0.5">
            {test.unevaluatedDetail.map((u, i) => (
              <li key={i} className="text-xs flex items-baseline gap-1.5">
                <AlertTriangle className="h-3 w-3 text-warning shrink-0 translate-y-0.5" />
                <span className="font-bold text-foreground">{label(t, u.col)}</span>
                <span className="font-mono text-2xs text-muted-foreground">
                  조건 {u.templateValue} — {u.reason}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { AlertTriangle, Search, Beaker } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { matchTests, type MatchResult, type TireAttrs } from '@/api/test-match';

interface Props {
  /** 탭 간 공유되는 현재 mcode (마운트 시 자동 조회). */
  initialMcode?: string;
  /** 조회 실행 성공 시 공유 mcode 갱신. */
  onQueried?: (mcode: string) => void;
}

export default function TestMatchPage({ initialMcode = '', onQueried }: Props) {
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
      const data = await matchTests(mc);
      setResult(data);
      onQueried?.(mc);
    } catch (e) {
      setResult(null);
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        const serverMsg = (e.response.data as { message?: string } | undefined)?.message;
        setError(serverMsg || `mcode '${mc}' 정보를 찾을 수 없습니다. (활성/마켓 정보 확인)`);
      } else {
        setError('조회 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };
  const run = () => runWith(mcode);

  // 마운트 시 공유 mcode가 있으면 자동 조회 (탭 복귀 시 결과 복원).
  useEffect(() => {
    if (initialMcode) void runWith(initialMcode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* 검색 바 */}
      <section className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-xs font-extrabold text-primary uppercase tracking-widest flex items-center gap-2">
            <Beaker className="h-4 w-4 text-accent" />
            {t('app.testMatch.title')}
          </h2>
          <p className="text-2xs text-secondary mt-1">{t('app.testMatch.desc')}</p>
        </div>
        <div className="p-5 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={mcode}
              onChange={(e) => setMcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run()}
              placeholder={t('app.testMatch.placeholder')}
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
            {loading ? t('app.testMatch.searching') : t('app.testMatch.search')}
          </Button>
        </div>
      </section>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <>
          <TireCard tire={result.tire} />
          <MatchedTable result={result} />
        </>
      )}
    </div>
  );
}

function Field({ label, value, mono = true }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="space-y-1 min-w-0">
      <label className="text-2xs font-bold text-secondary uppercase tracking-wider">{label}</label>
      <p
        className={`text-xs font-bold text-foreground bg-muted/50 border border-border rounded-lg px-3 py-2 truncate ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value ?? '–'}
      </p>
    </div>
  );
}

function TireCard({ tire }: { tire: TireAttrs }) {
  const { t } = useTranslation();
  return (
    <section className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          {t('app.testMatch.tireAttrs')} · {tire.mcode}
        </h3>
        <span className="text-2xs font-mono font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">
          {tire.productLine || '–'}
        </span>
      </div>
      <div className="p-5 space-y-4">
        {/* 대표마켓 */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-2xs font-bold text-secondary uppercase tracking-wider">
              {t('app.testMatch.repMarket')}
            </label>
            <span className="text-2xs text-muted-foreground/70 font-mono">
              main_market={tire.mainMarket ?? '–'} · {tire.market.source}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tire.market.codes.length ? (
              tire.market.codes.map((c) => (
                <span
                  key={c}
                  className="px-2 py-1 rounded-md text-2xs font-mono font-bold bg-info text-white border border-info"
                >
                  {c}
                </span>
              ))
            ) : (
              <span className="text-2xs text-muted-foreground">{t('app.testMatch.marketUndecided')}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          <Field label="SIZE" value={tire.tireSize} />
          <Field label="RIM INCH" value={tire.rimInch} />
          <Field label="SS" value={tire.ss} />
          <Field label="LI" value={tire.li} />
          <Field label="PLY" value={tire.ply} />
          <Field label="GRV DEPTH" value={tire.grvDepth} />
          <Field label="RADIAL/BIAS" value={tire.radialBias} />
          <Field label="SEGMENT" value={tire.segment.length ? tire.segment.join(', ') : null} />
          <Field label="FRT" value={tire.frt} />
          <Field label="POR" value={tire.por} />
          <Field label="WINTER" value={tire.winter} />
          <Field label="POSITION" value={tire.tirePosition} />
          <Field label="TL" value={tire.tlIndicator} />
        </div>
      </div>
    </section>
  );
}

function MatchedTable({ result }: { result: MatchResult }) {
  const { t } = useTranslation();
  const { matched, matchedCount, total } = result;
  return (
    <section className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">{t('app.testMatch.requiredTests')}</h3>
        <span className="text-2xs font-mono font-bold text-secondary">
          {t('app.testMatch.matchedOf', { matched: matchedCount, total })}
        </span>
      </div>

      {matched.length === 0 ? (
        <div className="p-10 text-center text-xs text-muted-foreground">
          {t('app.testMatch.noMatch')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 text-2xs uppercase tracking-wider text-secondary">
                <th className="px-4 py-2.5 text-left font-bold">#</th>
                <th className="px-4 py-2.5 text-left font-bold">{t('app.testMatch.colTest')}</th>
                <th className="px-4 py-2.5 text-left font-bold">{t('app.testMatch.colMethod')}</th>
                <th className="px-4 py-2.5 text-left font-bold">{t('app.testMatch.colCondition')}</th>
                <th className="px-4 py-2.5 text-left font-bold">{t('app.testMatch.colSeverity')}</th>
                <th className="px-4 py-2.5 text-left font-bold">{t('app.testMatch.colCerti')}</th>
                <th className="px-4 py-2.5 text-left font-bold">{t('app.testMatch.colMarketHit')}</th>
                <th className="px-4 py-2.5 text-left font-bold">{t('app.testMatch.colUneval')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {matched.map((m) => (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{m.id}</td>
                  <td className="px-4 py-2.5 font-bold text-foreground">{m.testItemName || '–'}</td>
                  <td className="px-4 py-2.5 text-secondary">{m.testMethod || '–'}</td>
                  <td className="px-4 py-2.5 font-mono text-secondary">
                    {m.expandedCondition || m.testCondition || '–'}
                  </td>
                  <td className="px-4 py-2.5 font-mono">{m.endurSvrty || '–'}</td>
                  <td className="px-4 py-2.5 font-mono text-2xs">
                    {m.certiTestYn === 'Y' || m.certiType ? (
                      <span className="text-info">{m.certiType || 'Y'}</span>
                    ) : (
                      '–'
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {m.marketHits.length ? (
                        m.marketHits.map((h) => (
                          <span
                            key={h}
                            className="px-1.5 py-0.5 rounded text-2xs font-mono font-bold bg-info/10 text-info"
                          >
                            {h}
                          </span>
                        ))
                      ) : (
                        <span className="text-2xs text-muted-foreground/60">{t('app.testMatch.all')}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {m.unevaluated.length ? (
                      <span
                        title={`평가하지 못한 조건: ${m.unevaluated.join(', ')}`}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-bold bg-warning-container text-warning"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {m.unevaluated.join(', ')}
                      </span>
                    ) : (
                      <span className="text-2xs text-muted-foreground/40">–</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

import { useEffect, useRef, type ReactNode } from 'react';
import { animate, useInView } from 'framer-motion';
import { AlertCircle, Beaker, Database, Globe, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { StdStats } from '@/types';

interface AnalyticsPageProps {
  stats: StdStats | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export default function AnalyticsPage({
  stats,
  loading,
  error,
  onRetry,
}: AnalyticsPageProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <nav className="text-2xs text-secondary font-bold uppercase tracking-widest font-mono">
          {t('app.analytics.breadcrumb')}
        </nav>
        <h2 className="font-hanken font-extrabold text-primary text-2xl tracking-tight mt-1.5 uppercase">
          {t('app.analytics.title')}
        </h2>
      </div>

      {loading ? (
        <StatsLoadingState />
      ) : error ? (
        <StatsErrorState error={error} onRetry={onRetry} />
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              label={t('app.analytics.total')}
              value={stats.total}
              unit={t('app.analytics.unitCount')}
              icon={<Database className="h-10 w-10 text-primary bg-muted border border-border p-2 rounded-lg" />}
            />
            <StatCard
              label={t('app.analytics.productLines')}
              value={stats.distinctProductLines}
              unit={t('app.analytics.unitKind')}
              icon={<Layers className="h-10 w-10 text-info bg-info-container p-2 rounded-lg" />}
            />
            <StatCard
              label={t('app.analytics.testMethods')}
              value={stats.distinctTestMethods}
              unit={t('app.analytics.unitKind')}
              icon={<Beaker className="h-10 w-10 text-success bg-success-container p-2 rounded-lg" />}
            />
            <StatCard
              label={t('app.analytics.avgMarkets')}
              value={stats.avgMarketsPerItem}
              unit={t('app.analytics.unitEach')}
              valueClassName="text-accent"
              icon={<Globe className="h-10 w-10 text-warning bg-warning-container p-2 rounded-lg" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <ProductLineDistribution stats={stats} />
            <TestMethodDistribution stats={stats} />
          </div>

          <MarketCoverage stats={stats} />
        </>
      ) : null}
    </div>
  );
}

/** Animated count-up for stat values. */
function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const isFloat = !Number.isInteger(value);

  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const controls = animate(0, value, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (latest) => {
        node.textContent = isFloat ? latest.toFixed(1) : String(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [inView, value, isFloat]);

  return <span ref={ref} className={className}>0</span>;
}

function StatCard({
  label,
  value,
  unit,
  icon,
  valueClassName = 'text-primary',
}: {
  label: string;
  value: number;
  unit: string;
  icon: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="bg-card p-6 border border-border rounded-xl flex items-center justify-between shadow-xs">
      <div className="space-y-1">
        <span className="text-2xs text-secondary font-bold uppercase tracking-wider">
          {label}
        </span>
        <p className={`text-2xl font-extrabold font-mono ${valueClassName}`}>
          <CountUp value={value} /> <span className="text-xs font-normal"> {unit}</span>
        </p>
      </div>
      {icon}
    </div>
  );
}

function ProductLineDistribution({ stats }: { stats: StdStats }) {
  const { t } = useTranslation();
  return (
    <div className="bg-card p-6 border border-border rounded-xl space-y-5 shadow-xs">
      <div className="flex items-center gap-2">
        <Layers className="h-4.5 w-4.5 text-accent" />
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          {t('app.analytics.byProductLine')}
        </h3>
      </div>
      <div className="space-y-4 pt-1">
        {stats.byProductLine.map(({ name, count }) => {
          const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
          return (
            <div key={name} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-foreground font-semibold font-mono">{name}</span>
                <span className="text-secondary font-mono font-bold">
                  {count}건 <span className="text-accent">({pct}%)</span>
                </span>
              </div>
              <div className="h-2.5 bg-muted rounded-md overflow-hidden w-full flex border border-border">
                <div
                  className="bg-chart-1 h-full rounded-md transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TestMethodDistribution({ stats }: { stats: StdStats }) {
  const { t } = useTranslation();
  return (
    <div className="bg-card p-6 border border-border rounded-xl space-y-5 shadow-xs">
      <div className="flex items-center gap-2">
        <Beaker className="h-4.5 w-4.5 text-accent" />
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          {t('app.analytics.byTestMethod')}
        </h3>
      </div>
      <div className="space-y-3 pt-1">
        {stats.byTestMethod.slice(0, 8).map(({ name, count }) => {
          const max = stats.byTestMethod[0]?.count || 1;
          const pct = Math.round((count / max) * 100) || 0;
          return (
            <div key={name} className="space-y-1">
              <div className="flex justify-between items-center text-xs font-medium gap-2">
                <span className="text-foreground font-semibold truncate" title={name}>
                  {name}
                </span>
                <span className="text-secondary font-mono font-bold shrink-0">
                  {count}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-md overflow-hidden w-full flex border border-border">
                <div
                  className="bg-chart-4 h-full rounded-md transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MarketCoverage({ stats }: { stats: StdStats }) {
  const { t } = useTranslation();
  const max = Math.max(...stats.marketCoverage.map((m) => m.count), 1);

  return (
    <div className="bg-card p-6 border border-border rounded-xl space-y-4 shadow-xs">
      <div className="flex items-center gap-2">
        <Globe className="h-4.5 w-4.5 text-accent" />
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          {t('app.analytics.marketCoverage')} · {stats.total}
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-2.5 pt-1">
        {stats.marketCoverage.map(({ code, count }) => {
          const pct = Math.round((count / max) * 100) || 0;
          return (
            <div key={code} className="flex items-center gap-2">
              <span className="text-2xs font-mono font-bold text-muted-foreground w-7 shrink-0">
                {code}
              </span>
              <div className="h-2 bg-muted rounded-md overflow-hidden flex-1 flex border border-border">
                <div
                  className="bg-info h-full rounded-md transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-2xs font-mono font-bold text-secondary w-6 text-right shrink-0">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatsLoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card p-6 border border-border rounded-xl flex items-center justify-between shadow-xs">
            <div className="space-y-2.5 flex-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-7 w-20" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-card p-6 border border-border rounded-xl space-y-4 shadow-xs">
            <Skeleton className="h-4 w-48" />
            {Array.from({ length: 4 }).map((_, r) => (
              <div key={r} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-2.5 w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-8 flex flex-col items-center gap-3">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm font-bold text-destructive">{error}</p>
      <Button size="sm" onClick={onRetry} className="mt-1 text-xs font-bold">
        재시도
      </Button>
    </div>
  );
}

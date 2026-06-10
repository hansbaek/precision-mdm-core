import type { ReactNode } from 'react';
import { AlertCircle, Beaker, Database, Globe, Layers } from 'lucide-react';
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
  return (
    <div className="space-y-6">
      <div>
        <nav className="text-[10px] text-secondary font-bold uppercase tracking-widest font-mono">
          MDM Home / R&D 통계 대시보드
        </nav>
        <h2 className="font-hanken font-extrabold text-primary text-2xl tracking-tight mt-1.5 uppercase">
          R&D Test Master Metrics
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
              label="전체 템플릿 항목"
              value={stats.total}
              unit="건"
              icon={<Database className="h-10 w-10 text-primary bg-surface-base border border-border-subtle p-2 rounded-sm" />}
            />
            <StatCard
              label="제품라인 (Product Line)"
              value={stats.distinctProductLines}
              unit="종"
              icon={<Layers className="h-10 w-10 text-primary bg-blue-50 p-2 rounded-sm" />}
            />
            <StatCard
              label="시험방법 (Test Method)"
              value={stats.distinctTestMethods}
              unit="종"
              icon={<Beaker className="h-10 w-10 text-indigo-600 bg-indigo-50 p-2 rounded-sm" />}
            />
            <StatCard
              label="평균 적용 시장 / 항목"
              value={stats.avgMarketsPerItem}
              unit="개"
              valueClassName="text-accent"
              icon={<Globe className="h-10 w-10 text-amber-500 bg-amber-50 p-2 rounded-sm" />}
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
    <div className="bg-white p-6 border border-border-subtle rounded-sm flex items-center justify-between shadow-xs">
      <div className="space-y-1">
        <span className="text-[10px] text-[#545f72] font-bold uppercase tracking-wider">
          {label}
        </span>
        <p className={`text-2xl font-extrabold font-mono ${valueClassName}`}>
          {value} <span className="text-xs font-normal"> {unit}</span>
        </p>
      </div>
      {icon}
    </div>
  );
}

function ProductLineDistribution({ stats }: { stats: StdStats }) {
  return (
    <div className="bg-white p-6 border border-border-subtle rounded-sm space-y-5 shadow-xs">
      <div className="flex items-center gap-2">
        <Layers className="h-4.5 w-4.5 text-accent" />
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          제품라인별 분포 (Product Line)
        </h3>
      </div>
      <div className="space-y-4 pt-1">
        {stats.byProductLine.map(({ name, count }) => {
          const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
          return (
            <div key={name} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-slate-700 font-semibold font-mono">{name}</span>
                <span className="text-[#545f72] font-mono font-bold">
                  {count}건 <span className="text-accent">({pct}%)</span>
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-sm overflow-hidden w-full flex border border-border-subtle">
                <div
                  className="bg-primary h-full rounded-sm transition-all duration-500"
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
  return (
    <div className="bg-white p-6 border border-border-subtle rounded-sm space-y-5 shadow-xs">
      <div className="flex items-center gap-2">
        <Beaker className="h-4.5 w-4.5 text-accent" />
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          시험방법별 분포 (Top 8)
        </h3>
      </div>
      <div className="space-y-3 pt-1">
        {stats.byTestMethod.slice(0, 8).map(({ name, count }) => {
          const max = stats.byTestMethod[0]?.count || 1;
          const pct = Math.round((count / max) * 100) || 0;
          return (
            <div key={name} className="space-y-1">
              <div className="flex justify-between items-center text-xs font-medium gap-2">
                <span className="text-slate-700 font-semibold truncate" title={name}>
                  {name}
                </span>
                <span className="text-[#545f72] font-mono font-bold shrink-0">
                  {count}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-sm overflow-hidden w-full flex border border-border-subtle">
                <div
                  className="bg-indigo-500 h-full rounded-sm transition-all duration-500"
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
  const max = Math.max(...stats.marketCoverage.map((m) => m.count), 1);

  return (
    <div className="bg-white p-6 border border-border-subtle rounded-sm space-y-4 shadow-xs">
      <div className="flex items-center gap-2">
        <Globe className="h-4.5 w-4.5 text-accent" />
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          시장별 커버리지 (Market Coverage) · 전체 {stats.total}건 기준
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-2.5 pt-1">
        {stats.marketCoverage.map(({ code, count }) => {
          const pct = Math.round((count / max) * 100) || 0;
          return (
            <div key={code} className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-slate-600 w-7 shrink-0">
                {code}
              </span>
              <div className="h-2 bg-slate-100 rounded-sm overflow-hidden flex-1 flex border border-border-subtle">
                <div
                  className="bg-[#1a56db] h-full rounded-sm transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-[#545f72] w-6 text-right shrink-0">
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
    <div className="bg-white border border-border-subtle rounded-sm p-16 flex flex-col items-center justify-center gap-4 shadow-xs">
      <div className="h-8 w-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold text-secondary">집계 통계 로딩 중...</span>
    </div>
  );
}

function StatsErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-sm p-8 flex flex-col items-center gap-3">
      <AlertCircle className="h-8 w-8 text-rose-500" />
      <p className="text-sm font-bold text-rose-700">{error}</p>
      <button
        onClick={onRetry}
        className="mt-1 px-4 py-2 bg-primary text-white text-xs font-bold rounded-sm hover:bg-[#003366] transition-colors cursor-pointer"
      >
        재시도
      </button>
    </div>
  );
}

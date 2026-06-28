import type { StdTestItem } from '@/types';

export default function ReadonlyAudit({ item }: { item: StdTestItem | null }) {
  const auto = '저장 시 자동 생성';
  return (
    <section className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          8. 등록 정보
        </h3>
        <p className="text-2xs text-secondary mt-1">
          {item ? '생성 이력 정보는 읽기 전용입니다.' : 'TMPLT_ID·생성일은 저장 시 서버에서 부여됩니다.'}
        </p>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReadonlyField column="TMPLT_ID" label="템플릿 ID (PK)" value={item ? String(item.id) : auto} />
        <ReadonlyField
          column="CREATED_AT"
          label="생성일 (YYYYMMDD)"
          value={item ? formatDate(item.createdAt) : auto}
        />
        <ReadonlyField column="CREATED_BY" label="생성자 사번" value={item ? item.createdBy || '–' : 'SYSTEM'} />
      </div>
    </section>
  );
}

function ReadonlyField({ column, label, value }: { column: string; label: string; value: string }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <label className="text-2xs font-bold text-secondary uppercase tracking-wider">
          {column}
        </label>
        <span className="text-2xs text-muted-foreground/70 truncate">{label}</span>
      </div>
      <p className="text-xs font-mono font-bold text-muted-foreground bg-muted/60 border border-border rounded-lg px-3 py-2">
        {value || '–'}
      </p>
    </div>
  );
}

function formatDate(raw: string): string {
  if (raw && /^\d{8}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  return raw || '–';
}

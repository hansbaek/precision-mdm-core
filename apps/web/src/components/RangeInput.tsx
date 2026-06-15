import { useEffect, useState } from 'react';
import { Eraser } from 'lucide-react';

/**
 * Range/threshold input for fields stored as comparison expressions
 * (RIM_INCH, GRV_DEPTH, LI, PLY_RATING). Two modes:
 *  - 단일(single):  operator + value   →  "<=14.5", ">=15", "<>17.5", "17.5"(=)
 *  - 범위(between): min ~ max          →  "14.5~17.5"
 * Values that parse as neither (legacy junk like "NO") stay editable as raw
 * "(기준 외)" text so existing rows are never silently dropped.
 */

export type RangeOp = '<=' | '>=' | '<' | '>' | '=' | '<>';

const OP_OPTIONS: { value: RangeOp; label: string }[] = [
  { value: '<=', label: '≤ 이하' },
  { value: '>=', label: '≥ 이상' },
  { value: '<', label: '< 미만' },
  { value: '>', label: '> 초과' },
  { value: '=', label: '= 같음' },
  { value: '<>', label: '≠ 아님' },
];

const NUM = '-?\\d+(?:\\.\\d+)?';
const SINGLE_RE = new RegExp(`^(<=|>=|<>|<|>|=)?\\s*(${NUM})$`);
const BETWEEN_RE = new RegExp(`^(${NUM})\\s*~\\s*(${NUM})$`);

type Ui = {
  mode: 'single' | 'between';
  op: RangeOp;
  a: string;
  b: string;
  /** Non-null when the raw value parses as neither single nor between. */
  legacy: string | null;
};

function deriveUi(value: string): Ui {
  const v = (value ?? '').trim();
  if (v === '') return { mode: 'single', op: '=', a: '', b: '', legacy: null };

  const bm = v.match(BETWEEN_RE);
  if (bm) return { mode: 'between', op: '=', a: bm[1], b: bm[2], legacy: null };

  const sm = v.match(SINGLE_RE);
  if (sm) return { mode: 'single', op: (sm[1] as RangeOp) || '=', a: sm[2], b: '', legacy: null };

  return { mode: 'single', op: '=', a: '', b: '', legacy: v };
}

function serializeUi(ui: Ui): string {
  if (ui.legacy !== null) return ui.legacy;
  if (ui.mode === 'between') {
    const x = ui.a.trim();
    const y = ui.b.trim();
    return x !== '' && y !== '' ? `${x}~${y}` : '';
  }
  const n = ui.a.trim();
  if (n === '') return '';
  return ui.op === '=' ? n : `${ui.op}${n}`;
}

const inputCls =
  'w-full border border-border rounded-lg px-3 py-2 text-xs focus:border-primary focus:ring-2 focus:ring-ring/30 outline-none text-foreground bg-card disabled:opacity-60 transition-all font-mono';

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Unit hint shown after the value, e.g. 'inch', 'mm', 'LI', 'PR'. */
  unit?: string;
  step?: string;
  id?: string;
}

export default function RangeInput({ value, onChange, disabled = false, unit, step = 'any', id }: Props) {
  const [ui, setUi] = useState<Ui>(() => deriveUi(value));

  // Resync when the parent value changes externally (e.g. switching items).
  // During local edits the parent echoes back our serialized string, so this
  // does not clobber in-progress input.
  useEffect(() => {
    if (value !== serializeUi(ui)) setUi(deriveUi(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const update = (next: Ui) => {
    setUi(next);
    onChange(serializeUi(next));
  };

  const onLegacyChange = (raw: string) => {
    const derived = deriveUi(raw);
    // Once the raw text becomes valid (or empty), drop back to structured mode.
    update(derived.legacy !== null ? { ...derived, legacy: raw } : derived);
  };

  if (ui.legacy !== null) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <input
            id={id}
            type="text"
            value={ui.legacy}
            disabled={disabled}
            onChange={(e) => onLegacyChange(e.target.value)}
            className={inputCls}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => update(deriveUi(''))}
            title="지우고 구조화 입력으로 전환"
            className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-60"
          >
            <Eraser className="h-3.5 w-3.5" />
          </button>
        </div>
        <span className="text-2xs font-bold text-warning">(기준 외) — 비교식/범위 형식이 아닙니다</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* mode toggle */}
      <div className="inline-flex rounded-md border border-border overflow-hidden text-2xs font-bold">
        {(['single', 'between'] as const).map((m) => (
          <button
            key={m}
            type="button"
            disabled={disabled}
            aria-pressed={ui.mode === m}
            onClick={() => ui.mode !== m && update({ ...ui, mode: m })}
            className={`px-2.5 py-1 transition-colors disabled:opacity-60 ${
              ui.mode === m
                ? 'bg-info text-white'
                : 'bg-card text-muted-foreground hover:bg-muted/60'
            }`}
          >
            {m === 'single' ? '단일' : '범위'}
          </button>
        ))}
      </div>

      {ui.mode === 'single' ? (
        <div className="flex items-center gap-1.5">
          <select
            value={ui.op}
            disabled={disabled}
            onChange={(e) => update({ ...ui, op: e.target.value as RangeOp })}
            className="shrink-0 w-24 border border-border rounded-lg px-2 py-2 text-xs bg-card text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
          >
            {OP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            id={id}
            type="number"
            inputMode="decimal"
            step={step}
            value={ui.a}
            disabled={disabled}
            onChange={(e) => update({ ...ui, a: e.target.value })}
            placeholder="값"
            className={inputCls}
          />
          {unit && <span className="shrink-0 text-2xs text-muted-foreground/70">{unit}</span>}
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            step={step}
            value={ui.a}
            disabled={disabled}
            onChange={(e) => update({ ...ui, a: e.target.value })}
            placeholder="최소"
            className={inputCls}
          />
          <span className="shrink-0 text-xs text-muted-foreground">~</span>
          <input
            type="number"
            inputMode="decimal"
            step={step}
            value={ui.b}
            disabled={disabled}
            onChange={(e) => update({ ...ui, b: e.target.value })}
            placeholder="최대"
            className={inputCls}
          />
          {unit && <span className="shrink-0 text-2xs text-muted-foreground/70">{unit}</span>}
        </div>
      )}
    </div>
  );
}

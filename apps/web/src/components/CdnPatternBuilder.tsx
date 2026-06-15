import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';

/**
 * Builds CDN_PATTERN — an explicit, column-named extension of the representative
 * TEST_CDN_NAME. Tokens {SS} / {RADIAL_BIAS} / {POR} mark where the row's column
 * values complete the actual condition name; anything else is a literal suffix.
 *
 *   base "LL09" + [{SS}, {RADIAL_BIAS}]  →  "LL09{SS}{RADIAL_BIAS}"
 *   base "LS09" + [{SS}, "B"]            →  "LS09{SS}B"
 *
 * Empty (no segments) serializes to "" — i.e. a plain representative, no pattern.
 */

const TOKEN_COLS = ['SS', 'RADIAL_BIAS', 'POR'] as const;
type TokenCol = (typeof TOKEN_COLS)[number];

type Seg =
  | { type: 'token'; col: TokenCol }
  | { type: 'literal'; text: string };

const SEG_RE = /\{(SS|RADIAL_BIAS|POR)\}|([^{]+)/g;

function parse(value: string, base: string): Seg[] {
  if (!value) return [];
  const rest = value.startsWith(base) ? value.slice(base.length) : value;
  const segs: Seg[] = [];
  let m: RegExpExecArray | null;
  SEG_RE.lastIndex = 0;
  while ((m = SEG_RE.exec(rest))) {
    if (m[1]) segs.push({ type: 'token', col: m[1] as TokenCol });
    else if (m[2]) segs.push({ type: 'literal', text: m[2] });
  }
  return segs;
}

function segText(s: Seg): string {
  return s.type === 'token' ? `{${s.col}}` : s.text;
}

function serialize(base: string, segs: Seg[]): string {
  return segs.length ? base + segs.map(segText).join('') : '';
}

function expand(
  base: string,
  segs: Seg[],
  vals: { ss?: string; radialBias?: string; por?: string },
): string[] {
  const usesSs = segs.some((s) => s.type === 'token' && s.col === 'SS');
  const ssTokens = (vals.ss ?? '')
    .split(/,\s*/)
    .map((t) => t.trim())
    .filter(Boolean);
  const sub = (s: Seg, ssVal: string): string => {
    if (s.type === 'literal') return s.text;
    if (s.col === 'SS') return ssVal || '∅';
    if (s.col === 'RADIAL_BIAS') return vals.radialBias || '∅';
    return vals.por || '∅';
  };
  const variants = usesSs ? (ssTokens.length ? ssTokens : ['∅']) : [''];
  return variants.map((ssVal) => base + segs.map((s) => sub(s, ssVal)).join(''));
}

interface Props {
  /** Representative condition (TEST_CDN_NAME). */
  base: string;
  /** CDN_PATTERN string. */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Row column values for the live expansion preview. */
  ss?: string;
  radialBias?: string;
  por?: string;
}

export default function CdnPatternBuilder({
  base,
  value,
  onChange,
  disabled = false,
  ss,
  radialBias,
  por,
}: Props) {
  const [segs, setSegs] = useState<Seg[]>(() => parse(value, base));
  const [literal, setLiteral] = useState('');

  // Resync when the parent value/base changes externally (item switch, or the
  // representative was reselected — both reset base+value together).
  useEffect(() => {
    if (value !== serialize(base, segs)) setSegs(parse(value, base));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, base]);

  const commit = (next: Seg[]) => {
    setSegs(next);
    onChange(serialize(base, next));
  };

  if (!base) {
    return (
      <p className="text-2xs text-muted-foreground/70 border border-dashed border-border rounded-lg px-3 py-2">
        대표 조건(TEST_CDN_NAME)을 먼저 선택하면 패턴을 구성할 수 있습니다.
      </p>
    );
  }

  const previews = expand(base, segs, { ss, radialBias, por });

  return (
    <div className="space-y-2">
      {/* composed pattern */}
      <div className="flex items-center gap-1 flex-wrap rounded-lg border border-border bg-muted/40 px-2.5 py-2 min-h-9">
        <span className="font-mono text-xs font-bold text-foreground">{base}</span>
        {segs.map((s, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-2xs font-bold border ${
              s.type === 'token'
                ? 'bg-info-container text-info border-info/20'
                : 'bg-card text-foreground border-border'
            }`}
          >
            {segText(s)}
            {!disabled && (
              <button
                type="button"
                aria-label="제거"
                onClick={() => commit(segs.filter((_, j) => j !== i))}
                className="opacity-60 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {segs.length === 0 && (
          <span className="text-2xs text-muted-foreground/70">패턴 없음 — 대표값만 사용</span>
        )}
      </div>

      {/* token + literal append controls */}
      {!disabled && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {TOKEN_COLS.map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => commit([...segs, { type: 'token', col }])}
              className="inline-flex items-center gap-0.5 rounded-md border border-info/40 bg-card px-2 py-1 text-2xs font-mono font-bold text-info hover:bg-info hover:text-white transition-colors"
            >
              <Plus className="h-3 w-3" />
              {col}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          <input
            type="text"
            value={literal}
            onChange={(e) => setLiteral(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && literal.trim()) {
                e.preventDefault();
                commit([...segs, { type: 'literal', text: literal.trim() }]);
                setLiteral('');
              }
            }}
            placeholder="리터럴 (예: A, B)"
            className="w-28 border border-border rounded-md px-2 py-1 text-2xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 bg-card"
          />
          <button
            type="button"
            disabled={!literal.trim()}
            onClick={() => {
              commit([...segs, { type: 'literal', text: literal.trim() }]);
              setLiteral('');
            }}
            className="rounded-md border border-border px-2 py-1 text-2xs font-bold text-muted-foreground hover:bg-muted/60 disabled:opacity-50"
          >
            추가
          </button>
        </div>
      )}

      {/* live expansion preview */}
      {segs.length > 0 && (
        <div className="text-2xs text-secondary">
          <span className="font-bold">전개 예시: </span>
          <span className="font-mono text-muted-foreground">
            {previews.slice(0, 6).join(', ')}
            {previews.length > 6 && ` … (+${previews.length - 6})`}
          </span>
          {previews.some((p) => p.includes('∅')) && (
            <span className="ml-1 text-warning font-bold">∅=해당 컬럼 값 없음</span>
          )}
        </div>
      )}
    </div>
  );
}

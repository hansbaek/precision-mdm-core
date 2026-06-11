/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const SEGMENTS = [
  { value: '', label: '미지정' },
  { value: 'Y', label: 'Y' },
  { value: 'N', label: 'N' },
] as const;

interface FlagToggleProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

/**
 * 3-state Y/N flag — blank (unspecified) is distinct from an explicit 'N'
 * in this dataset, so a checkbox would lose information.
 */
export default function FlagToggle({ value, onChange, disabled = false, id }: FlagToggleProps) {
  const isLegacy = value !== '' && value !== 'Y' && value !== 'N';

  return (
    <div className="flex items-center gap-2" id={id}>
      <div className="flex items-center h-9 rounded-lg border border-border overflow-hidden">
        {SEGMENTS.map((seg) => {
          const active = value === seg.value;
          return (
            <button
              key={seg.label}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onChange(seg.value)}
              className={`px-3 h-full text-2xs font-bold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                active
                  ? seg.value === 'Y'
                    ? 'bg-success text-white'
                    : seg.value === 'N'
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {seg.label}
            </button>
          );
        })}
      </div>
      {isLegacy && (
        <span className="text-2xs text-warning font-bold font-mono" title="Y/N 외 값 — 세그먼트 선택 시 대체됩니다">
          현재값: {value} (기준 외)
        </span>
      )}
    </div>
  );
}

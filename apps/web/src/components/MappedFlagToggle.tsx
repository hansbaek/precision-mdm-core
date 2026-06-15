/**
 * 2-state Y/N toggle that stores mapped values rather than literal 'Y'/'N'.
 * Used for POR, where the DB convention is 'S' (Y) / blank (N).
 */
interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Stored value for the Y state (e.g. 'S'). */
  onValue: string;
  /** Stored value for the N state (e.g. ''). */
  offValue: string;
  disabled?: boolean;
  id?: string;
}

export default function MappedFlagToggle({
  value,
  onChange,
  onValue,
  offValue,
  disabled = false,
  id,
}: Props) {
  const state = value === onValue ? 'Y' : value === offValue ? 'N' : 'legacy';

  const seg = (label: 'Y' | 'N', stored: string, activeCls: string) => {
    const active = state === label;
    return (
      <button
        type="button"
        aria-pressed={active}
        disabled={disabled}
        onClick={() => onChange(stored)}
        className={`px-3 h-full text-2xs font-bold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
          active ? activeCls : 'bg-card text-muted-foreground hover:bg-muted'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-2" id={id}>
      <div className="flex items-center h-9 rounded-lg border border-border overflow-hidden">
        {seg('Y', onValue, 'bg-success text-white')}
        {seg('N', offValue, 'bg-destructive text-destructive-foreground')}
      </div>
      {state === 'legacy' && value !== '' && (
        <span
          className="text-2xs text-warning font-bold font-mono"
          title="Y/N 외 값 — 세그먼트 선택 시 대체됩니다"
        >
          현재값: {value} (기준 외)
        </span>
      )}
    </div>
  );
}

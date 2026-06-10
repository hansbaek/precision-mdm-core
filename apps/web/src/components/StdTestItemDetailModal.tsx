import { X } from 'lucide-react';
import type { StdTestItem } from '../types';
import { ALL_MARKETS } from '../types';

/** 'YYYYMMDD' -> 'YYYY-MM-DD' for display. */
function fmtDate(raw: string): string {
  if (raw && /^\d{8}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  return raw || '–';
}

interface Props {
  isOpen: boolean;
  item: StdTestItem | null;
  onClose: () => void;
  onEdit: (item: StdTestItem) => void;
}

export default function StdTestItemDetailModal({ isOpen, item, onClose, onEdit }: Props) {
  if (!isOpen || !item) return null;

  const activeSet = new Set(item.markets);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl border border-border-subtle flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-primary/5">
          <div>
            <p className="text-[10px] text-secondary font-mono uppercase tracking-widest">상세 보기 / Detail View</p>
            <h2 className="text-base font-extrabold text-primary font-hanken mt-0.5">
              STD Test Item #{item.id}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">

          {/* Field Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="ID" value={String(item.id)} mono />
            <Field label="Product Line" value={item.productLine || '–'} />
            <Field label="Test Item" value={item.testItemName || '–'} />
            <Field label="Method" value={item.testMethod || '–'} mono />
            <Field label="Condition" value={item.testCondition || '–'} />
            <Field label="Created At" value={fmtDate(item.createdAt)} mono />
            <Field label="Created By" value={item.createdBy || '–'} mono />
          </div>

          {/* Market */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">
              Market ({item.markets.length} / {ALL_MARKETS.length} 적용)
            </label>
            <div className="border border-border-subtle rounded-sm bg-slate-50 p-4">
              <div className="flex flex-wrap gap-1.5">
                {ALL_MARKETS.map(code => {
                  const on = activeSet.has(code);
                  return (
                    <span
                      key={code}
                      className={`inline-block px-2 py-0.5 rounded-sm text-[11px] font-mono font-bold border ${
                        on
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-white text-slate-300 border-slate-100'
                      }`}
                    >
                      {code}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle flex justify-end gap-2 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-border-subtle rounded-sm hover:bg-slate-50 transition-colors cursor-pointer"
          >
            닫기
          </button>
          <button
            onClick={() => { onClose(); onEdit(item); }}
            className="px-5 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-sm transition-colors cursor-pointer"
          >
            수정 (Edit)
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">{label}</label>
      <p className={`text-sm font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

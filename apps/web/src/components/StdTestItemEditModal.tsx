import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { StdTestItem } from '../types';
import { ALL_MARKETS } from '../types';
import { updateStdTestItem } from '../api/template';

interface Props {
  isOpen: boolean;
  item: StdTestItem | null;
  onClose: () => void;
  onSaved: (updated: StdTestItem) => void;
}

export default function StdTestItemEditModal({ isOpen, item, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    productLine: '',
    testItemName: '',
    testMethod: '',
    testCondition: '',
  });
  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setForm({
        productLine: item.productLine,
        testItemName: item.testItemName,
        testMethod: item.testMethod,
        testCondition: item.testCondition,
      });
      setSelectedMarkets(new Set(item.markets));
      setError(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const toggleMarket = (code: string) => {
    setSelectedMarkets(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const marketsStr = ALL_MARKETS.filter(m => selectedMarkets.has(m)).join(',');
      const updated = await updateStdTestItem(item.id, { ...form, markets: marketsStr });
      onSaved(updated);
      onClose();
    } catch {
      setError('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl border border-border-subtle flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-primary/5">
          <div>
            <p className="text-[10px] text-secondary font-mono uppercase tracking-widest">수정 / Edit</p>
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

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-4 py-2.5 rounded-sm">
              {error}
            </div>
          )}

          {/* Field Grid */}
          <div className="grid grid-cols-2 gap-4">
            <EditField label="Product Line" value={form.productLine} onChange={v => setForm(f => ({ ...f, productLine: v }))} />
            <EditField label="Test Item" value={form.testItemName} onChange={v => setForm(f => ({ ...f, testItemName: v }))} />
            <EditField label="Method" value={form.testMethod} mono onChange={v => setForm(f => ({ ...f, testMethod: v }))} />
            <div className="col-span-2">
              <EditField label="Condition" value={form.testCondition} onChange={v => setForm(f => ({ ...f, testCondition: v }))} />
            </div>
          </div>

          {/* Market multi-select grid */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">
              Market ({selectedMarkets.size} 선택)
            </label>
            <div className="border border-border-subtle rounded-sm bg-slate-50 p-4">
              <div className="flex flex-wrap gap-1.5">
                {ALL_MARKETS.map(code => {
                  const on = selectedMarkets.has(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggleMarket(code)}
                      className={`px-2 py-0.5 rounded-sm text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                        on
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300 hover:text-blue-500'
                      }`}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-mono">클릭하여 시장 적용 여부를 토글합니다.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle flex justify-end gap-2 bg-slate-50">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-border-subtle rounded-sm hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? '저장 중...' : '저장 (Save)'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditField({
  label, value, onChange, mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full border border-border-subtle rounded-sm px-3 py-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none text-slate-800 bg-white ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}

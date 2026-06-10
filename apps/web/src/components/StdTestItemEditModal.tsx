import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { StdTestItem } from '../types';
import { ALL_MARKETS } from '../types';
import { updateStdTestItem } from '../api/template';

type FormState = {
  productLine: string;
  testItemName: string;
  testMethod: string;
  testCondition: string;
  endurSvrty: string;
  certiTtm: string;
  certiType: string;
  tempTire: string;
  snowMark: string;
  frt: string;
  utqg: string;
  por: string;
  radialBias: string;
  rimInch: string;
  grvDepth: string;
  ss: string;
  li: string;
  plyRating: string;
  tlIndicator: string;
  tbrPosition: string;
  tbrGrv3: string;
  tbrSegment: string;
  tbrItemCntPerBarcode: string;
  newSizeYn: string;
  sizeSmpl: string;
};

type EditFieldConfig = {
  key: keyof FormState;
  column: string;
  label: string;
  mono?: boolean;
  wide?: boolean;
};

type EditGroup = {
  title: string;
  description: string;
  fields: EditFieldConfig[];
};

const EMPTY_FORM: FormState = {
  productLine: '',
  testItemName: '',
  testMethod: '',
  testCondition: '',
  endurSvrty: '',
  certiTtm: '',
  certiType: '',
  tempTire: '',
  snowMark: '',
  frt: '',
  utqg: '',
  por: '',
  radialBias: '',
  rimInch: '',
  grvDepth: '',
  ss: '',
  li: '',
  plyRating: '',
  tlIndicator: '',
  tbrPosition: '',
  tbrGrv3: '',
  tbrSegment: '',
  tbrItemCntPerBarcode: '',
  newSizeYn: '',
  sizeSmpl: '',
};

const EDIT_GROUPS: EditGroup[] = [
  {
    title: '1. 기본 식별 정보',
    description: '제품 라인은 수정 가능하며, 템플릿 ID는 하단 읽기 전용 정보로 표시합니다.',
    fields: [
      { key: 'productLine', column: 'PRODUCT_LINE', label: '제품 라인 (PCR/LTR/TBR)', mono: true },
    ],
  },
  {
    title: '2. 시험 항목 정의',
    description: '시험 항목명, 방법, 조건, 내구 가혹도를 수정합니다.',
    fields: [
      { key: 'testItemName', column: 'TEST_ITEM_NAME', label: '시험 항목명', wide: true },
      { key: 'testMethod', column: 'TEST_MTH_NAME', label: '시험 방법명' },
      { key: 'testCondition', column: 'TEST_CDN_NAME', label: '시험 조건명' },
      { key: 'endurSvrty', column: 'ENDUR_SVRTY', label: '내구 가혹도', mono: true },
    ],
  },
  {
    title: '3. 인증 / 특수 시험 속성',
    description: '인증 및 특수 시험 속성 플래그를 수정합니다.',
    fields: [
      { key: 'certiTtm', column: 'CERTI_TTM', label: '인증 여부 (Y/N)', mono: true },
      { key: 'certiType', column: 'CERTI_TYPE', label: '인증 기관 / 유형' },
      { key: 'tempTire', column: 'TEMP_TIRE', label: '임시타이어 여부', mono: true },
      { key: 'snowMark', column: 'SNOW_MARK', label: '스노우 마크 여부', mono: true },
      { key: 'frt', column: 'FRT', label: 'Free Rolling Tire 여부', mono: true },
      { key: 'utqg', column: 'UTQG', label: 'UTQG 여부', mono: true },
      { key: 'por', column: 'POR', label: 'Professional Off Road Tire 여부', mono: true },
    ],
  },
  {
    title: '4. 타이어 구조 / 기본 스펙 조건',
    description: '구조, 림, 그루브, 속도/하중 조건을 수정합니다.',
    fields: [
      { key: 'radialBias', column: 'RADIAL_BIAS', label: '레이디얼/바이어스 구분' },
      { key: 'rimInch', column: 'RIM_INCH', label: '림 인치 조건', mono: true },
      { key: 'grvDepth', column: 'GRV_DEPTH', label: '그루브 깊이 조건', mono: true },
      { key: 'ss', column: 'SS', label: '속도 기호 목록', mono: true, wide: true },
      { key: 'li', column: 'LI', label: '하중 지수 조건', mono: true },
      { key: 'plyRating', column: 'PLY_RATING', label: '플라이 레이팅', mono: true },
      { key: 'tlIndicator', column: 'TL_INDICATOR', label: 'TL 지시자', mono: true },
    ],
  },
  {
    title: '5. TBR 전용 조건',
    description: 'TBR 포지션, 그루브, 세그먼트, 바코드당 항목 수 조건입니다.',
    fields: [
      { key: 'tbrPosition', column: 'TBR_POSITION', label: 'TBR 포지션' },
      { key: 'tbrGrv3', column: 'TBR_GRV_3', label: 'TBR 3번 그루브 여부' },
      { key: 'tbrSegment', column: 'TBR_SEGMENT', label: 'TBR 세그먼트' },
      {
        key: 'tbrItemCntPerBarcode',
        column: 'TBR_ITEM_CNT_PER_BARCODE',
        label: 'TBR 바코드당 시험 항목 수',
        mono: true,
      },
    ],
  },
  {
    title: '6. 사이즈 / 샘플 조건',
    description: '신규 사이즈 여부와 특정 사이즈 샘플 지정 조건입니다.',
    fields: [
      { key: 'newSizeYn', column: 'NEW_SIZE_YN', label: '신규 사이즈 여부', mono: true },
      { key: 'sizeSmpl', column: 'SIZE_SMPL', label: '특정 사이즈 샘플 지정', mono: true, wide: true },
    ],
  },
];

interface Props {
  isOpen: boolean;
  item: StdTestItem | null;
  onClose: () => void;
  onSaved: (updated: StdTestItem) => void;
}

export default function StdTestItemEditModal({ isOpen, item, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
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
        endurSvrty: item.endurSvrty,
        certiTtm: item.certiTtm,
        certiType: item.certiType,
        tempTire: item.tempTire,
        snowMark: item.snowMark,
        frt: item.frt,
        utqg: item.utqg,
        por: item.por,
        radialBias: item.radialBias,
        rimInch: item.rimInch,
        grvDepth: item.grvDepth,
        ss: item.ss,
        li: item.li,
        plyRating: item.plyRating,
        tlIndicator: item.tlIndicator,
        tbrPosition: item.tbrPosition,
        tbrGrv3: item.tbrGrv3,
        tbrSegment: item.tbrSegment,
        tbrItemCntPerBarcode: item.tbrItemCntPerBarcode,
        newSizeYn: item.newSizeYn,
        sizeSmpl: item.sizeSmpl,
      });
      setSelectedMarkets(new Set(item.markets));
      setError(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const toggleMarket = (code: string) => {
    setSelectedMarkets((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleFieldChange = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const marketsStr = ALL_MARKETS.filter((market) => selectedMarkets.has(market)).join(',');
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
      <div className="bg-white w-full max-w-6xl rounded-sm shadow-2xl border border-border-subtle flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-primary/5">
          <div>
            <p className="text-[10px] text-secondary font-mono uppercase tracking-widest">
              수정 / Edit · TEMPLATE_STD_TEST_ITEM
            </p>
            <h2 className="text-base font-extrabold text-primary font-hanken mt-0.5">
              STD Test Item #{item.id} · {item.productLine || '–'} · {item.testItemName || '–'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5 flex-1 bg-[#f7f9fb]">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-4 py-2.5 rounded-sm">
              {error}
            </div>
          )}

          {EDIT_GROUPS.map((group) => (
            <EditSection
              key={group.title}
              group={group}
              form={form}
              onChange={handleFieldChange}
              disabled={saving}
            />
          ))}

          <MarketEditSection selectedMarkets={selectedMarkets} onToggle={toggleMarket} disabled={saving} />

          <ReadonlyAudit item={item} />
        </div>

        <div className="px-6 py-4 border-t border-border-subtle flex justify-between gap-2 bg-slate-50">
          <p className="text-[10px] text-slate-400 font-mono self-center">
            읽기 전용: TMPLT_ID, CREATED_AT, CREATED_BY · 시장 컬럼은 토글 후 저장됩니다.
          </p>
          <div className="flex justify-end gap-2">
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
    </div>
  );
}

function EditSection({
  group,
  form,
  onChange,
  disabled,
}: {
  group: EditGroup;
  form: FormState;
  onChange: (key: keyof FormState, value: string) => void;
  disabled: boolean;
}) {
  return (
    <section className="bg-white border border-border-subtle rounded-sm shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-border-subtle bg-white">
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          {group.title}
        </h3>
        <p className="text-[10px] text-secondary mt-1">{group.description}</p>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {group.fields.map((field) => (
          <EditField
            key={field.key}
            field={field}
            value={form[field.key]}
            onChange={(value) => onChange(field.key, value)}
            disabled={disabled}
          />
        ))}
      </div>
    </section>
  );
}

function EditField({
  field,
  value,
  onChange,
  disabled,
}: {
  field: EditFieldConfig;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className={`space-y-1.5 min-w-0 ${field.wide ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">
          {field.column}
        </label>
        <span className="text-[9px] text-slate-400 truncate">{field.label}</span>
      </div>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full border border-border-subtle rounded-sm px-3 py-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none text-slate-800 bg-white disabled:opacity-60 ${field.mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}

function MarketEditSection({
  selectedMarkets,
  onToggle,
  disabled,
}: {
  selectedMarkets: Set<string>;
  onToggle: (code: string) => void;
  disabled: boolean;
}) {
  return (
    <section className="bg-white border border-border-subtle rounded-sm shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-border-subtle bg-white">
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          7. 시장 적용 정보
        </h3>
        <p className="text-[10px] text-secondary mt-1">
          38개 마켓 플래그 컬럼을 클릭하여 적용 여부를 토글합니다. 현재 {selectedMarkets.size}개
          선택
        </p>
      </div>
      <div className="p-5 border border-transparent">
        <div className="flex flex-wrap gap-1.5">
          {ALL_MARKETS.map((code) => {
            const on = selectedMarkets.has(code);
            return (
              <button
                key={code}
                type="button"
                disabled={disabled}
                onClick={() => onToggle(code)}
                className={`px-2 py-1 rounded-sm text-[11px] font-mono font-bold border transition-colors cursor-pointer disabled:opacity-60 ${
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
      </div>
    </section>
  );
}

function ReadonlyAudit({ item }: { item: StdTestItem }) {
  return (
    <section className="bg-white border border-border-subtle rounded-sm shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-border-subtle bg-white">
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          8. 등록 정보
        </h3>
        <p className="text-[10px] text-secondary mt-1">생성 이력 정보는 읽기 전용입니다.</p>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReadonlyField column="TMPLT_ID" label="템플릿 ID (PK)" value={String(item.id)} />
        <ReadonlyField column="CREATED_AT" label="생성일 (YYYYMMDD)" value={formatDate(item.createdAt)} />
        <ReadonlyField column="CREATED_BY" label="생성자 사번" value={item.createdBy || '–'} />
      </div>
    </section>
  );
}

function ReadonlyField({ column, label, value }: { column: string; label: string; value: string }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">
          {column}
        </label>
        <span className="text-[9px] text-slate-400 truncate">{label}</span>
      </div>
      <p className="text-xs font-mono font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-sm px-3 py-2">
        {value || '–'}
      </p>
    </div>
  );
}

function formatDate(raw: string): string {
  if (raw && /^\d{8}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  return raw || '–';
}

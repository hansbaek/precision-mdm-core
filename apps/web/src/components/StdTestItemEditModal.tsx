import { useState, useEffect } from 'react';
import { AlertTriangle, Check, Save, Wand2 } from 'lucide-react';

import FlagToggle from '@/components/FlagToggle';
import MultiCombobox from '@/components/MultiCombobox';
import SearchCombobox from '@/components/SearchCombobox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import {
  getTestClassificationConditions,
  getTestClassificationGroups,
  getTestClassificationItems,
  getTestClassificationMethods,
} from '../api/test-classification';
import { getRegulationCodes, suggestEndurSvrty, type SvrtySuggestResult } from '../api/endur-svrty';
import { useStdCodes } from '../hooks/use-std-codes';
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

type EditFieldType = 'text' | 'select' | 'flag' | 'multi';

type EditFieldConfig = {
  key: keyof FormState;
  column: string;
  label: string;
  mono?: boolean;
  wide?: boolean;
  /** Input widget — defaults to free text. */
  type?: EditFieldType;
  /** DW_STD_CODE group backing 'select'/'multi' option lists. */
  codeGrp?: string;
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
      {
        key: 'productLine',
        column: 'PRODUCT_LINE',
        label: '제품 라인 (PCR/LTR/TBR)',
        mono: true,
        type: 'select',
        codeGrp: 'PRODUCT_LINE',
      },
    ],
  },
  {
    title: '3. 특수 시험 속성',
    description: '특수 시험 속성 플래그를 수정합니다. (인증 정보는 7. 시장 적용 정보로 이동)',
    fields: [
      { key: 'tempTire', column: 'TEMP_TIRE', label: '임시타이어 여부', type: 'flag' },
      { key: 'snowMark', column: 'SNOW_MARK', label: '스노우 마크 여부', type: 'flag' },
      { key: 'frt', column: 'FRT', label: 'Free Rolling Tire 여부', type: 'flag' },
      { key: 'utqg', column: 'UTQG', label: 'UTQG 여부', type: 'flag' },
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
      {
        key: 'tlIndicator',
        column: 'TL_INDICATOR',
        label: 'TL 지시자',
        mono: true,
        type: 'select',
        codeGrp: 'TL_INDICATOR',
      },
    ],
  },
  {
    title: '5. TBR 전용 조건',
    description: 'TBR 포지션, 그루브, 세그먼트, 바코드당 항목 수 조건입니다.',
    fields: [
      {
        key: 'tbrPosition',
        column: 'TBR_POSITION',
        label: 'TBR 포지션 (A:All / D:Drive / T:Trailer)',
        type: 'multi',
        codeGrp: 'TBR_POSITION',
      },
      { key: 'tbrGrv3', column: 'TBR_GRV_3', label: 'TBR 3번 그루브 여부', type: 'flag' },
      {
        key: 'tbrSegment',
        column: 'TBR_SEGMENT',
        label: 'TBR 세그먼트',
        type: 'multi',
        codeGrp: 'TBR_SEGMENT',
      },
      {
        key: 'tbrItemCntPerBarcode',
        column: 'TBR_ITEM_CNT_PER_BARCODE',
        label: 'TBR 바코드당 시험 항목 수',
        mono: true,
        type: 'select',
        codeGrp: 'TBR_ITEM_CNT_PER_BARCODE',
      },
    ],
  },
  {
    title: '6. 사이즈 / 샘플 조건',
    description: '신규 사이즈 여부와 특정 사이즈 샘플 지정 조건입니다.',
    fields: [
      { key: 'newSizeYn', column: 'NEW_SIZE_YN', label: '신규 사이즈 여부', type: 'flag' },
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
  // Regulation codes back the CERTI_TYPE multi-combo (DW_REGULATION_MARKET_MAP)
  const [regulationOptions, setRegulationOptions] = useState<string[]>([]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const data = await getRegulationCodes();
        if (!ignore) setRegulationOptions(data);
      } catch {
        /* 콤보 옵션만 비워둠 — 폼은 계속 사용 가능 */
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  // DW_STD_CODE-backed option lists (fetched once; modal stays mounted in App)
  const { data: productLineCodes } = useStdCodes('PRODUCT_LINE', 2);
  const { data: endurSvrtyCodes } = useStdCodes('ENDUR_SVRTY');
  const { data: tlIndicatorCodes } = useStdCodes('TL_INDICATOR');
  const { data: tbrItemCntCodes } = useStdCodes('TBR_ITEM_CNT_PER_BARCODE');
  const { data: tbrPositionCodes } = useStdCodes('TBR_POSITION');
  const { data: tbrSegmentCodes } = useStdCodes('TBR_SEGMENT');

  const optionsByColumn: Record<string, string[]> = {
    // 'ALL' is a filter-only umbrella code — not a valid stored value
    PRODUCT_LINE: productLineCodes.map((c) => c.codeCd).filter((cd) => cd !== 'ALL'),
    ENDUR_SVRTY: endurSvrtyCodes.map((c) => c.codeCd),
    TL_INDICATOR: tlIndicatorCodes.map((c) => c.codeCd),
    TBR_ITEM_CNT_PER_BARCODE: tbrItemCntCodes.map((c) => c.codeCd),
    TBR_POSITION: tbrPositionCodes.map((c) => c.codeCd),
    TBR_SEGMENT: tbrSegmentCodes.map((c) => c.codeCd),
  };

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

  if (!item) return null;

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
      // Closing (and where to return) is the parent's job — onClose here would
      // route the success path through the cancel handler.
      onSaved(updated);
    } catch {
      setError('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Block closing (Escape / overlay click / X) while a save is in flight
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent className="max-w-6xl sm:max-w-6xl p-0 gap-0 max-h-[92vh] flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border bg-primary/5 gap-0.5 shrink-0">
          <DialogDescription className="text-2xs text-secondary font-mono uppercase tracking-widest">
            수정 / Edit · TEMPLATE_STD_TEST_ITEM
          </DialogDescription>
          <DialogTitle className="text-base font-extrabold text-primary font-hanken">
            STD Test Item #{item.id} · {item.productLine || '–'} · {item.testItemName || '–'}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto p-6 space-y-5 flex-1 bg-background">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          {/* Section 1 (기본 식별 정보) */}
          <EditSection
            group={EDIT_GROUPS[0]}
            form={form}
            onChange={handleFieldChange}
            disabled={saving}
            optionsByColumn={optionsByColumn}
          />

          {/* Section 2 (시험 항목 정의) — 기준 테이블 기반 계단식 콤보 */}
          <TestItemDefinitionSection
            form={form}
            onChange={handleFieldChange}
            disabled={saving}
          />

          {/* Sections 3+ */}
          {EDIT_GROUPS.slice(1).map((group) => (
            <EditSection
              key={group.title}
              group={group}
              form={form}
              onChange={handleFieldChange}
              disabled={saving}
              optionsByColumn={optionsByColumn}
            />
          ))}

          <MarketEditSection
            selectedMarkets={selectedMarkets}
            onToggle={toggleMarket}
            disabled={saving}
            endurSvrty={form.endurSvrty}
            onEndurSvrtyChange={(v) => handleFieldChange('endurSvrty', v)}
            endurSvrtyOptions={optionsByColumn.ENDUR_SVRTY}
            certiTtm={form.certiTtm}
            onCertiTtmChange={(v) => handleFieldChange('certiTtm', v)}
            certiType={form.certiType}
            onCertiTypeChange={(v) => handleFieldChange('certiType', v)}
            regulationOptions={regulationOptions}
            productLine={form.productLine}
            testMethod={form.testMethod}
            ss={form.ss}
          />

          <ReadonlyAudit item={item} />
        </div>

        <DialogFooter className="px-6 py-4 mx-0 mb-0 border-t border-border sm:justify-between gap-2 bg-muted/50 shrink-0 rounded-b-xl">
          <p className="text-2xs text-muted-foreground font-mono self-center">
            읽기 전용: TMPLT_ID, CREATED_AT, CREATED_BY · 시장 컬럼은 토글 후 저장됩니다.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving} className="text-xs font-bold">
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="text-xs font-bold bg-accent hover:bg-accent-hover text-white px-5"
            >
              {saving ? <Spinner className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? '저장 중...' : '저장 (Save)'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Section 2: cascading combos backed by DW_HNT_CLASSIFICATION (mode 'Indoor').
 * 그룹(화면 필터용, 저장 안 함) → 항목 → 방법 → 조건. List-only selection;
 * legacy values outside the reference list stay selectable as "(기준 외)".
 */
function TestItemDefinitionSection({
  form,
  onChange,
  disabled,
}: {
  form: FormState;
  onChange: (key: keyof FormState, value: string) => void;
  disabled: boolean;
}) {
  const [group, setGroup] = useState('');
  const [groups, setGroups] = useState<string[]>([]);
  const [items, setItems] = useState<string[]>([]);
  const [methods, setMethods] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [conditionsLoading, setConditionsLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const data = await getTestClassificationGroups();
        if (!ignore) setGroups(data);
      } catch {
        /* 콤보 목록만 비워둠 — 폼 자체는 계속 사용 가능 */
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setItemsLoading(true);
      try {
        const data = await getTestClassificationItems(group || undefined);
        if (!ignore) setItems(data);
      } catch {
        /* keep previous list */
      } finally {
        if (!ignore) setItemsLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [group]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!form.testItemName) {
        setMethods([]);
        return;
      }
      setMethodsLoading(true);
      try {
        const data = await getTestClassificationMethods(form.testItemName);
        if (!ignore) setMethods(data);
      } catch {
        /* keep previous list */
      } finally {
        if (!ignore) setMethodsLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [form.testItemName]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!form.testItemName || !form.testMethod) {
        setConditions([]);
        return;
      }
      setConditionsLoading(true);
      try {
        const data = await getTestClassificationConditions(form.testItemName, form.testMethod);
        if (!ignore) setConditions(data);
      } catch {
        /* keep previous list */
      } finally {
        if (!ignore) setConditionsLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [form.testItemName, form.testMethod]);

  const handleItemChange = (value: string) => {
    onChange('testItemName', value);
    onChange('testMethod', '');
    onChange('testCondition', '');
  };

  const handleMethodChange = (value: string) => {
    onChange('testMethod', value);
    onChange('testCondition', '');
  };

  return (
    <section className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          2. 시험 항목 정의
        </h3>
        <p className="text-2xs text-secondary mt-1">
          기준 분류(DW_HNT_CLASSIFICATION · Indoor)에서 선택합니다. 그룹 → 항목 → 방법 → 조건
          순서로 목록이 좁혀집니다.
        </p>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 시험 그룹 — 화면 필터용 */}
        <ComboField column="TEST_GROUP_NAME" label="시험 그룹 (필터용 — 저장 안 됨)">
          <SearchCombobox
            id="edit-combo-group"
            value={group}
            onChange={setGroup}
            options={groups}
            placeholder="전체 그룹"
            disabled={disabled}
            allowClear
          />
        </ComboField>

        {/* 시험 항목명 */}
        <div className="md:col-span-2 min-w-0">
          <ComboField column="TEST_ITEM_NAME" label="시험 항목명">
            <SearchCombobox
              id="edit-combo-item"
              value={form.testItemName}
              onChange={handleItemChange}
              options={items}
              placeholder="시험 항목 선택"
              disabled={disabled}
              loading={itemsLoading}
              allowClear
            />
          </ComboField>
        </div>

        {/* 시험 방법명 */}
        <ComboField column="TEST_MTH_NAME" label="시험 방법명">
          <SearchCombobox
            id="edit-combo-method"
            value={form.testMethod}
            onChange={handleMethodChange}
            options={methods}
            placeholder={form.testItemName ? '시험 방법 선택' : '항목을 먼저 선택'}
            disabled={disabled || !form.testItemName}
            loading={methodsLoading}
            allowClear
          />
        </ComboField>

        {/* 시험 조건명 */}
        <div className="md:col-span-2 min-w-0">
          <ComboField column="TEST_CDN_NAME" label="시험 조건명">
            <SearchCombobox
              id="edit-combo-condition"
              value={form.testCondition}
              onChange={(v) => onChange('testCondition', v)}
              options={conditions}
              placeholder={
                form.testItemName && form.testMethod ? '시험 조건 선택' : '방법을 먼저 선택'
              }
              disabled={disabled || !form.testItemName || !form.testMethod}
              loading={conditionsLoading}
              allowClear
              mono
            />
          </ComboField>
        </div>

      </div>
    </section>
  );
}

function ComboField({
  column,
  label,
  children,
}: {
  column: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <label className="text-2xs font-bold text-secondary uppercase tracking-wider">
          {column}
        </label>
        <span className="text-2xs text-muted-foreground/70 truncate">{label}</span>
      </div>
      {children}
    </div>
  );
}

function EditSection({
  group,
  form,
  onChange,
  disabled,
  optionsByColumn,
}: {
  group: EditGroup;
  form: FormState;
  onChange: (key: keyof FormState, value: string) => void;
  disabled: boolean;
  optionsByColumn: Record<string, string[]>;
}) {
  return (
    <section className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          {group.title}
        </h3>
        <p className="text-2xs text-secondary mt-1">{group.description}</p>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {group.fields.map((field) => (
          <EditField
            key={field.key}
            field={field}
            value={form[field.key]}
            onChange={(value) => onChange(field.key, value)}
            disabled={disabled}
            options={field.codeGrp ? (optionsByColumn[field.codeGrp] ?? []) : []}
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
  options = [],
}: {
  field: EditFieldConfig;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  options?: string[];
}) {
  const fieldId = `edit-field-${field.key}`;

  let control: React.ReactNode;
  switch (field.type) {
    case 'select':
      control = (
        <SearchCombobox
          id={fieldId}
          value={value}
          onChange={onChange}
          options={options}
          placeholder="선택..."
          disabled={disabled}
          allowClear
          mono={field.mono}
        />
      );
      break;
    case 'flag':
      control = <FlagToggle id={fieldId} value={value} onChange={onChange} disabled={disabled} />;
      break;
    case 'multi':
      control = (
        <MultiCombobox
          id={fieldId}
          value={value}
          onChange={onChange}
          options={options}
          placeholder="선택..."
          disabled={disabled}
        />
      );
      break;
    default:
      control = (
        <input
          id={fieldId}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full border border-border rounded-lg px-3 py-2 text-xs focus:border-primary focus:ring-2 focus:ring-ring/30 outline-none text-foreground bg-card disabled:opacity-60 transition-all ${field.mono ? 'font-mono' : ''}`}
        />
      );
  }

  return (
    <div className={`space-y-1.5 min-w-0 ${field.wide ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={fieldId} className="text-2xs font-bold text-secondary uppercase tracking-wider">
          {field.column}
        </label>
        <span className="text-2xs text-muted-foreground/70 truncate">{field.label}</span>
      </div>
      {control}
    </div>
  );
}

function MarketEditSection({
  selectedMarkets,
  onToggle,
  disabled,
  endurSvrty,
  onEndurSvrtyChange,
  endurSvrtyOptions,
  certiTtm,
  onCertiTtmChange,
  certiType,
  onCertiTypeChange,
  regulationOptions,
  productLine,
  testMethod,
  ss,
}: {
  selectedMarkets: Set<string>;
  onToggle: (code: string) => void;
  disabled: boolean;
  endurSvrty: string;
  onEndurSvrtyChange: (value: string) => void;
  endurSvrtyOptions: string[];
  certiTtm: string;
  onCertiTtmChange: (value: string) => void;
  certiType: string;
  onCertiTypeChange: (value: string) => void;
  regulationOptions: string[];
  productLine: string;
  testMethod: string;
  ss: string;
}) {
  const [suggestion, setSuggestion] = useState<SvrtySuggestResult | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const marketsStr = ALL_MARKETS.filter((m) => selectedMarkets.has(m)).join(',');

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!productLine || !marketsStr) {
        setSuggestion(null);
        return;
      }
      setSuggestLoading(true);
      try {
        const result = await suggestEndurSvrty({
          productLine,
          markets: marketsStr,
          testMethod: testMethod || undefined,
          ss: ss || undefined,
        });
        if (!ignore) setSuggestion(result);
      } catch {
        if (!ignore) setSuggestion(null);
      } finally {
        if (!ignore) setSuggestLoading(false);
      }
    };
    // Debounce: market toggles come in bursts
    const timer = setTimeout(() => void load(), 300);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [productLine, marketsStr, testMethod, ss]);

  const reasonText: Record<string, string> = {
    UNSUPPORTED_METHOD: '지원되지 않는 시험 방법 — 고속내구(High Speed)/일반내구(Load Up)만 제안 가능',
    NO_APPLICABLE_REGULATION: '선택한 시장에 적용 가능한 법규 순위가 없습니다',
    NO_MARKETS: '시장을 선택하면 가혹도가 제안됩니다',
  };

  return (
    <section className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          7. 시장 적용 정보
        </h3>
        <p className="text-2xs text-secondary mt-1">
          38개 마켓 플래그 컬럼을 클릭하여 적용 여부를 토글합니다. 현재 {selectedMarkets.size}개
          선택
        </p>
      </div>

      {/* 법규/인증 (시장 도출) — 인증여부·인증유형·가혹도는 타겟 시장의 법규에서 도출 */}
      <div className="px-5 py-4 border-b border-border grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label className="text-2xs font-bold text-secondary uppercase tracking-wider">
              CERTI_TTM
            </label>
            <span className="text-2xs text-muted-foreground/70 truncate">인증 여부 (Y/N)</span>
          </div>
          <FlagToggle
            id="edit-flag-certi-ttm"
            value={certiTtm}
            onChange={onCertiTtmChange}
            disabled={disabled}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label className="text-2xs font-bold text-secondary uppercase tracking-wider">
              CERTI_TYPE
            </label>
            <span className="text-2xs text-muted-foreground/70 truncate">인증 기관 / 유형</span>
          </div>
          <MultiCombobox
            id="edit-combo-certi-type"
            value={certiType}
            onChange={onCertiTypeChange}
            options={regulationOptions}
            separator=","
            placeholder="인증 유형 선택"
            disabled={disabled}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label className="text-2xs font-bold text-secondary uppercase tracking-wider">
              ENDUR_SVRTY
            </label>
            <span className="text-2xs text-muted-foreground/70 truncate">내구 가혹도 (1~4)</span>
          </div>
          <SearchCombobox
            id="edit-combo-endur-svrty"
            value={endurSvrty}
            onChange={onEndurSvrtyChange}
            options={endurSvrtyOptions}
            placeholder="가혹도 선택"
            disabled={disabled}
            allowClear
            mono
          />
        </div>
      </div>

      {/* 가혹도 자동 제안 — 시장·방법·SS 변경 시 갱신, 적용은 항상 수동 */}
      <div className="px-5 py-2.5 border-b border-border bg-muted/30 flex items-center gap-2.5 flex-wrap min-h-11">
        {suggestLoading ? (
          <span className="flex items-center gap-1.5 text-2xs font-bold text-muted-foreground">
            <Spinner className="h-3 w-3" />
            가혹도 제안 계산 중...
          </span>
        ) : suggestion?.suggested ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-2xs font-bold bg-info-container text-info border border-info/20 rounded-md px-2 py-1">
              <Wand2 className="h-3 w-3" />
              제안: {suggestion.suggested} — {suggestion.basis?.testCdnName} (
              {suggestion.basis?.regulationCode} · {suggestion.basis?.marketCode})
              {suggestion.speedGradeAssumed && ' · 속도등급 R이하 가정'}
            </span>
            {endurSvrty === suggestion.suggested ? (
              <span className="inline-flex items-center gap-1 text-2xs font-bold text-success">
                <Check className="h-3.5 w-3.5" />
                현재값 일치
              </span>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={disabled}
                onClick={() => onEndurSvrtyChange(suggestion.suggested!)}
                className="text-2xs font-bold h-6"
              >
                제안 적용
              </Button>
            )}
          </>
        ) : suggestion?.reason ? (
          <span className="text-2xs font-medium text-muted-foreground">
            {reasonText[suggestion.reason] ?? suggestion.reason}
          </span>
        ) : (
          <span className="text-2xs font-medium text-muted-foreground/70">
            시장을 선택하면 법규 기반 가혹도가 제안됩니다
          </span>
        )}

        {suggestion && suggestion.mandatory.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-2xs font-bold bg-warning-container text-warning border border-warning/30 rounded-md px-2 py-1">
            <AlertTriangle className="h-3 w-3" />
            US 포함 — {suggestion.mandatory.map((m) => m.testCdnName).join('/')} 필수 시험
          </span>
        )}
        {suggestion && suggestion.unmappedMarkets.length > 0 && (
          <span className="text-2xs text-muted-foreground/70">
            법규 매핑 없는 시장: {suggestion.unmappedMarkets.join(', ')} (제안에서 제외)
          </span>
        )}
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-1.5">
          {ALL_MARKETS.map((code) => {
            const on = selectedMarkets.has(code);
            return (
              <button
                key={code}
                type="button"
                disabled={disabled}
                aria-pressed={on}
                onClick={() => onToggle(code)}
                className={`px-2 py-1 rounded-md text-2xs font-mono font-bold border transition-colors cursor-pointer disabled:opacity-60 ${
                  on
                    ? 'bg-info text-white border-info'
                    : 'bg-card text-muted-foreground/60 border-border hover:border-info/50 hover:text-info'
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
    <section className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          8. 등록 정보
        </h3>
        <p className="text-2xs text-secondary mt-1">생성 이력 정보는 읽기 전용입니다.</p>
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

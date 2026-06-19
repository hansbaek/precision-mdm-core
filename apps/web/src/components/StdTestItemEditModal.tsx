import { useState, useEffect } from 'react';
import { AlertTriangle, Check, Lock, Plus, Save, Wand2 } from 'lucide-react';

import FlagToggle from '@/components/FlagToggle';
import MappedFlagToggle from '@/components/MappedFlagToggle';
import CdnPatternBuilder from '@/components/CdnPatternBuilder';
import MultiCombobox from '@/components/MultiCombobox';
import RangeInput from '@/components/RangeInput';
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
import {
  getRegulationCodes,
  suggestCertiType,
  suggestEndurSvrty,
  type CertiTypeSuggestResult,
  type SvrtySuggestResult,
} from '../api/endur-svrty';
import { useStdCodes } from '../hooks/use-std-codes';
import type { StdTestItem } from '../types';
import { ALL_MARKETS } from '../types';
import { createStdTestItem, updateStdTestItem } from '../api/template';

type FormState = {
  productLine: string;
  testItemName: string;
  testMethod: string;
  testCondition: string;
  cdnPattern: string;
  endurSvrty: string;
  certiTestYn: string;
  certiType: string;
  certiRegulationType: string;
  certiTypeId: string;
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

type EditFieldType = 'text' | 'select' | 'flag' | 'multi' | 'range';

type EditFieldConfig = {
  key: keyof FormState;
  column: string;
  label: string;
  mono?: boolean;
  wide?: boolean;
  /** Span the full grid row (all 4 columns on xl). */
  full?: boolean;
  /** Input widget — defaults to free text. */
  type?: EditFieldType;
  /** DW_STD_CODE group backing 'select'/'multi' option lists. */
  codeGrp?: string;
  /** 'multi' token separator — defaults to ', '. */
  separator?: string;
  /** 'multi' option highlighted by default when the list opens. */
  defaultHighlight?: string;
  /** 'range' unit hint shown after the value (e.g. 'inch', 'mm', 'LI', 'PR'). */
  unit?: string;
  /** 'flag' value mapping — Y stores flagOn, N stores flagOff (e.g. POR: 'S'/''). */
  flagOn?: string;
  flagOff?: string;
};

type EditGroup = {
  title: string;
  description: string;
  fields: EditFieldConfig[];
  /** Section is editable only when PRODUCT_LINE equals this value (e.g. 'TBR'). */
  requiresProductLine?: string;
};

const EMPTY_FORM: FormState = {
  productLine: '',
  testItemName: '',
  testMethod: '',
  testCondition: '',
  cdnPattern: '',
  endurSvrty: '',
  certiTestYn: '',
  certiType: '',
  certiRegulationType: '',
  certiTypeId: '',
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
    title: '3-1. 인증 상세 (코드/구분)',
    description:
      'CERTI_TYPE_ID는 인증 유형 고유번호(코드), CERTI_REGULATION_TYPE은 인증/법규/내부 시험 구분입니다.',
    fields: [
      {
        key: 'certiRegulationType',
        column: 'CERTI_REGULATION_TYPE',
        label: '인증/법규/내부 구분',
      },
      {
        key: 'certiTypeId',
        column: 'CERTI_TYPE_ID',
        label: '인증 유형 고유번호',
        mono: true,
      },
    ],
  },
  {
    title: '4. 특수 시험 속성',
    description: '특수 시험 속성 플래그를 수정합니다. (인증 정보는 3. 시장 적용 정보로 이동)',
    fields: [
      { key: 'tempTire', column: 'TEMP_TIRE', label: '스페어(임시)타이어 여부', type: 'flag' },
      { key: 'snowMark', column: 'SNOW_MARK', label: '스노우 마크 여부', type: 'flag' },
      { key: 'frt', column: 'FRT', label: 'Free Rolling Tire 여부', type: 'flag' },
      { key: 'utqg', column: 'UTQG', label: 'UTQG 여부', type: 'flag' },
      {
        key: 'por',
        column: 'POR',
        label: 'Professional Off Road Tire (Y→S / N→공백)',
        type: 'flag',
        flagOn: 'S',
        flagOff: '',
      },
    ],
  },
  {
    title: '5. 타이어 구조 / 기본 스펙 조건',
    description: '1줄: 속도 기호 / 2줄: 림·그루브·하중·플라이 범위 / 3줄: 구조·TL 구분.',
    fields: [
      // 1줄 — 속도 기호 (전체 폭, 다중 선택)
      {
        key: 'ss',
        column: 'SS',
        label: '속도 기호 (다중 선택 · 콤마 구분)',
        type: 'multi',
        codeGrp: 'SPEED_SYMBOL',
        separator: ',',
        defaultHighlight: 'T',
        full: true,
      },
      // 2줄 — 범위 입력 항목 4개
      { key: 'rimInch', column: 'RIM_INCH', label: '림 인치 조건', type: 'range', unit: 'inch' },
      { key: 'grvDepth', column: 'GRV_DEPTH', label: '그루브 깊이 조건', type: 'range', unit: 'mm' },
      { key: 'li', column: 'LI', label: '하중 지수 조건', type: 'range', unit: 'LI' },
      { key: 'plyRating', column: 'PLY_RATING', label: '플라이 레이팅', type: 'range', unit: 'PR' },
      // 3줄 — 구조 / TL 구분
      {
        key: 'radialBias',
        column: 'RADIAL_BIAS',
        label: '레이디얼/바이어스 (R/B · 미지정 가능)',
        mono: true,
        type: 'select',
        codeGrp: 'RADIAL_BIAS',
      },
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
    title: '6. TBR 전용 조건',
    description: 'TBR 포지션, 그루브, 세그먼트, 바코드당 항목 수 조건입니다.',
    requiresProductLine: 'TBR',
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
    title: '7. 사이즈 / 샘플 조건',
    description: '신규 사이즈 여부와 특정 사이즈 샘플 지정 조건입니다.',
    fields: [
      { key: 'newSizeYn', column: 'NEW_SIZE_YN', label: '신규 사이즈 여부', type: 'flag' },
      { key: 'sizeSmpl', column: 'SIZE_SMPL', label: '특정 사이즈 샘플 지정', mono: true, wide: true },
    ],
  },
];

interface Props {
  isOpen: boolean;
  /** Existing record (edit mode); null when creating. */
  item: StdTestItem | null;
  /** 'edit' (default) updates `item`; 'create' inserts a new record. */
  mode?: 'create' | 'edit';
  onClose: () => void;
  /** Create-and-close, or edit save. Parent closes the modal. */
  onSaved: (saved: StdTestItem) => void;
  /** Create-and-continue: parent adds to the list but keeps the modal open. */
  onCreatedContinue?: (saved: StdTestItem) => void;
  /** 승인 워크플로: 즉시 반영 대신 승인 대기로 제출됨(비승인권자). */
  onPending: (crId: number) => void;
}

export default function StdTestItemEditModal({
  isOpen,
  item,
  mode = 'edit',
  onClose,
  onSaved,
  onCreatedContinue,
  onPending,
}: Props) {
  const isCreate = mode === 'create';
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  // Inline confirmation for the just-created record (create-and-continue flow).
  const [lastCreatedId, setLastCreatedId] = useState<number | null>(null);
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
  const { data: radialBiasCodes } = useStdCodes('RADIAL_BIAS');
  const { data: speedSymbolCodes } = useStdCodes('SPEED_SYMBOL');
  const { data: tlIndicatorCodes } = useStdCodes('TL_INDICATOR');
  const { data: tbrItemCntCodes } = useStdCodes('TBR_ITEM_CNT_PER_BARCODE');
  const { data: tbrPositionCodes } = useStdCodes('TBR_POSITION');
  const { data: tbrSegmentCodes } = useStdCodes('TBR_SEGMENT');

  const optionsByColumn: Record<string, string[]> = {
    // 'ALL' is a filter-only umbrella code — not a valid stored value
    PRODUCT_LINE: productLineCodes.map((c) => c.codeCd).filter((cd) => cd !== 'ALL'),
    ENDUR_SVRTY: endurSvrtyCodes.map((c) => c.codeCd),
    RADIAL_BIAS: radialBiasCodes.map((c) => c.codeCd),
    SPEED_SYMBOL: speedSymbolCodes.map((c) => c.codeCd),
    TL_INDICATOR: tlIndicatorCodes.map((c) => c.codeCd),
    TBR_ITEM_CNT_PER_BARCODE: tbrItemCntCodes.map((c) => c.codeCd),
    TBR_POSITION: tbrPositionCodes.map((c) => c.codeCd),
    TBR_SEGMENT: tbrSegmentCodes.map((c) => c.codeCd),
  };

  useEffect(() => {
    if (!isOpen) return;
    if (isCreate) {
      setForm(EMPTY_FORM);
      setSelectedMarkets(new Set());
      setError(null);
      setLastCreatedId(null);
      return;
    }
    if (item) {
      setForm({
        productLine: item.productLine,
        testItemName: item.testItemName,
        testMethod: item.testMethod,
        testCondition: item.testCondition,
        cdnPattern: item.cdnPattern,
        endurSvrty: item.endurSvrty,
        certiTestYn: item.certiTestYn,
        certiType: item.certiType,
        certiRegulationType: item.certiRegulationType,
        certiTypeId: item.certiTypeId,
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
  }, [item, isOpen, isCreate]);

  if (!isCreate && !item) return null;

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

  const handleSave = async (keepOpen = false) => {
    setSaving(true);
    setError(null);
    try {
      const marketsStr = ALL_MARKETS.filter((market) => selectedMarkets.has(market)).join(',');
      const payload = { ...form, markets: marketsStr };

      if (isCreate || !item) {
        const res = await createStdTestItem(payload);
        // 비승인권자: 승인 대기로 등록됨 — 목록에 추가하지 않고 알림만.
        if (!res.applied) {
          onPending(res.crId);
          return;
        }
        const created = res.result;
        if (keepOpen) {
          // Create-and-continue: keep PRODUCT_LINE (consecutive items usually
          // share it), reset the rest, and surface an inline confirmation.
          onCreatedContinue?.(created);
          setForm({ ...EMPTY_FORM, productLine: form.productLine });
          setSelectedMarkets(new Set());
          setLastCreatedId(created.id);
        } else {
          onSaved(created);
        }
        return;
      }

      // Edit save — parent closes and routes back.
      const res = await updateStdTestItem(item.id, payload);
      if (!res.applied) {
        onPending(res.crId);
        return;
      }
      onSaved(res.result);
    } catch {
      setError(
        isCreate
          ? '생성 중 오류가 발생했습니다. 필수 항목(제품 라인·시험 항목명)을 확인하세요.'
          : '저장 중 오류가 발생했습니다. 다시 시도해주세요.',
      );
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
            {isCreate ? '신규 / Create' : '수정 / Edit'} · TEMPLATE_STD_TEST_ITEM
          </DialogDescription>
          <DialogTitle className="text-base font-extrabold text-primary font-hanken">
            {isCreate
              ? `STD Test Item · 신규 추가 · ${form.productLine || '–'} · ${form.testItemName || '–'}`
              : `STD Test Item #${item?.id} · ${item?.productLine || '–'} · ${item?.testItemName || '–'}`}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto p-6 space-y-5 flex-1 bg-background">
          {isCreate && lastCreatedId !== null && (
            <div className="bg-success-container border border-success/30 text-success text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              STD Item #{lastCreatedId} 생성 완료 — 이어서 입력하세요. (PRODUCT_LINE은 유지됩니다)
            </div>
          )}
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

          {/* Section 3 (시장 적용 정보) */}
          <MarketEditSection
            selectedMarkets={selectedMarkets}
            onToggle={toggleMarket}
            disabled={saving}
            endurSvrty={form.endurSvrty}
            onEndurSvrtyChange={(v) => handleFieldChange('endurSvrty', v)}
            endurSvrtyOptions={optionsByColumn.ENDUR_SVRTY}
            certiTestYn={form.certiTestYn}
            onCertiTestYnChange={(v) => handleFieldChange('certiTestYn', v)}
            certiType={form.certiType}
            onCertiTypeChange={(v) => handleFieldChange('certiType', v)}
            regulationOptions={regulationOptions}
            productLine={form.productLine}
            testMethod={form.testMethod}
            ss={form.ss}
          />

          {/* Sections 4+ */}
          {EDIT_GROUPS.slice(1).map((group) => {
            const locked =
              group.requiresProductLine !== undefined &&
              form.productLine !== group.requiresProductLine;
            return (
              <EditSection
                key={group.title}
                group={group}
                form={form}
                onChange={handleFieldChange}
                disabled={saving || locked}
                lockedNote={
                  locked
                    ? `${group.requiresProductLine} 제품군 전용 — PRODUCT_LINE이 ${group.requiresProductLine}일 때만 활성화 (현재: ${form.productLine || '미지정'})`
                    : undefined
                }
                optionsByColumn={optionsByColumn}
              />
            );
          })}

          <ReadonlyAudit item={item} />
        </div>

        <DialogFooter className="px-6 py-4 mx-0 mb-0 border-t border-border sm:justify-between gap-2 bg-muted/50 shrink-0 rounded-b-xl">
          <p className="text-2xs text-muted-foreground font-mono self-center">
            {isCreate
              ? 'TMPLT_ID·CREATED_AT 자동 생성 · PRODUCT_LINE·TEST_ITEM_NAME 필수'
              : '읽기 전용: TMPLT_ID, CREATED_AT, CREATED_BY · 시장 컬럼은 토글 후 저장됩니다.'}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving} className="text-xs font-bold">
              취소
            </Button>
            {isCreate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(true)}
                disabled={saving || !form.productLine || !form.testItemName}
                className="text-xs font-bold"
              >
                <Plus className="h-3.5 w-3.5" />
                추가 후 계속
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => handleSave(false)}
              disabled={saving || (isCreate && (!form.productLine || !form.testItemName))}
              className="text-xs font-bold bg-accent hover:bg-accent-hover text-white px-5"
            >
              {saving ? <Spinner className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? (isCreate ? '생성 중...' : '저장 중...') : isCreate ? '추가 (Create)' : '저장 (Save)'}
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

  // Changing the representative (item/method/condition) invalidates any pattern
  // built on the old base, so CDN_PATTERN is cleared alongside.
  const handleItemChange = (value: string) => {
    onChange('testItemName', value);
    onChange('testMethod', '');
    onChange('testCondition', '');
    onChange('cdnPattern', '');
  };

  const handleMethodChange = (value: string) => {
    onChange('testMethod', value);
    onChange('testCondition', '');
    onChange('cdnPattern', '');
  };

  const handleConditionChange = (value: string) => {
    onChange('testCondition', value);
    onChange('cdnPattern', '');
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
              onChange={handleConditionChange}
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

        {/* CDN_PATTERN — 대표 조건명의 확장 패턴 (%→{SS} #→{RADIAL_BIAS} @→{POR}) */}
        <div className="md:col-span-2 xl:col-span-4 min-w-0">
          <ComboField column="CDN_PATTERN" label="조건명 확장 패턴 (선택)">
            <CdnPatternBuilder
              base={form.testCondition}
              value={form.cdnPattern}
              onChange={(v) => onChange('cdnPattern', v)}
              disabled={disabled}
              ss={form.ss}
              radialBias={form.radialBias}
              por={form.por}
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
  lockedNote,
}: {
  group: EditGroup;
  form: FormState;
  onChange: (key: keyof FormState, value: string) => void;
  disabled: boolean;
  optionsByColumn: Record<string, string[]>;
  lockedNote?: string;
}) {
  return (
    <section
      className={`bg-card border rounded-xl shadow-xs overflow-hidden transition-opacity ${
        lockedNote ? 'border-border/60 opacity-60' : 'border-border'
      }`}
    >
      <div className="px-5 py-3 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
            {group.title}
          </h3>
          {lockedNote && (
            <span className="inline-flex items-center gap-1 text-2xs font-bold text-warning shrink-0">
              <Lock className="h-3 w-3" />
              {lockedNote}
            </span>
          )}
        </div>
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
      control =
        field.flagOn !== undefined ? (
          <MappedFlagToggle
            id={fieldId}
            value={value}
            onChange={onChange}
            onValue={field.flagOn}
            offValue={field.flagOff ?? ''}
            disabled={disabled}
          />
        ) : (
          <FlagToggle id={fieldId} value={value} onChange={onChange} disabled={disabled} />
        );
      break;
    case 'range':
      control = (
        <RangeInput id={fieldId} value={value} onChange={onChange} disabled={disabled} unit={field.unit} />
      );
      break;
    case 'multi':
      control = (
        <MultiCombobox
          id={fieldId}
          value={value}
          onChange={onChange}
          options={options}
          separator={field.separator}
          defaultHighlight={field.defaultHighlight}
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
    <div
      className={`space-y-1.5 min-w-0 ${field.full ? 'md:col-span-2 xl:col-span-4' : field.wide ? 'md:col-span-2' : ''
        }`}
    >
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
  certiTestYn,
  onCertiTestYnChange,
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
  certiTestYn: string;
  onCertiTestYnChange: (value: string) => void;
  certiType: string;
  onCertiTypeChange: (value: string) => void;
  regulationOptions: string[];
  productLine: string;
  testMethod: string;
  ss: string;
}) {
  const [suggestion, setSuggestion] = useState<SvrtySuggestResult | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [certiSuggestion, setCertiSuggestion] = useState<CertiTypeSuggestResult | null>(null);
  const [certiLoading, setCertiLoading] = useState(false);

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

  // CERTI_TYPE 제안 — 선택 시장에 매핑된 법규 코드
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!marketsStr) {
        setCertiSuggestion(null);
        return;
      }
      setCertiLoading(true);
      try {
        const result = await suggestCertiType(marketsStr);
        if (!ignore) setCertiSuggestion(result);
      } catch {
        if (!ignore) setCertiSuggestion(null);
      } finally {
        if (!ignore) setCertiLoading(false);
      }
    };
    const timer = setTimeout(() => void load(), 300);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [marketsStr]);

  const certiSet = new Set(
    certiType
      .split(/,\s*/)
      .map((c) => c.trim())
      .filter(Boolean),
  );
  const certiMissing = certiSuggestion?.suggested.filter((c) => !certiSet.has(c)) ?? [];
  const addCertiCode = (code: string) => {
    if (certiSet.has(code)) return;
    onCertiTypeChange([...certiSet, code].join(','));
  };
  const applyCertiSuggestion = () => {
    if (certiMissing.length === 0) return;
    onCertiTypeChange([...certiSet, ...certiMissing].join(','));
  };

  const reasonText: Record<string, string> = {
    UNSUPPORTED_METHOD: '지원되지 않는 시험 방법 — 고속내구(High Speed)/일반내구(Load Up)만 제안 가능',
    NO_APPLICABLE_REGULATION: '선택한 시장에 적용 가능한 법규 순위가 없습니다',
    NO_MARKETS: '시장을 선택하면 가혹도가 제안됩니다',
  };

  return (
    <section className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
          3. 시장 적용 정보
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
              CERTI_TEST_YN
            </label>
            <span className="text-2xs text-muted-foreground/70 truncate">인증 시험 여부 (Y/N)</span>
          </div>
          <FlagToggle
            id="edit-flag-certi-test-yn"
            value={certiTestYn}
            onChange={onCertiTestYnChange}
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

      {/* 인증유형 자동 제안 — 선택 시장에 매핑된 법규 코드, 적용은 수동 */}
      <div className="px-5 py-2.5 border-b border-border bg-muted/30 flex items-center gap-2.5 flex-wrap min-h-11">
        {certiLoading ? (
          <span className="flex items-center gap-1.5 text-2xs font-bold text-muted-foreground">
            <Spinner className="h-3 w-3" />
            인증유형 제안 계산 중...
          </span>
        ) : certiSuggestion && certiSuggestion.suggested.length > 0 ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-2xs font-bold text-secondary">
              <Wand2 className="h-3 w-3" />
              CERTI_TYPE 제안:
            </span>
            {certiSuggestion.suggested.map((code) => {
              const has = certiSet.has(code);
              return (
                <button
                  key={code}
                  type="button"
                  disabled={disabled || has}
                  onClick={() => addCertiCode(code)}
                  title={has ? '이미 반영됨' : '클릭하여 추가'}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-2xs font-mono font-bold border transition-colors ${has
                    ? 'bg-success-container text-success border-success/20 cursor-default'
                    : 'bg-card text-info border-info/40 hover:bg-info hover:text-white cursor-pointer disabled:opacity-60'
                    }`}
                >
                  {has && <Check className="h-3 w-3" />}
                  {code}
                </button>
              );
            })}
            {certiMissing.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={disabled}
                onClick={applyCertiSuggestion}
                className="text-2xs font-bold h-6"
              >
                제안 적용 ({certiMissing.length})
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1 text-2xs font-bold text-success">
                <Check className="h-3.5 w-3.5" />
                제안 모두 반영됨
              </span>
            )}
          </>
        ) : (
          <span className="text-2xs font-medium text-muted-foreground/70">
            시장을 선택하면 법규 기반 인증유형이 제안됩니다
          </span>
        )}

        {certiSuggestion && certiSuggestion.unmappedMarkets.length > 0 && (
          <span className="text-2xs text-muted-foreground/70">
            법규 매핑 없는 시장: {certiSuggestion.unmappedMarkets.join(', ')}
          </span>
        )}
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
              ENDUR_SVRTY 제안: {suggestion.suggested} — {suggestion.basis?.testCdnName} (
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
                className={`px-2 py-1 rounded-md text-2xs font-mono font-bold border transition-colors cursor-pointer disabled:opacity-60 ${on
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

function ReadonlyAudit({ item }: { item: StdTestItem | null }) {
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

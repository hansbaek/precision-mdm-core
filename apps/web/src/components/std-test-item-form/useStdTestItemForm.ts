import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getRegulationCodes } from '@/api/endur-svrty';
import { createStdTestItem, updateStdTestItem } from '@/api/template';
import { useStdCodes } from '@/hooks/use-std-codes';
import { ALL_MARKETS, type StdTestItem } from '@/types';
import { EMPTY_FORM, type FormState } from './types';

interface Params {
  isOpen: boolean;
  item: StdTestItem | null;
  mode: 'create' | 'edit';
  onSaved: (saved: StdTestItem) => void;
  onCreatedContinue?: (saved: StdTestItem) => void;
  onPending: (crId: number) => void;
}

/**
 * STD 시험항목 편집 모달의 상태·옵션·저장 로직을 캡슐화한다.
 * (모달은 셸 역할 — 이 훅의 반환값으로 섹션 컴포넌트들을 조립한다.)
 */
export function useStdTestItemForm({
  isOpen,
  item,
  mode,
  onSaved,
  onCreatedContinue,
  onPending,
}: Params) {
  const isCreate = mode === 'create';
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  // Inline confirmation for the just-created record (create-and-continue flow).
  const [lastCreatedId, setLastCreatedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Regulation codes back the CERTI_TYPE multi-combo (DW_REGULATION_MARKET_MAP).
  // 참조 데이터라 길게 캐싱한다. 실패해도 콤보만 비고 폼은 계속 사용 가능.
  const { data: regulationOptions = [] } = useQuery({
    queryKey: ['regulation-codes'],
    queryFn: getRegulationCodes,
    staleTime: 5 * 60_000,
  });

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

  return {
    isCreate,
    form,
    handleFieldChange,
    selectedMarkets,
    toggleMarket,
    saving,
    lastCreatedId,
    error,
    optionsByColumn,
    regulationOptions,
    handleSave,
  };
}

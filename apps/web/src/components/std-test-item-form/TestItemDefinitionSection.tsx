import { useState, type ReactNode } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import CdnPatternBuilder from '@/components/CdnPatternBuilder';
import SearchCombobox from '@/components/SearchCombobox';
import {
  getTestClassificationConditions,
  getTestClassificationGroups,
  getTestClassificationItems,
  getTestClassificationMethods,
} from '@/api/test-classification';
import type { FormState } from './types';

/**
 * Section 2: cascading combos backed by DW_HNT_CLASSIFICATION (mode 'Indoor').
 * 그룹(화면 필터용, 저장 안 함) → 항목 → 방법 → 조건. List-only selection;
 * legacy values outside the reference list stay selectable as "(기준 외)".
 */
export default function TestItemDefinitionSection({
  form,
  onChange,
  disabled,
}: {
  form: FormState;
  onChange: (key: keyof FormState, value: string) => void;
  disabled: boolean;
}) {
  // 그룹은 화면 필터용 로컬 선택값(저장 안 함).
  const [group, setGroup] = useState('');

  // 기준 분류(DW_HNT_CLASSIFICATION)는 참조 데이터라 길게 캐싱한다.
  const { data: groups = [] } = useQuery({
    queryKey: ['test-classification', 'groups'],
    queryFn: getTestClassificationGroups,
    staleTime: 5 * 60_000,
  });

  // 그룹 변경 시 목록 churn을 막기 위해 이전 데이터를 유지하며 갱신.
  const { data: items = [], isFetching: itemsLoading } = useQuery({
    queryKey: ['test-classification', 'items', group],
    queryFn: () => getTestClassificationItems(group || undefined),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });

  // 항목 미선택 시 비활성 → methods []. (키에 항목명이 포함돼 빈 값일 때 데이터 없음)
  const { data: methods = [], isFetching: methodsLoading } = useQuery({
    queryKey: ['test-classification', 'methods', form.testItemName],
    queryFn: () => getTestClassificationMethods(form.testItemName),
    enabled: !!form.testItemName,
    staleTime: 5 * 60_000,
  });

  const { data: conditions = [], isFetching: conditionsLoading } = useQuery({
    queryKey: ['test-classification', 'conditions', form.testItemName, form.testMethod],
    queryFn: () => getTestClassificationConditions(form.testItemName, form.testMethod),
    enabled: !!form.testItemName && !!form.testMethod,
    staleTime: 5 * 60_000,
  });

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
  children: ReactNode;
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

import { Check, Plus, Save } from 'lucide-react';

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
import type { StdTestItem } from '../types';
import EditSection from './std-test-item-form/EditSection';
import MarketEditSection from './std-test-item-form/MarketEditSection';
import ReadonlyAudit from './std-test-item-form/ReadonlyAudit';
import TestItemDefinitionSection from './std-test-item-form/TestItemDefinitionSection';
import { EDIT_GROUPS } from './std-test-item-form/edit-groups';
import { useStdTestItemForm } from './std-test-item-form/useStdTestItemForm';

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

/**
 * STD 시험항목 생성/편집 모달 — 셸(레이아웃 + 섹션 조립).
 * 상태·옵션·저장 로직은 useStdTestItemForm 훅, 각 섹션은 std-test-item-form/* 로 분리.
 */
export default function StdTestItemEditModal({
  isOpen,
  item,
  mode = 'edit',
  onClose,
  onSaved,
  onCreatedContinue,
  onPending,
}: Props) {
  const {
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
  } = useStdTestItemForm({ isOpen, item, mode, onSaved, onCreatedContinue, onPending });

  if (!isCreate && !item) return null;

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

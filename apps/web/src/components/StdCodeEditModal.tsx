import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { createStdCode, updateStdCode } from '@/api/stdCodes';
import type { StdCode, StdCodeCreate, StdCodeUpdate } from '@/types';

const errMsg = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data
    ?.message ?? fallback;

/** ATTR 슬롯 한 칸의 폼 상태(값/명/설명). */
interface AttrForm {
  val: string;
  nm: string;
  desc: string;
}

const EMPTY_ATTR: AttrForm = { val: '', nm: '', desc: '' };

interface StdCodeEditModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  /** 생성 컨텍스트 — 대상 그룹. */
  groupId: string;
  groupNm: string | null;
  /** 부모 코드(루트 생성이면 null). */
  parentCd: string | null;
  /** 신규 그룹에 첫 코드를 만드는 경우 그룹명 입력을 노출. */
  isNewGroup?: boolean;
  /** 수정 대상(mode='edit'). */
  code: StdCode | null;
  /** 복제 원본(mode='create' 복제 시 CODE_CD 외 값을 프리필). */
  seed?: StdCode | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function StdCodeEditModal({
  open,
  mode,
  groupId,
  groupNm,
  parentCd,
  isNewGroup = false,
  code,
  seed = null,
  onClose,
  onSaved,
}: StdCodeEditModalProps) {
  const [codeCd, setCodeCd] = useState('');
  const [codeNm, setCodeNm] = useState('');
  const [codeDesc, setCodeDesc] = useState('');
  const [newGroupNm, setNewGroupNm] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [useYn, setUseYn] = useState('Y');
  const [attrs, setAttrs] = useState<[AttrForm, AttrForm, AttrForm]>([
    { ...EMPTY_ATTR },
    { ...EMPTY_ATTR },
    { ...EMPTY_ATTR },
  ]);
  const [attrOpen, setAttrOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달이 열릴 때 폼을 대상 값으로 초기화.
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === 'edit' && code) {
      setCodeCd(code.codeCd);
      setCodeNm(code.codeNm ?? '');
      setCodeDesc(code.codeDesc ?? '');
      setNewGroupNm(code.codeGrpNm ?? '');
      setSortOrder(String(code.sortOrder ?? 0));
      setUseYn(code.useYn ?? 'Y');
      setAttrs([
        { val: code.attr1Val ?? '', nm: code.attr1Nm ?? '', desc: code.attr1Desc ?? '' },
        { val: code.attr2Val ?? '', nm: code.attr2Nm ?? '', desc: code.attr2Desc ?? '' },
        { val: code.attr3Val ?? '', nm: code.attr3Nm ?? '', desc: code.attr3Desc ?? '' },
      ]);
      setAttrOpen(
        Boolean(
          code.attr1Val || code.attr2Val || code.attr3Val ||
          code.attr1Nm || code.attr2Nm || code.attr3Nm,
        ),
      );
    } else {
      // CODE_CD 는 항상 빈 값(신규 입력). 복제(seed)면 나머지를 미리 채운다.
      setCodeCd('');
      setCodeNm(seed?.codeNm ?? '');
      setCodeDesc(seed?.codeDesc ?? '');
      setNewGroupNm('');
      setSortOrder(String(seed?.sortOrder ?? 0));
      setUseYn(seed?.useYn ?? 'Y');
      setAttrs([
        { val: seed?.attr1Val ?? '', nm: seed?.attr1Nm ?? '', desc: seed?.attr1Desc ?? '' },
        { val: seed?.attr2Val ?? '', nm: seed?.attr2Nm ?? '', desc: seed?.attr2Desc ?? '' },
        { val: seed?.attr3Val ?? '', nm: seed?.attr3Nm ?? '', desc: seed?.attr3Desc ?? '' },
      ]);
      setAttrOpen(
        Boolean(
          seed?.attr1Val || seed?.attr2Val || seed?.attr3Val ||
          seed?.attr1Nm || seed?.attr2Nm || seed?.attr3Nm,
        ),
      );
    }
  }, [open, mode, code, seed]);

  const setAttr = (i: 0 | 1 | 2, key: keyof AttrForm, value: string) =>
    setAttrs((prev) => {
      const next = [...prev] as [AttrForm, AttrForm, AttrForm];
      next[i] = { ...next[i], [key]: value };
      return next;
    });

  const blank = (s: string) => (s.trim() === '' ? undefined : s.trim());

  const attrPayload = () => ({
    attr1Val: blank(attrs[0].val),
    attr1Nm: blank(attrs[0].nm),
    attr1Desc: blank(attrs[0].desc),
    attr2Val: blank(attrs[1].val),
    attr2Nm: blank(attrs[1].nm),
    attr2Desc: blank(attrs[1].desc),
    attr3Val: blank(attrs[2].val),
    attr3Nm: blank(attrs[2].nm),
    attr3Desc: blank(attrs[2].desc),
  });

  const handleSave = async () => {
    setError(null);
    if (mode === 'create' && !codeCd.trim()) {
      setError('코드값(CODE_CD)을 입력하세요.');
      return;
    }
    if (mode === 'create' && isNewGroup && !newGroupNm.trim()) {
      setError('새 그룹의 그룹명을 입력하세요.');
      return;
    }
    setSaving(true);
    try {
      if (mode === 'create') {
        const payload: StdCodeCreate = {
          codeGrpId: groupId,
          codeGrpNm: isNewGroup ? newGroupNm.trim() : undefined,
          parentCd: parentCd ?? undefined,
          codeCd: codeCd.trim(),
          codeNm: blank(codeNm),
          codeDesc: blank(codeDesc),
          sortOrder: Number(sortOrder) || 0,
          useYn,
          ...attrPayload(),
        };
        await createStdCode(payload);
      } else if (code) {
        const payload: StdCodeUpdate = {
          codeNm: codeNm.trim(),
          codeDesc: codeDesc.trim(),
          codeGrpNm: newGroupNm.trim() || undefined,
          sortOrder: Number(sortOrder) || 0,
          useYn,
          ...attrPayload(),
        };
        await updateStdCode(code.codeGrpId, code.codeLvl, code.codeCd, payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(errMsg(e, '저장에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const title =
    mode === 'create'
      ? seed
        ? `코드 복제 — ${seed.codeCd} 기준`
        : parentCd
          ? `하위코드 추가 — ${parentCd}`
          : isNewGroup
            ? '신규 그룹 · 코드 추가'
            : '코드 추가'
      : `코드 수정 — ${code?.codeCd ?? ''}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl sm:max-w-2xl p-0 gap-0 max-h-[92vh] flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border bg-primary/5 gap-0.5 shrink-0">
          <DialogDescription className="text-2xs text-secondary font-mono uppercase tracking-widest">
            {groupId}
            {groupNm ? ` · ${groupNm}` : ''}
          </DialogDescription>
          <DialogTitle className="text-base font-extrabold text-primary font-hanken">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {isNewGroup && mode === 'create' && (
            <div className="space-y-1.5">
              <Label className="text-2xs font-bold text-secondary uppercase tracking-wider">
                그룹명 (CODE_GRP_NM) <span className="text-destructive">*</span>
              </Label>
              <Input
                value={newGroupNm}
                onChange={(e) => setNewGroupNm(e.target.value)}
                placeholder="예: 제품 라인"
                className="text-xs"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-2xs font-bold text-secondary uppercase tracking-wider">
                코드값 (CODE_CD) <span className="text-destructive">*</span>
              </Label>
              <Input
                value={codeCd}
                onChange={(e) => setCodeCd(e.target.value)}
                disabled={mode === 'edit'}
                placeholder="예: PCR"
                className="text-xs font-mono disabled:opacity-60"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-2xs font-bold text-secondary uppercase tracking-wider">
                정렬 순서 (SORT_ORDER)
              </Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-2xs font-bold text-secondary uppercase tracking-wider">
              코드명 (CODE_NM)
            </Label>
            <Input
              value={codeNm}
              onChange={(e) => setCodeNm(e.target.value)}
              placeholder="예: 승용차용 레이디얼"
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-2xs font-bold text-secondary uppercase tracking-wider">
              설명 (CODE_DESC)
            </Label>
            <Textarea
              value={codeDesc}
              onChange={(e) => setCodeDesc(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-2xs font-bold text-secondary uppercase tracking-wider">
              사용여부 (USE_YN)
            </Label>
            <button
              type="button"
              onClick={() => setUseYn((v) => (v === 'Y' ? 'N' : 'Y'))}
              className={`px-3 py-1 rounded-full text-2xs font-bold ${
                useYn === 'Y'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {useYn === 'Y' ? '사용(Y)' : '미사용(N)'}
            </button>
          </div>

          {/* ATTR 1~3 부가 속성 — 접이식 */}
          <div className="border border-border rounded-lg">
            <button
              type="button"
              onClick={() => setAttrOpen((v) => !v)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-2xs font-bold text-secondary uppercase tracking-wider hover:bg-muted/40"
            >
              {attrOpen ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
              부가 속성 (ATTR 1~3)
            </button>
            {attrOpen && (
              <div className="px-3 pb-3 space-y-3">
                {([0, 1, 2] as const).map((i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_2fr] gap-2">
                    <Input
                      value={attrs[i].val}
                      onChange={(e) => setAttr(i, 'val', e.target.value)}
                      placeholder={`ATTR${i + 1} 값`}
                      className="text-xs font-mono"
                    />
                    <Input
                      value={attrs[i].nm}
                      onChange={(e) => setAttr(i, 'nm', e.target.value)}
                      placeholder={`ATTR${i + 1} 명`}
                      className="text-xs"
                    />
                    <Input
                      value={attrs[i].desc}
                      onChange={(e) => setAttr(i, 'desc', e.target.value)}
                      placeholder={`ATTR${i + 1} 설명`}
                      className="text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs font-bold text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border gap-2 bg-muted/50 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            취소
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-accent hover:bg-accent-hover text-white"
          >
            {saving ? (
              <Spinner />
            ) : mode === 'create' ? (
              <Plus className="size-3.5" />
            ) : (
              <Save className="size-3.5" />
            )}
            {mode === 'create' ? '추가' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

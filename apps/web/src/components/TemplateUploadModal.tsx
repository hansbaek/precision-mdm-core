/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState, type DragEvent } from 'react';
import { isAxiosError } from 'axios';
import { AlertTriangle, ArrowRight, FileSpreadsheet, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  applyTemplateUpload,
  previewTemplateUpload,
  type UploadPreviewResult,
} from '@/api/template';
import { Badge } from '@/components/ui/badge';
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

type Step = 'select' | 'previewing' | 'preview' | 'applying';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplied: () => void;
}

export default function TemplateUploadModal({ isOpen, onClose, onApplied }: Props) {
  const [step, setStep] = useState<Step>('select');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<UploadPreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forceConfirmed, setForceConfirmed] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = step === 'previewing' || step === 'applying';

  const reset = () => {
    setStep('select');
    setFile(null);
    setPreview(null);
    setError(null);
    setForceConfirmed(false);
    setDragOver(false);
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const pickFile = (picked: File | null) => {
    if (!picked) return;
    if (!picked.name.toLowerCase().endsWith('.xlsx')) {
      setError('xlsx 파일만 업로드할 수 있습니다.');
      return;
    }
    setFile(picked);
    setPreview(null);
    setError(null);
    setForceConfirmed(false);
    setStep('select');
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  };

  const extractMessage = (err: unknown): string => {
    if (isAxiosError(err)) {
      const data = err.response?.data as { message?: string } | undefined;
      if (data?.message) return data.message;
    }
    return '요청 처리 중 오류가 발생했습니다.';
  };

  const handlePreview = async () => {
    if (!file) return;
    setStep('previewing');
    setError(null);
    try {
      const result = await previewTemplateUpload(file);
      setPreview(result);
      setStep('preview');
    } catch (err) {
      setError(extractMessage(err));
      setStep('select');
    }
  };

  const handleApply = async () => {
    if (!file || !preview) return;
    setStep('applying');
    setError(null);
    try {
      const result = await applyTemplateUpload(file, forceConfirmed);
      toast.success(
        `동기화 완료: 추가 ${result.summary.inserts} · 수정 ${result.summary.updates} · 삭제 ${result.summary.deletes}`,
      );
      onApplied();
      reset();
      onClose();
    } catch (err) {
      setError(extractMessage(err));
      setStep('preview');
    }
  };

  const massDelete = preview?.warnings.find((w) => w.code === 'MASS_DELETE');
  const hasChanges =
    preview !== null &&
    preview.summary.inserts + preview.summary.updates + preview.summary.deletes > 0;
  const canApply =
    step === 'preview' &&
    preview !== null &&
    preview.valid &&
    hasChanges &&
    (!massDelete || forceConfirmed);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl sm:max-w-3xl p-0 gap-0 max-h-[88vh] flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border bg-primary/5 gap-0.5 shrink-0">
          <DialogDescription className="text-2xs text-secondary font-mono uppercase tracking-widest">
            Excel 업로드 동기화 · TEMPLATE_STD_TEST_ITEM
          </DialogDescription>
          <DialogTitle className="text-base font-extrabold text-primary font-hanken">
            Excel Template Upload
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto p-6 space-y-4 flex-1 bg-background">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          {/* File select / drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border border-dashed rounded-xl p-6 flex flex-col items-center gap-2 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border bg-card'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                pickFile(e.target.files?.[0] ?? null);
                e.target.value = '';
              }}
            />
            {file ? (
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <FileSpreadsheet className="h-5 w-5 text-success" />
                <span>{file.name}</span>
                <span className="text-2xs text-muted-foreground font-mono">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  aria-label="파일 선택 해제"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setStep('select');
                  }}
                  disabled={busy}
                  className="p-0.5 rounded-sm text-muted-foreground hover:text-destructive cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-7 w-7 text-muted-foreground/50" />
                <p className="text-xs font-bold text-foreground">
                  다운로드한 양식(.xlsx)을 여기로 끌어다 놓거나
                </p>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="text-xs font-bold"
            >
              파일 선택
            </Button>
            <p className="text-2xs text-muted-foreground leading-relaxed">
              TMPLT_ID가 빈 행은 <span className="text-success font-bold">추가</span>, 셀이 바뀐
              행은 <span className="text-info font-bold">수정</span>, 파일에서 지운 행은 DB에서{' '}
              <span className="text-destructive font-bold">삭제</span>됩니다.
            </p>
          </div>

          {/* Preview result */}
          {step === 'preview' && preview && (
            <div className="space-y-4">
              {/* Summary badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-success-container text-success border-success/20 rounded-md font-bold">
                  추가 {preview.summary.inserts}건
                </Badge>
                <Badge className="bg-info-container text-info border-info/20 rounded-md font-bold">
                  수정 {preview.summary.updates}건
                </Badge>
                <Badge variant="destructive" className="rounded-md font-bold">
                  삭제 {preview.summary.deletes}건
                </Badge>
                <Badge variant="outline" className="rounded-md text-muted-foreground font-bold">
                  변경 없음 {preview.summary.unchanged}건
                </Badge>
                <span className="text-2xs text-muted-foreground font-mono ml-auto">
                  파일 {preview.fileRowCount}행 / DB {preview.dbRowCount}행
                </span>
              </div>

              {/* Errors */}
              {preview.errors.length > 0 && (
                <Section title={`검증 오류 (${preview.errors.length})`} tone="destructive">
                  <ul className="space-y-1">
                    {preview.errors.map((e, i) => (
                      <li key={i} className="text-xs font-semibold text-destructive">
                        {e.message}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Mass-delete warning */}
              {massDelete && (
                <div className="bg-warning-container border border-warning/30 rounded-xl p-4 space-y-2">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-warning">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {massDelete.message}
                  </p>
                  <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={forceConfirmed}
                      onChange={(e) => setForceConfirmed(e.target.checked)}
                      className="h-3.5 w-3.5 accent-[var(--warning)]"
                    />
                    위 삭제 내용을 확인했으며 그대로 적용합니다.
                  </label>
                </div>
              )}

              {/* Updates */}
              {preview.updates.length > 0 && (
                <Section title={`수정 (${preview.updates.length})`} tone="info">
                  <ul className="space-y-2.5">
                    {preview.updates.map((u) => (
                      <li key={u.id} className="space-y-1">
                        <p className="text-xs font-bold text-foreground">
                          <span className="font-mono text-primary">#{u.id}</span>{' '}
                          {u.testItemName || '–'}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {u.changes.map((c) => (
                            <span
                              key={c.column}
                              className="inline-flex items-center gap-1 text-2xs font-mono bg-muted border border-border rounded-md px-1.5 py-0.5"
                            >
                              <span className="font-bold text-secondary">{c.column}:</span>
                              <span className="text-muted-foreground line-through">
                                {c.before ?? '∅'}
                              </span>
                              <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                              <span className="text-info font-bold">{c.after ?? '∅'}</span>
                            </span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Inserts */}
              {preview.inserts.length > 0 && (
                <Section title={`추가 (${preview.inserts.length})`} tone="success">
                  <ul className="space-y-1.5">
                    {preview.inserts.map((ins) => (
                      <li key={ins.rowNumber} className="text-xs">
                        <span className="font-mono text-2xs text-muted-foreground">
                          행 {ins.rowNumber}
                        </span>{' '}
                        <span className="font-bold text-foreground">
                          {ins.values['TEST_ITEM_NAME'] ?? '–'}
                        </span>{' '}
                        <span className="font-mono text-2xs text-secondary">
                          {ins.values['PRODUCT_LINE'] ?? ''}
                        </span>
                        {ins.markets.length > 0 && (
                          <span className="font-mono text-2xs text-info ml-1.5">
                            [{ins.markets.join(', ')}]
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Deletes */}
              {preview.deletes.length > 0 && (
                <Section title={`삭제 (${preview.deletes.length})`} tone="destructive">
                  <ul className="space-y-1">
                    {preview.deletes.map((d) => (
                      <li key={d.id} className="text-xs font-semibold text-destructive">
                        <span className="font-mono">#{d.id}</span> {d.testItemName || '–'}{' '}
                        <span className="font-mono text-2xs opacity-70">{d.productLine}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {preview.valid && !hasChanges && (
                <p className="text-xs font-bold text-muted-foreground text-center py-2">
                  변경 사항이 없습니다. 파일이 DB와 동일합니다.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 mx-0 mb-0 border-t border-border sm:justify-between gap-2 bg-muted/50 shrink-0 rounded-b-xl">
          <p className="text-2xs text-muted-foreground font-mono self-center">
            적용은 단일 트랜잭션으로 수행되며 실패 시 전체 롤백됩니다.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={busy}
              className="text-xs font-bold"
            >
              취소
            </Button>
            {step === 'preview' || step === 'applying' ? (
              <Button
                size="sm"
                onClick={handleApply}
                disabled={!canApply || busy}
                className="text-xs font-bold bg-accent hover:bg-accent-hover text-white px-5"
              >
                {step === 'applying' ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {step === 'applying' ? '적용 중...' : '동기화 적용'}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handlePreview}
                disabled={!file || busy}
                className="text-xs font-bold px-5"
              >
                {step === 'previewing' ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                )}
                {step === 'previewing' ? '분석 중...' : '미리보기'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: 'success' | 'info' | 'destructive';
  children: React.ReactNode;
}) {
  const toneClasses = {
    success: 'border-success/20',
    info: 'border-info/20',
    destructive: 'border-destructive/20',
  } as const;
  const titleClasses = {
    success: 'text-success',
    info: 'text-info',
    destructive: 'text-destructive',
  } as const;

  return (
    <section className={`bg-card border rounded-xl overflow-hidden ${toneClasses[tone]}`}>
      <div className="px-4 py-2.5 border-b border-border">
        <h3 className={`text-2xs font-extrabold uppercase tracking-widest ${titleClasses[tone]}`}>
          {title}
        </h3>
      </div>
      <div className="p-4 max-h-48 overflow-y-auto">{children}</div>
    </section>
  );
}

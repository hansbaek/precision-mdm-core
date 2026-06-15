import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

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
import { deleteStdTestItem } from '@/api/template';
import type { StdTestItem } from '@/types';

interface Props {
  /** Item pending deletion; null closes the dialog. */
  item: StdTestItem | null;
  onClose: () => void;
  onDeleted: (id: number) => void;
}

/**
 * Confirmation gate for the (irreversible) hard delete. Shows exactly which
 * record is targeted so the user can't delete the wrong row by reflex.
 */
export default function ConfirmDeleteDialog({ item, onClose, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!item) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteStdTestItem(item.id);
      onDeleted(item.id);
    } catch {
      setError('삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={item !== null}
      onOpenChange={(open) => {
        if (!open && !deleting) onClose();
      }}
    >
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border gap-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-destructive/10 text-destructive shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <DialogTitle className="text-base font-extrabold text-primary">항목 삭제</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-secondary">
            이 작업은 되돌릴 수 없습니다. 아래 항목이 영구적으로 삭제됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          {item && (
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
              <span className="font-mono font-bold text-primary">#{item.id}</span>
              <span className="mx-2 text-muted-foreground/50">·</span>
              <span className="font-mono font-bold">{item.productLine || '–'}</span>
              <span className="mx-2 text-muted-foreground/50">·</span>
              <span className="font-semibold text-foreground">{item.testItemName || '–'}</span>
            </div>
          )}
          {error && (
            <p className="mt-3 text-xs font-bold text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/50 gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={deleting} className="text-xs font-bold">
            취소
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs font-bold px-5"
          >
            {deleting ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
            {deleting ? '삭제 중...' : '삭제 (Delete)'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileEdit,
  Inbox,
  Trash2,
  XCircle,
} from 'lucide-react';

import EmptyState from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useCan } from '@/hooks/use-permissions-store';
import { getStdTestItem } from '@/api/template';
import { createdValues, diffValues, type FieldChange } from '@/lib/std-fields';
import type { StdTestItem } from '@/types';
import {
  approveChangeRequest,
  getMyChangeRequests,
  getPendingChangeRequests,
  rejectChangeRequest,
  type ChangeOperation,
  type ChangeRequestStatus,
  type ChangeRequestView,
} from '@/api/change-requests';

const OP_VARIANT: Record<ChangeOperation, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  UPDATE: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  DELETE: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

const STATUS_VARIANT: Record<ChangeRequestStatus, string> = {
  PENDING: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  APPROVED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  REJECTED: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

/** 변경 내용 펼쳐보기 — UPDATE는 이전→이후, CREATE는 신규값, DELETE는 삭제 대상. */
function ChangeDetails({ cr }: { cr: ChangeRequestView }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<StdTestItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // UPDATE/DELETE는 현재값(이전값)이 필요 → 단건 조회.
  useEffect(() => {
    if (cr.targetId == null || cr.operation === 'CREATE') return;
    let ignore = false;
    const fetchCurrent = async (id: number) => {
      setLoading(true);
      setError(false);
      try {
        const item = await getStdTestItem(id);
        if (!ignore) setCurrent(item);
      } catch {
        if (!ignore) setError(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void fetchCurrent(cr.targetId);
    return () => {
      ignore = true;
    };
  }, [cr.targetId, cr.operation]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-2xs text-muted-foreground">
        <Spinner className="h-3.5 w-3.5" /> {t('loading')}
      </div>
    );
  }
  if (error) {
    return <p className="px-3 py-2 text-2xs text-destructive">{t('app.approval.loadError')}</p>;
  }

  const payload = (cr.payload ?? {}) as Record<string, unknown>;

  if (cr.operation === 'DELETE') {
    return (
      <div className="px-3 py-2.5 text-xs">
        <p className="flex items-center gap-1.5 font-semibold text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
          {t('app.approval.deleteTarget')}
        </p>
        {current && (
          <p className="mt-1 font-mono text-muted-foreground">
            #{current.id} · {current.productLine || '–'} · {current.testItemName || '–'}
          </p>
        )}
      </div>
    );
  }

  const changes: FieldChange[] =
    cr.operation === 'CREATE'
      ? createdValues(payload)
      : current
        ? diffValues(current, payload)
        : [];

  if (changes.length === 0) {
    return <p className="px-3 py-2 text-2xs text-muted-foreground">{t('app.approval.noChanges')}</p>;
  }

  return (
    <table className="w-full text-xs">
      <tbody className="divide-y divide-border">
        {changes.map((c) => (
          <tr key={c.key}>
            <td className="py-1.5 pl-3 pr-2 text-muted-foreground font-medium whitespace-nowrap align-top">
              {c.label}
            </td>
            <td className="py-1.5 pr-3 font-mono">
              {cr.operation === 'UPDATE' ? (
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-muted-foreground line-through">{c.before || '∅'}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                  <span className="text-foreground font-semibold">{c.after || '∅'}</span>
                </span>
              ) : (
                <span className="text-foreground font-semibold">{c.after}</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** 변경요청 카드 (대기/내 요청 공용). actions 영역만 다르다. */
function ChangeRequestCard({
  cr,
  fmtDate,
  actions,
  statusBadge,
}: {
  cr: ChangeRequestView;
  fmtDate: (iso: string) => string;
  actions?: React.ReactNode;
  statusBadge?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 px-4 py-3">
        <Badge className={`${OP_VARIANT[cr.operation]} font-bold shrink-0`}>
          {t(`app.approval.op.${cr.operation}`)}
        </Badge>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {cr.summary ?? `#${cr.crId}`}
          </p>
          <p className="text-2xs text-muted-foreground font-mono">
            {t('app.approval.requester')}: {cr.requesterId} · {fmtDate(cr.createdAt)}
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-2xs font-bold text-muted-foreground hover:text-foreground shrink-0"
        >
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {t('app.approval.viewChanges')}
        </button>
        {statusBadge}
        {actions}
      </div>
      {open && (
        <div className="border-t border-border bg-muted/30">
          <ChangeDetails cr={cr} />
        </div>
      )}
    </div>
  );
}

export default function ApprovalsPage() {
  const { t, i18n } = useTranslation();
  const can = useCan();
  const isApprover = can('test-master.dashboard', 'approve');

  const [pending, setPending] = useState<ChangeRequestView[]>([]);
  const [mine, setMine] = useState<ChangeRequestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ChangeRequestView | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language.startsWith('en') ? 'en-US' : 'ko-KR');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mineRes, pendingRes] = await Promise.all([
        getMyChangeRequests(),
        isApprover ? getPendingChangeRequests() : Promise.resolve(null),
      ]);
      if (mineRes.ok && mineRes.result) setMine(mineRes.result);
      if (pendingRes?.ok && pendingRes.result) setPending(pendingRes.result);
    } catch {
      toast.error(t('error.default'));
    } finally {
      setLoading(false);
    }
  }, [isApprover, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleApprove = async (cr: ChangeRequestView) => {
    setBusyId(cr.crId);
    try {
      const res = await approveChangeRequest(cr.crId);
      if (!res.ok) {
        toast.error(res.error ?? t('error.default'));
        return;
      }
      toast.success(t('app.approval.approved'));
      await load();
    } catch {
      toast.error(t('error.default'));
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.crId);
    try {
      const res = await rejectChangeRequest(rejectTarget.crId, rejectComment.trim() || undefined);
      if (!res.ok) {
        toast.error(res.error ?? t('error.default'));
        return;
      }
      toast.success(t('app.approval.rejected'));
      setRejectTarget(null);
      setRejectComment('');
      await load();
    } catch {
      toast.error(t('error.default'));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 승인 대기 (승인권자만) */}
      {isApprover && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
            <Inbox className="h-4 w-4 text-primary" />
            {t('app.approval.pendingSection')}
            <span className="text-2xs font-mono bg-muted px-2 py-0.5 rounded-md">
              {pending.length}
            </span>
          </h2>
          {pending.length === 0 ? (
            <EmptyState icon={CheckCircle2} message={t('app.approval.emptyPending')} />
          ) : (
            <div className="space-y-2">
              {pending.map((cr) => (
                <ChangeRequestCard
                  key={cr.crId}
                  cr={cr}
                  fmtDate={fmtDate}
                  actions={
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(cr)}
                        disabled={busyId === cr.crId}
                        className="gap-1.5 text-xs"
                      >
                        {busyId === cr.crId ? (
                          <Spinner className="h-3.5 w-3.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        {t('app.approval.approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectTarget(cr)}
                        disabled={busyId === cr.crId}
                        className="gap-1.5 text-xs"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        {t('app.approval.reject')}
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 내 변경요청 (전원) */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
          <FileEdit className="h-4 w-4 text-primary" />
          {t('app.approval.mineSection')}
        </h2>
        {mine.length === 0 ? (
          <EmptyState icon={Clock} message={t('app.approval.emptyMine')} />
        ) : (
          <div className="space-y-2">
            {mine.map((cr) => (
              <ChangeRequestCard
                key={cr.crId}
                cr={cr}
                fmtDate={fmtDate}
                statusBadge={
                  <Badge className={`${STATUS_VARIANT[cr.status]} font-bold shrink-0`}>
                    {t(`app.approval.status.${cr.status}`)}
                  </Badge>
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* 반려 사유 입력 */}
      <Dialog open={rejectTarget !== null} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              {t('app.approval.rejectTitle')}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            placeholder={t('app.approval.rejectPlaceholder')}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={busyId === rejectTarget?.crId}
            >
              {busyId === rejectTarget?.crId ? <Spinner /> : t('app.approval.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

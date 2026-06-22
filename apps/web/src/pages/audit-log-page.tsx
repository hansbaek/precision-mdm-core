import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { ChevronDown, ChevronRight, RotateCcw, Search } from 'lucide-react';
import {
  fetchAuditLogs,
  type AuditAction,
  type AuditLog,
  type AuditQuery,
  type AuditSource,
} from '@/api/audit';
import { Badge } from '@/components/ui/badge';
import { STD_FIELD_LABELS } from '@/lib/std-fields';

const PAGE_SIZE = 50;

const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: '생성',
  UPDATE: '수정',
  DELETE: '삭제',
  BULK_UPLOAD: '엑셀 업로드',
  LOGIN: '로그인',
  LOGIN_FAILED: '로그인 실패',
  LOGOUT: '로그아웃',
  PASSWORD_CHANGE: '비밀번호 변경',
  PASSWORD_RESET: '비밀번호 재설정',
  PERM_CHANGE: '권한 변경',
};

const SOURCE_LABEL: Record<AuditSource, string> = {
  API: '직접 편집',
  APPROVAL: '승인 반영',
  EXCEL_UPLOAD: '엑셀 업로드',
  AUTH: '본인 인증',
  ADMIN: '관리자 콘솔',
};

const ACTION_CLASS: Record<AuditAction, string> = {
  CREATE: 'bg-success-container text-success border-success/20',
  UPDATE: 'bg-info-container text-info border-info/20',
  DELETE: 'bg-destructive/10 text-destructive border-destructive/20',
  BULK_UPLOAD: 'bg-warning-container text-warning border-warning/20',
  LOGIN: 'bg-muted text-secondary border-border',
  LOGIN_FAILED: 'bg-destructive/10 text-destructive border-destructive/20',
  LOGOUT: 'bg-muted text-muted-foreground border-border',
  PASSWORD_CHANGE: 'bg-info-container text-info border-info/20',
  PASSWORD_RESET: 'bg-warning-container text-warning border-warning/20',
  PERM_CHANGE: 'bg-warning-container text-warning border-warning/20',
};

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

// 사용자/역할 관리 이벤트의 필드명(영문) → 한글 라벨. 표준항목 라벨에 없으면 사용.
const ADMIN_FIELD_LABELS: Record<string, string> = {
  userNm: '이름',
  userNmEng: '이름(영문)',
  teamNm: '팀',
  teamNmEng: '팀(영문)',
  roleId: '역할',
  useYn: '사용 여부',
  roleNm: '역할명',
  sortOrder: '정렬 순서',
};

const colLabel = (col: string) =>
  STD_FIELD_LABELS[col] ?? ADMIN_FIELD_LABELS[col] ?? col;

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // 적용된 필터(검색 버튼 시 갱신).
  const [filters, setFilters] = useState<AuditQuery>({});
  // 입력 중 필터.
  const [draft, setDraft] = useState<{
    action: string;
    source: string;
    actorId: string;
    entityId: string;
    from: string;
    to: string;
  }>({ action: '', source: '', actorId: '', entityId: '', from: '', to: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAuditLogs({
        ...filters,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setLogs(res.rows);
      setTotal(res.total);
    } catch (e) {
      setError(
        e instanceof AxiosError && e.response?.status === 403
          ? '변경 이력을 조회할 권한이 없습니다.'
          : '변경 이력을 불러오지 못했습니다.',
      );
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const applySearch = () => {
    setFilters({
      action: draft.action || undefined,
      source: draft.source || undefined,
      actorId: draft.actorId.trim() || undefined,
      entityId: draft.entityId.trim() || undefined,
      from: draft.from ? new Date(draft.from).toISOString() : undefined,
      to: draft.to ? new Date(draft.to).toISOString() : undefined,
    });
    setPage(0);
    setExpanded(new Set());
  };

  const resetSearch = () => {
    setDraft({
      action: '',
      source: '',
      actorId: '',
      entityId: '',
      from: '',
      to: '',
    });
    setFilters({});
    setPage(0);
    setExpanded(new Set());
  };

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-base font-extrabold text-primary font-hanken">
            데이터 감사 · 변경 이력
          </h2>
          <p className="text-xs text-secondary mt-1">
            누가 / 언제 / 무엇을 바꿨는지 추적합니다. 전체 {total.toLocaleString()}건
          </p>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 items-end">
        <Field label="작업">
          <select
            className="w-full h-9 px-2 rounded-md border border-border bg-background text-sm"
            value={draft.action}
            onChange={(e) => setDraft((d) => ({ ...d, action: e.target.value }))}
          >
            <option value="">전체</option>
            <option value="CREATE">생성</option>
            <option value="UPDATE">수정</option>
            <option value="DELETE">삭제</option>
            <option value="BULK_UPLOAD">엑셀 업로드</option>
            <option value="LOGIN">로그인</option>
            <option value="LOGIN_FAILED">로그인 실패</option>
            <option value="LOGOUT">로그아웃</option>
            <option value="PASSWORD_CHANGE">비밀번호 변경</option>
            <option value="PASSWORD_RESET">비밀번호 재설정</option>
            <option value="PERM_CHANGE">권한 변경</option>
          </select>
        </Field>
        <Field label="출처">
          <select
            className="w-full h-9 px-2 rounded-md border border-border bg-background text-sm"
            value={draft.source}
            onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value }))}
          >
            <option value="">전체</option>
            <option value="API">직접 편집</option>
            <option value="APPROVAL">승인 반영</option>
            <option value="EXCEL_UPLOAD">엑셀 업로드</option>
            <option value="AUTH">본인 인증</option>
            <option value="ADMIN">관리자 콘솔</option>
          </select>
        </Field>
        <Field label="행위자(사번)">
          <input
            className="w-full h-9 px-2 rounded-md border border-border bg-background text-sm"
            placeholder="부분 일치"
            value={draft.actorId}
            onChange={(e) => setDraft((d) => ({ ...d, actorId: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
          />
        </Field>
        <Field label="대상 ID">
          <input
            className="w-full h-9 px-2 rounded-md border border-border bg-background text-sm"
            placeholder="TMPLT_ID"
            value={draft.entityId}
            onChange={(e) => setDraft((d) => ({ ...d, entityId: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
          />
        </Field>
        <Field label="기간(부터)">
          <input
            type="date"
            className="w-full h-9 px-2 rounded-md border border-border bg-background text-sm"
            value={draft.from}
            onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
          />
        </Field>
        <Field label="기간(까지)">
          <input
            type="date"
            className="w-full h-9 px-2 rounded-md border border-border bg-background text-sm"
            value={draft.to}
            onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
          />
        </Field>
        <div className="col-span-2 md:col-span-3 xl:col-span-6 flex gap-2 justify-end">
          <button
            onClick={resetSearch}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-xs font-bold text-secondary hover:bg-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" /> 초기화
          </button>
          <button
            onClick={applySearch}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:opacity-90"
          >
            <Search className="h-3.5 w-3.5" /> 검색
          </button>
        </div>
      </div>

      {/* 결과 */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-sm text-destructive">{error}</div>
        ) : loading ? (
          <div className="p-8 text-center text-sm text-secondary">불러오는 중…</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            변경 이력이 없습니다.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-2xs uppercase tracking-wider text-secondary">
                <th className="w-8" />
                <th className="text-left font-bold px-3 py-2.5">시각</th>
                <th className="text-left font-bold px-3 py-2.5">작업</th>
                <th className="text-left font-bold px-3 py-2.5">출처</th>
                <th className="text-left font-bold px-3 py-2.5">대상</th>
                <th className="text-left font-bold px-3 py-2.5">행위자</th>
                <th className="text-left font-bold px-3 py-2.5">요약</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const open = expanded.has(log.auditId);
                const hasChanges = !!log.changes && log.changes.length > 0;
                return (
                  <FragmentRow
                    key={log.auditId}
                    log={log}
                    open={open}
                    hasChanges={hasChanges}
                    onToggle={() => toggle(log.auditId)}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이징 */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-xs text-secondary">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total.toLocaleString()}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="h-8 px-3 rounded-md border border-border font-bold disabled:opacity-40 hover:bg-muted"
            >
              이전
            </button>
            <span className="h-8 px-3 inline-flex items-center font-bold">
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 px-3 rounded-md border border-border font-bold disabled:opacity-40 hover:bg-muted"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FragmentRow({
  log,
  open,
  hasChanges,
  onToggle,
}: {
  log: AuditLog;
  open: boolean;
  hasChanges: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={`border-t border-border ${hasChanges ? 'cursor-pointer hover:bg-muted/30' : ''}`}
        onClick={hasChanges ? onToggle : undefined}
      >
        <td className="text-center text-muted-foreground">
          {hasChanges ? (
            open ? (
              <ChevronDown className="h-4 w-4 inline" />
            ) : (
              <ChevronRight className="h-4 w-4 inline" />
            )
          ) : null}
        </td>
        <td className="px-3 py-2.5 font-mono text-2xs whitespace-nowrap text-foreground">
          {fmtTime(log.createdAt)}
        </td>
        <td className="px-3 py-2.5">
          <Badge className={`${ACTION_CLASS[log.action]} rounded-md text-2xs font-bold`}>
            {ACTION_LABEL[log.action]}
          </Badge>
        </td>
        <td className="px-3 py-2.5 text-2xs font-semibold text-secondary">
          {SOURCE_LABEL[log.source]}
        </td>
        <td className="px-3 py-2.5 font-mono text-2xs">{log.entityId ?? '–'}</td>
        <td className="px-3 py-2.5 font-mono text-2xs">{log.actorId}</td>
        <td className="px-3 py-2.5 text-xs text-foreground/90">
          {log.summary ?? '–'}
          {hasChanges && (
            <span className="ml-2 text-2xs text-muted-foreground">
              ({log.changes!.length}건)
            </span>
          )}
        </td>
      </tr>
      {open && hasChanges && (
        <tr className="bg-muted/20 border-t border-border">
          <td />
          <td colSpan={6} className="px-3 py-3">
            <div className="space-y-1.5">
              {log.changes!.map((c, i) => (
                <div
                  key={`${c.column}-${i}`}
                  className="grid grid-cols-[160px_1fr] gap-2 text-xs items-start"
                >
                  <span className="font-bold text-secondary">{colLabel(c.column)}</span>
                  <span className="font-mono break-words">
                    <span className="text-destructive/80 line-through">
                      {c.before || '∅'}
                    </span>
                    <span className="mx-1.5 text-muted-foreground">→</span>
                    <span className="text-success">{c.after || '∅'}</span>
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-2xs font-bold text-secondary uppercase tracking-wider">
        {label}
      </span>
      {children}
    </label>
  );
}

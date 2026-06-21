import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditAction,
  AuditLogEntity,
  AuditSource,
} from './entities/audit-log.entity';

/** 필드 단위 변경 한 건. */
export interface AuditFieldChange {
  column: string;
  before: string | null;
  after: string | null;
}

/** 호출자(쓰기 경로)가 넘기는 행위자/출처 컨텍스트. */
export interface AuditContext {
  actorId: string;
  source: AuditSource;
}

/** 감사 로그 조회 필터. */
export interface AuditQuery {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  action?: string;
  source?: string;
  /** ISO 날짜/일시 문자열. */
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

/** 조회 응답용 뷰(changes 는 파싱된 배열). */
export interface AuditView {
  auditId: number;
  entityType: string;
  entityId: string | null;
  action: AuditAction;
  actorId: string;
  source: AuditSource;
  changes: AuditFieldChange[] | null;
  summary: string | null;
  createdAt: Date;
}

export interface RecordParams {
  entityType: string;
  entityId: string | number | null;
  action: AuditAction;
  ctx: AuditContext;
  changes?: AuditFieldChange[];
  summary?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  /**
   * 감사 로그 기록. **베스트 에포트** — 기록 실패가 본 작업을 실패시키지 않도록
   * 내부에서 예외를 삼키고 경고만 남긴다.
   */
  async record(params: RecordParams): Promise<void> {
    try {
      await this.repo.save(
        this.repo.create({
          entityType: params.entityType,
          entityId:
            params.entityId === null || params.entityId === undefined
              ? null
              : String(params.entityId),
          action: params.action,
          actorId: params.ctx.actorId,
          source: params.ctx.source,
          changes:
            params.changes && params.changes.length
              ? JSON.stringify(params.changes)
              : null,
          summary: params.summary ?? null,
        }),
      );
    } catch (err) {
      this.logger.warn(
        `감사 로그 기록 실패 (${params.entityType}#${String(params.entityId)} ${params.action}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /** 필터/페이징 조회. 최신순. (rows + 전체 건수) */
  async list(
    q: AuditQuery = {},
  ): Promise<{ rows: AuditView[]; total: number }> {
    const limit = Math.min(Math.max(Number(q.limit) || 50, 1), 200);
    const offset = Math.max(Number(q.offset) || 0, 0);

    const qb = this.repo.createQueryBuilder('a');
    if (q.entityType) qb.andWhere('a.entityType = :et', { et: q.entityType });
    if (q.entityId) qb.andWhere('a.entityId = :eid', { eid: q.entityId });
    if (q.action) qb.andWhere('a.action = :act', { act: q.action });
    if (q.source) qb.andWhere('a.source = :src', { src: q.source });
    if (q.actorId) {
      qb.andWhere('LOWER(a.actorId) LIKE :actor', {
        actor: `%${q.actorId.toLowerCase()}%`,
      });
    }
    const from = q.from ? new Date(q.from) : null;
    const to = q.to ? new Date(q.to) : null;
    if (from && !isNaN(from.getTime())) {
      qb.andWhere('a.createdAt >= :from', { from });
    }
    if (to && !isNaN(to.getTime())) {
      qb.andWhere('a.createdAt <= :to', { to });
    }

    qb.orderBy('a.createdAt', 'DESC')
      .addOrderBy('a.auditId', 'DESC')
      .take(limit)
      .skip(offset);

    const [rows, total] = await qb.getManyAndCount();
    return { rows: rows.map((r) => this.toView(r)), total };
  }

  private toView(r: AuditLogEntity): AuditView {
    let changes: AuditFieldChange[] | null = null;
    if (r.changes) {
      try {
        changes = JSON.parse(r.changes) as AuditFieldChange[];
      } catch {
        changes = null;
      }
    }
    return {
      auditId: r.auditId,
      entityType: r.entityType,
      entityId: r.entityId,
      action: r.action,
      actorId: r.actorId,
      source: r.source,
      changes,
      summary: r.summary,
      createdAt: r.createdAt,
    };
  }
}

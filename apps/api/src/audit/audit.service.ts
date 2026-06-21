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
}

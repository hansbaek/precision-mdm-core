import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserEntity } from '../auth/entities/user.entity';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { RoleMenuPermEntity } from '../permissions/entities/role-menu-perm.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { CreateStdTestItemDto } from '../template/dto/create-std-test-item.dto';
import { UpdateStdTestItemDto } from '../template/dto/update-std-test-item.dto';
import { TemplateService } from '../template/template.service';
import {
  ChangeOperation,
  ChangeRequestEntity,
  ChangeRequestStatus,
} from './entities/change-request.entity';

/** 승인 워크플로가 적용되는 메뉴(시험항목 기준정보). */
export const STD_MENU = 'test-master.dashboard';

export interface SubmitResult {
  /** true = 즉시 반영(승인권자), false = 승인 대기 등록. */
  applied: boolean;
  crId?: number;
  result?: unknown;
}

export interface ChangeRequestView {
  crId: number;
  operation: ChangeOperation;
  targetId: number | null;
  summary: string | null;
  payload: unknown;
  requesterId: string;
  status: ChangeRequestStatus;
  reviewerId: string | null;
  reviewComment: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}

@Injectable()
export class ChangeRequestsService {
  constructor(
    @InjectRepository(ChangeRequestEntity)
    private readonly crRepo: Repository<ChangeRequestEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(RoleMenuPermEntity)
    private readonly permRepo: Repository<RoleMenuPermEntity>,
    private readonly permissions: PermissionsService,
    private readonly notifications: NotificationsService,
    @Inject(forwardRef(() => TemplateService))
    private readonly template: TemplateService,
  ) {}

  /**
   * 시험항목 변경 제출. 승인권자면 즉시 반영, 아니면 승인 대기로 등록하고
   * 승인권자들에게 알림을 보낸다.
   */
  async submitStdChange(
    user: JwtUser,
    input: {
      operation: ChangeOperation;
      targetId?: number | null;
      payload?: CreateStdTestItemDto | UpdateStdTestItemDto | null;
      summary: string;
    },
  ): Promise<SubmitResult> {
    const canApprove = await this.permissions.can(
      user.role,
      STD_MENU,
      'approve',
    );
    if (canApprove) {
      const result = await this.applyStd(
        input.operation,
        input.targetId ?? null,
        input.payload ?? null,
      );
      return { applied: true, result };
    }

    const cr = await this.crRepo.save(
      this.crRepo.create({
        targetType: 'STD_TEST_ITEM',
        operation: input.operation,
        targetId: input.targetId ?? null,
        payload: input.payload ? JSON.stringify(input.payload) : null,
        summary: input.summary,
        requesterId: user.userId,
        status: 'PENDING',
      }),
    );
    await this.notifyApprovers(cr);
    return { applied: false, crId: cr.crId };
  }

  /** 승인 대기 목록(승인권자용). */
  async listPending(): Promise<ChangeRequestView[]> {
    const rows = await this.crRepo.find({
      where: { status: 'PENDING' },
      order: { createdAt: 'ASC' },
    });
    return rows.map((r) => this.toView(r));
  }

  /** 내가 제출한 변경요청(요청자용). */
  async listMine(userId: string): Promise<ChangeRequestView[]> {
    const rows = await this.crRepo.find({
      where: { requesterId: userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return rows.map((r) => this.toView(r));
  }

  /** 승인 — 저장된 payload 를 실제 테이블에 반영하고 요청자에게 알림. */
  async approve(user: JwtUser, crId: number): Promise<ChangeRequestView> {
    const cr = await this.getPending(crId);
    await this.applyStd(
      cr.operation,
      cr.targetId,
      cr.payload ? (JSON.parse(cr.payload) as CreateStdTestItemDto) : null,
    );
    cr.status = 'APPROVED';
    cr.reviewerId = user.userId;
    cr.reviewedAt = new Date();
    const saved = await this.crRepo.save(cr);

    await this.notifications.create({
      recipientId: cr.requesterId,
      type: 'CHANGE_REQUEST_APPROVED',
      message: `변경요청이 승인되었습니다: ${cr.summary ?? cr.operation}`,
      link: `change-request:${cr.crId}`,
    });
    return this.toView(saved);
  }

  /** 반려 — 적용하지 않고 상태만 변경, 요청자에게 사유와 함께 알림. */
  async reject(
    user: JwtUser,
    crId: number,
    comment?: string,
  ): Promise<ChangeRequestView> {
    const cr = await this.getPending(crId);
    cr.status = 'REJECTED';
    cr.reviewerId = user.userId;
    cr.reviewComment = comment ?? null;
    cr.reviewedAt = new Date();
    const saved = await this.crRepo.save(cr);

    await this.notifications.create({
      recipientId: cr.requesterId,
      type: 'CHANGE_REQUEST_REJECTED',
      message: comment
        ? `변경요청이 반려되었습니다: ${comment}`
        : `변경요청이 반려되었습니다: ${cr.summary ?? cr.operation}`,
      link: `change-request:${cr.crId}`,
    });
    return this.toView(saved);
  }

  // ---------- 내부 ----------

  private async getPending(crId: number): Promise<ChangeRequestEntity> {
    const cr = await this.crRepo.findOne({ where: { crId } });
    if (!cr) throw new NotFoundException('변경요청을 찾을 수 없습니다.');
    if (cr.status !== 'PENDING') {
      throw new ConflictException('이미 처리된 변경요청입니다.');
    }
    return cr;
  }

  private applyStd(
    operation: ChangeOperation,
    targetId: number | null,
    payload: CreateStdTestItemDto | UpdateStdTestItemDto | null,
  ): Promise<unknown> {
    switch (operation) {
      case 'CREATE':
        return this.template.createStdTestItem(payload as CreateStdTestItemDto);
      case 'UPDATE':
        if (targetId == null) {
          throw new ForbiddenException('수정 대상 ID가 없습니다.');
        }
        return this.template.updateStdTestItem(
          targetId,
          (payload ?? {}) as UpdateStdTestItemDto,
        );
      case 'DELETE':
        if (targetId == null) {
          throw new ForbiddenException('삭제 대상 ID가 없습니다.');
        }
        return this.template.deleteStdTestItem(targetId);
    }
  }

  private async notifyApprovers(cr: ChangeRequestEntity): Promise<void> {
    const recipients = (await this.findApproverUserIds()).filter(
      (id) => id !== cr.requesterId,
    );
    await this.notifications.createMany(recipients, {
      type: 'CHANGE_REQUEST_SUBMITTED',
      message: `새 변경요청 대기: ${cr.summary ?? cr.operation}`,
      link: `change-request:${cr.crId}`,
    });
  }

  /** 시험항목 메뉴에 승인 권한이 있는 활성 사용자 ID 목록. */
  private async findApproverUserIds(): Promise<string[]> {
    const perms = await this.permRepo.find({
      where: { menuId: STD_MENU, canApproveYn: 'Y' },
    });
    const roleIds = perms.map((p) => p.roleId);
    if (roleIds.length === 0) return [];
    const users = await this.userRepo.find({
      where: { roleId: In(roleIds), useYn: 'Y' },
    });
    return users.map((u) => u.userId);
  }

  private toView(r: ChangeRequestEntity): ChangeRequestView {
    return {
      crId: r.crId,
      operation: r.operation,
      targetId: r.targetId,
      summary: r.summary,
      payload: r.payload ? JSON.parse(r.payload) : null,
      requesterId: r.requesterId,
      status: r.status,
      reviewerId: r.reviewerId,
      reviewComment: r.reviewComment,
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt,
    };
  }
}

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../auth/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { RoleMenuPermEntity } from '../permissions/entities/role-menu-perm.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { TemplateService } from '../template/template.service';
import { ChangeRequestsService, STD_MENU } from './change-requests.service';
import { ChangeRequestEntity } from './entities/change-request.entity';

const USER: JwtUser = { userId: 'u-req', role: 'EDITOR' };
const APPROVER: JwtUser = { userId: 'u-app', role: 'ADMIN' };

describe('ChangeRequestsService', () => {
  let service: ChangeRequestsService;
  let crRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let userRepo: { find: jest.Mock };
  let permRepo: { find: jest.Mock };
  let permissions: { can: jest.Mock };
  let notifications: { create: jest.Mock; createMany: jest.Mock };
  let template: {
    createStdTestItem: jest.Mock;
    updateStdTestItem: jest.Mock;
    deleteStdTestItem: jest.Mock;
    rowContentHash: jest.Mock;
  };

  beforeEach(() => {
    crRepo = {
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ crId: 100, ...x })),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    userRepo = { find: jest.fn() };
    permRepo = { find: jest.fn() };
    permissions = { can: jest.fn() };
    notifications = { create: jest.fn(), createMany: jest.fn() };
    template = {
      createStdTestItem: jest.fn().mockResolvedValue({ id: 1 }),
      updateStdTestItem: jest.fn().mockResolvedValue({ id: 2 }),
      deleteStdTestItem: jest.fn().mockResolvedValue({ deleted: true }),
      // 기본: 대상 행이 제출 시점과 동일(해시 일치) — 승인 통과.
      rowContentHash: jest.fn().mockResolvedValue('basehash'),
    };

    service = new ChangeRequestsService(
      crRepo as unknown as Repository<ChangeRequestEntity>,
      userRepo as unknown as Repository<UserEntity>,
      permRepo as unknown as Repository<RoleMenuPermEntity>,
      permissions as unknown as PermissionsService,
      notifications as unknown as NotificationsService,
      template as unknown as TemplateService,
    );
  });

  describe('submitStdChange', () => {
    it('승인권자는 즉시 반영하고 변경요청을 적재하지 않는다', async () => {
      permissions.can.mockResolvedValue(true);

      const result = await service.submitStdChange(APPROVER, {
        operation: 'CREATE',
        payload: { productLine: 'PCR' } as never,
        summary: '신규',
      });

      expect(permissions.can).toHaveBeenCalledWith(
        APPROVER.role,
        STD_MENU,
        'approve',
      );
      expect(result.applied).toBe(true);
      expect(template.createStdTestItem).toHaveBeenCalled();
      expect(crRepo.save).not.toHaveBeenCalled();
      expect(notifications.createMany).not.toHaveBeenCalled();
    });

    it('비승인권자는 PENDING 으로 적재하고 승인권자에게 알린다', async () => {
      permissions.can.mockResolvedValue(false);
      // 승인권자 역할 1개 → 사용자 2명(요청자 본인 포함)
      permRepo.find.mockResolvedValue([{ roleId: 'ADMIN' }]);
      userRepo.find.mockResolvedValue([
        { userId: 'u-app' },
        { userId: 'u-req' }, // 요청자 본인은 알림에서 제외돼야 함
      ]);

      const result = await service.submitStdChange(USER, {
        operation: 'UPDATE',
        targetId: 5,
        payload: { testItemName: 'X' } as never,
        summary: '수정',
      });

      expect(result.applied).toBe(false);
      expect(result.crId).toBe(100);
      expect(template.updateStdTestItem).not.toHaveBeenCalled();
      expect(crRepo.save).toHaveBeenCalled();
      // 본인 제외 → u-app 에게만
      expect(notifications.createMany).toHaveBeenCalledWith(
        ['u-app'],
        expect.objectContaining({ type: 'CHANGE_REQUEST_SUBMITTED' }),
      );
    });
  });

  describe('approve', () => {
    it('payload 를 적용하고 상태/검토자 갱신 후 요청자에게 알린다', async () => {
      crRepo.findOne.mockResolvedValue({
        crId: 7,
        operation: 'UPDATE',
        targetId: 9,
        payload: JSON.stringify({ testItemName: 'Y' }),
        requesterId: 'u-req',
        status: 'PENDING',
        summary: '수정요청',
      });

      const view = await service.approve(APPROVER, 7);

      expect(template.updateStdTestItem).toHaveBeenCalledWith(
        9,
        { testItemName: 'Y' },
        { actorId: 'u-app', source: 'APPROVAL' },
      );
      expect(view.status).toBe('APPROVED');
      expect(view.reviewerId).toBe('u-app');
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: 'u-req',
          type: 'CHANGE_REQUEST_APPROVED',
        }),
      );
    });
  });

  describe('reject', () => {
    it('적용하지 않고 사유와 함께 요청자에게 알린다', async () => {
      crRepo.findOne.mockResolvedValue({
        crId: 8,
        operation: 'DELETE',
        targetId: 3,
        payload: null,
        requesterId: 'u-req',
        status: 'PENDING',
        summary: '삭제요청',
      });

      const view = await service.reject(APPROVER, 8, '근거 부족');

      expect(template.deleteStdTestItem).not.toHaveBeenCalled();
      expect(view.status).toBe('REJECTED');
      expect(view.reviewComment).toBe('근거 부족');
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: 'u-req',
          type: 'CHANGE_REQUEST_REJECTED',
        }),
      );
    });
  });

  describe('getPending (approve/reject 공통 가드)', () => {
    it('존재하지 않는 요청은 NotFound', async () => {
      crRepo.findOne.mockResolvedValue(null);
      await expect(service.approve(APPROVER, 999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('이미 처리된 요청은 Conflict', async () => {
      crRepo.findOne.mockResolvedValue({ crId: 1, status: 'APPROVED' });
      await expect(service.reject(APPROVER, 1)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('승인 동시성(stale) 가드', () => {
    const pendingUpdate = {
      crId: 7,
      operation: 'UPDATE',
      targetId: 9,
      payload: JSON.stringify({ testItemName: 'Y' }),
      requesterId: 'u-req',
      status: 'PENDING',
      summary: '수정요청',
      baseHash: 'basehash',
    };

    it('제출 이후 대상이 변경되면 승인 차단(409), 적용 안 함', async () => {
      crRepo.findOne.mockResolvedValue({ ...pendingUpdate });
      template.rowContentHash.mockResolvedValue('CHANGED'); // 해시 불일치

      await expect(service.approve(APPROVER, 7)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(template.updateStdTestItem).not.toHaveBeenCalled();
    });

    it('대상이 이미 삭제되었으면 승인 차단(409)', async () => {
      crRepo.findOne.mockResolvedValue({ ...pendingUpdate });
      template.rowContentHash.mockResolvedValue(null); // 행 없음

      await expect(service.approve(APPROVER, 7)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(template.updateStdTestItem).not.toHaveBeenCalled();
    });

    it('해시가 일치하면 정상 승인된다', async () => {
      crRepo.findOne.mockResolvedValue({ ...pendingUpdate });
      template.rowContentHash.mockResolvedValue('basehash'); // 일치

      const view = await service.approve(APPROVER, 7);
      expect(template.updateStdTestItem).toHaveBeenCalled();
      expect(view.status).toBe('APPROVED');
    });

    it('비승인권자 UPDATE 제출 시 대상 해시를 저장한다', async () => {
      permissions.can.mockResolvedValue(false);
      permRepo.find.mockResolvedValue([]);
      userRepo.find.mockResolvedValue([]);
      template.rowContentHash.mockResolvedValue('h-at-submit');

      await service.submitStdChange(USER, {
        operation: 'UPDATE',
        targetId: 5,
        payload: { testItemName: 'X' } as never,
        summary: '수정',
      });

      expect(template.rowContentHash).toHaveBeenCalledWith(5);
      expect(crRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ baseHash: 'h-at-submit' }),
      );
    });

    it('listPending 은 변경된 대상을 stale 로 표시한다', async () => {
      crRepo.find.mockResolvedValue([{ ...pendingUpdate }]);
      template.rowContentHash.mockResolvedValue('CHANGED');

      const [view] = await service.listPending();
      expect(view.stale).toBe(true);
    });
  });
});

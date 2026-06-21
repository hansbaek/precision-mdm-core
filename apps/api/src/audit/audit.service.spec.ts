import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditLogEntity } from './entities/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;
  let repo: { create: jest.Mock; save: jest.Mock };

  beforeEach(() => {
    repo = { create: jest.fn((x) => x), save: jest.fn().mockResolvedValue({}) };
    service = new AuditService(repo as unknown as Repository<AuditLogEntity>);
  });

  it('변경 내역을 JSON 으로 직렬화하고 entityId 를 문자열화한다', async () => {
    await service.record({
      entityType: 'STD_TEST_ITEM',
      entityId: 42,
      action: 'UPDATE',
      ctx: { actorId: 'u1', source: 'API' },
      changes: [{ column: 'testItemName', before: 'A', after: 'B' }],
      summary: '수정',
    });
    const saved = repo.save.mock.calls[0][0];
    expect(saved.entityId).toBe('42');
    expect(saved.actorId).toBe('u1');
    expect(saved.source).toBe('API');
    expect(JSON.parse(saved.changes as string)).toEqual([
      { column: 'testItemName', before: 'A', after: 'B' },
    ]);
  });

  it('변경 내역이 비면 changes 는 null', async () => {
    await service.record({
      entityType: 'STD_TEST_ITEM',
      entityId: null,
      action: 'DELETE',
      ctx: { actorId: 'u1', source: 'APPROVAL' },
      changes: [],
    });
    const saved = repo.save.mock.calls[0][0];
    expect(saved.changes).toBeNull();
    expect(saved.entityId).toBeNull();
  });

  it('기록 실패는 삼켜서 본 작업을 막지 않는다(베스트 에포트)', async () => {
    repo.save.mockRejectedValue(new Error('DB down'));
    await expect(
      service.record({
        entityType: 'STD_TEST_ITEM',
        entityId: 1,
        action: 'CREATE',
        ctx: { actorId: 'u1', source: 'API' },
      }),
    ).resolves.toBeUndefined();
  });
});

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { RefreshTokensService } from './refresh-tokens.service';

describe('RefreshTokensService', () => {
  let service: RefreshTokensService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  const config = {
    get: () => '14d',
  } as unknown as ConfigService;

  /** secret 과 일치하는 해시를 가진 저장행을 만든다. */
  async function row(
    overrides: Partial<RefreshTokenEntity> & { secret: string },
  ): Promise<RefreshTokenEntity> {
    const { secret, ...rest } = overrides;
    return {
      tokenId: 'tid-1',
      userId: 'u1',
      tokenHash: await bcrypt.hash(secret, 10),
      expiresAt: new Date(Date.now() + 60_000),
      revokedYn: 'N',
      rotatedTo: null,
      userAgent: null,
      createdAt: new Date(),
      ...rest,
    } as RefreshTokenEntity;
  }

  beforeEach(() => {
    repo = {
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve(x)),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    service = new RefreshTokensService(
      repo as unknown as Repository<RefreshTokenEntity>,
      config,
    );
  });

  describe('issue', () => {
    it('`tokenId.secret` 형식 토큰을 발급하고 해시만 저장한다', async () => {
      const issued = await service.issue('u1', 'agent');
      expect(issued.token).toMatch(/^[a-f0-9]{32}\.[a-f0-9]{64}$/);
      expect(issued.expiresAt.getTime()).toBeGreaterThan(Date.now());
      const saved = repo.save.mock.calls[0][0];
      // 원문 secret 은 저장되지 않는다.
      expect(saved.tokenHash).not.toContain(issued.token.split('.')[1]);
      expect(saved.userId).toBe('u1');
    });
  });

  describe('rotate', () => {
    it('유효한 토큰은 회전된다: 기존 폐기 + 신규 발급', async () => {
      const secret = 'a'.repeat(64);
      repo.findOne.mockResolvedValue(await row({ secret, tokenId: 'old' }));

      const res = await service.rotate(`old.${secret}`, 'agent');

      expect(res.userId).toBe('u1');
      expect(res.refresh.token).toMatch(/^[a-f0-9]{32}\.[a-f0-9]{64}$/);
      // 마지막 save 는 기존 행 폐기(rotatedTo 연결).
      const lastSaved = repo.save.mock.calls.at(-1)![0];
      expect(lastSaved.revokedYn).toBe('Y');
      expect(lastSaved.rotatedTo).toBe(res.refresh.token.split('.')[0]);
    });

    it('이미 폐기된 토큰 재사용 → 전체 폐기 + 401', async () => {
      const secret = 'b'.repeat(64);
      repo.findOne.mockResolvedValue(
        await row({ secret, tokenId: 'old', revokedYn: 'Y' }),
      );

      await expect(service.rotate(`old.${secret}`)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      // revokeAllForUser
      expect(repo.update).toHaveBeenCalledWith(
        { userId: 'u1', revokedYn: 'N' },
        { revokedYn: 'Y' },
      );
    });

    it('만료된 토큰 → 401, 신규 발급 없음', async () => {
      const secret = 'c'.repeat(64);
      repo.findOne.mockResolvedValue(
        await row({ secret, expiresAt: new Date(Date.now() - 1000) }),
      );
      await expect(service.rotate(`tid-1.${secret}`)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('secret 불일치 → 401', async () => {
      repo.findOne.mockResolvedValue(await row({ secret: 'right'.repeat(13) }));
      await expect(service.rotate('tid-1.wrongsecret')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('형식 오류(점 없음) → 401', async () => {
      await expect(service.rotate('no-dot-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(repo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('revoke', () => {
    it('제출된 tokenId 를 폐기한다', async () => {
      await service.revoke('tid-9.somesecret');
      expect(repo.update).toHaveBeenCalledWith(
        { tokenId: 'tid-9' },
        { revokedYn: 'Y' },
      );
    });
  });
});

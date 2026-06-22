import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { LessThan, Repository } from 'typeorm';
import { RefreshTokenEntity } from './entities/refresh-token.entity';

export interface IssuedRefreshToken {
  /** 클라이언트 보관용 원문 토큰: `${tokenId}.${secret}` */
  token: string;
  expiresAt: Date;
}

/** `14d` / `12h` / `30m` / `3600s` → ms. 형식 불명 시 기본 14일. */
function parseDurationMs(value: string | undefined): number {
  const DAY = 24 * 60 * 60 * 1000;
  if (!value) return 14 * DAY;
  const m = value.trim().match(/^(\d+)\s*([dhms])$/i);
  if (!m) return 14 * DAY;
  const n = Number(m[1]);
  switch (m[2].toLowerCase()) {
    case 'd':
      return n * DAY;
    case 'h':
      return n * 60 * 60 * 1000;
    case 'm':
      return n * 60 * 1000;
    default:
      return n * 1000;
  }
}

@Injectable()
export class RefreshTokensService {
  private readonly ttlMs: number;

  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly repo: Repository<RefreshTokenEntity>,
    config: ConfigService,
  ) {
    this.ttlMs = parseDurationMs(config.get<string>('JWT_REFRESH_EXPIRES_IN'));
  }

  /** 새 리프레시 토큰 발급(저장). 원문은 한 번만 반환되며 서버엔 해시만 남는다. */
  async issue(userId: string, userAgent?: string): Promise<IssuedRefreshToken> {
    const tokenId = randomBytes(16).toString('hex');
    const secret = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.ttlMs);

    await this.repo.save(
      this.repo.create({
        tokenId,
        userId,
        tokenHash: await bcrypt.hash(secret, 10),
        expiresAt,
        revokedYn: 'N',
        rotatedTo: null,
        userAgent: userAgent?.slice(0, 300) ?? null,
      }),
    );

    return { token: `${tokenId}.${secret}`, expiresAt };
  }

  /**
   * 제출된 토큰을 검증하고 로테이션한다. 성공 시 기존 토큰을 폐기하고 새 토큰을
   * 발급해 사용자 ID 와 함께 반환한다. 실패는 모두 401.
   *
   * 재사용 탐지: 이미 폐기된 토큰이 다시 제출되면(탈취/리플레이 의심) 해당
   * 사용자의 모든 토큰을 폐기한다.
   */
  async rotate(
    presented: string,
    userAgent?: string,
  ): Promise<{ userId: string; refresh: IssuedRefreshToken }> {
    const row = await this.lookup(presented);

    if (row.revokedYn === 'Y') {
      // 이미 폐기된 토큰 재사용 → 보안 사고로 간주, 전체 폐기.
      await this.revokeAllForUser(row.userId);
      throw new UnauthorizedException('리프레시 토큰이 무효화되었습니다.');
    }
    if (row.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('리프레시 토큰이 만료되었습니다.');
    }

    const refresh = await this.issue(row.userId, userAgent);
    row.revokedYn = 'Y';
    row.rotatedTo = refresh.token.split('.')[0];
    await this.repo.save(row);

    return { userId: row.userId, refresh };
  }

  /**
   * 로그아웃: 제출된 토큰을 폐기(존재하지 않아도 조용히 통과).
   * @returns 폐기된 토큰의 사용자 ID(감사 기록용). 토큰이 없으면 null.
   */
  async revoke(presented: string): Promise<string | null> {
    const [tokenId] = presented.split('.');
    if (!tokenId) return null;
    const row = await this.repo.findOne({ where: { tokenId } });
    if (!row) return null;
    await this.repo.update({ tokenId }, { revokedYn: 'Y' });
    return row.userId;
  }

  /** 사용자의 모든 토큰 폐기(관리자 강제 로그아웃 / 재사용 탐지 시). */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.repo.update({ userId, revokedYn: 'N' }, { revokedYn: 'Y' });
  }

  /** 만료된 토큰 정리(베스트 에포트). */
  async purgeExpired(): Promise<void> {
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }

  /** 토큰 원문 → 검증된 행. secret 불일치/미존재는 401. */
  private async lookup(presented: string): Promise<RefreshTokenEntity> {
    const [tokenId, secret] = presented.split('.');
    if (!tokenId || !secret) {
      throw new UnauthorizedException(
        '리프레시 토큰 형식이 올바르지 않습니다.',
      );
    }
    const row = await this.repo.findOne({ where: { tokenId } });
    if (!row || !(await bcrypt.compare(secret, row.tokenHash))) {
      throw new UnauthorizedException('리프레시 토큰을 찾을 수 없습니다.');
    }
    return row;
  }
}

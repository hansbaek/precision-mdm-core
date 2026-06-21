import { Logger } from '@nestjs/common';
import type { DataSource } from 'typeorm';

export type MigrationGuardMode = 'strict' | 'warn' | 'off';

/** 가드가 필요로 하는 로깅 최소 인터페이스(테스트 주입용). */
export interface GuardLogger {
  log(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

/** 가드가 필요로 하는 DataSource 최소 인터페이스. */
export type MigrationCheckable = Pick<DataSource, 'showMigrations'>;

/**
 * MIGRATION_GUARD 환경값을 모드로 해석한다. 유효하지 않거나 미설정이면
 * 운영은 strict(중단), 그 외는 warn(경고 후 계속)으로 안전하게 기본값을 둔다.
 */
export function resolveMigrationGuardMode(
  raw: string | undefined,
  isProduction: boolean,
): MigrationGuardMode {
  if (raw === 'strict' || raw === 'warn' || raw === 'off') return raw;
  return isProduction ? 'strict' : 'warn';
}

const RUN_HINT = '적용: cd apps/api && pnpm migration:run';

/**
 * 부팅 시 미적용(pending) 마이그레이션을 점검한다.
 *
 * 런타임은 마이그레이션을 자동 적용하지 않으므로(database.config.ts), 코드만
 * 배포하고 migration:run 을 누락하면 DB 스키마가 코드와 어긋나 '특정 쓰기만
 * 조용히 실패'하는 사고가 난다. 이 가드는 그 상태를 부팅 시점에 드러낸다.
 *
 * @returns 부팅을 중단해야 하면 true (strict 모드에서 미적용 감지/점검 실패).
 */
export async function checkPendingMigrations(
  dataSource: MigrationCheckable,
  mode: MigrationGuardMode,
  logger: GuardLogger = new Logger('MigrationGuard'),
): Promise<boolean> {
  if (mode === 'off') {
    logger.warn('마이그레이션 가드 비활성화(MIGRATION_GUARD=off).');
    return false;
  }

  let pending: boolean;
  try {
    pending = await dataSource.showMigrations();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (mode === 'strict') {
      logger.error(`마이그레이션 상태 확인 실패 — 부팅을 중단합니다: ${msg}`);
      return true;
    }
    logger.warn(`마이그레이션 상태 확인 실패(계속): ${msg}`);
    return false;
  }

  if (!pending) {
    logger.log('DB 마이그레이션 최신 상태 — 미적용 없음.');
    return false;
  }

  if (mode === 'strict') {
    logger.error(
      `미적용 마이그레이션 감지 — 부팅을 중단합니다. DB 스키마가 코드와 ` +
        `불일치 상태입니다. ${RUN_HINT}`,
    );
    return true;
  }

  logger.warn(
    `미적용 마이그레이션 감지(계속). 일부 쓰기가 실패할 수 있습니다. ${RUN_HINT}`,
  );
  return false;
}

import {
  checkPendingMigrations,
  resolveMigrationGuardMode,
  type GuardLogger,
} from './migration-guard';

const makeLogger = (): GuardLogger & {
  log: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
} => ({ log: jest.fn(), warn: jest.fn(), error: jest.fn() });

describe('resolveMigrationGuardMode', () => {
  it('명시값(strict/warn/off)을 그대로 사용한다', () => {
    expect(resolveMigrationGuardMode('strict', false)).toBe('strict');
    expect(resolveMigrationGuardMode('warn', true)).toBe('warn');
    expect(resolveMigrationGuardMode('off', true)).toBe('off');
  });

  it('미설정/무효값이면 운영=strict, 그 외=warn', () => {
    expect(resolveMigrationGuardMode(undefined, true)).toBe('strict');
    expect(resolveMigrationGuardMode(undefined, false)).toBe('warn');
    expect(resolveMigrationGuardMode('bogus', true)).toBe('strict');
    expect(resolveMigrationGuardMode('', false)).toBe('warn');
  });
});

describe('checkPendingMigrations', () => {
  it('strict + 미적용 → 중단(true) + error 로그', async () => {
    const ds = { showMigrations: jest.fn().mockResolvedValue(true) };
    const logger = makeLogger();

    const halt = await checkPendingMigrations(ds, 'strict', logger);

    expect(halt).toBe(true);
    expect(logger.error).toHaveBeenCalled();
  });

  it('strict + 최신 → 계속(false)', async () => {
    const ds = { showMigrations: jest.fn().mockResolvedValue(false) };
    const logger = makeLogger();

    const halt = await checkPendingMigrations(ds, 'strict', logger);

    expect(halt).toBe(false);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('warn + 미적용 → 계속(false) + warn 로그', async () => {
    const ds = { showMigrations: jest.fn().mockResolvedValue(true) };
    const logger = makeLogger();

    const halt = await checkPendingMigrations(ds, 'warn', logger);

    expect(halt).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('off → 점검 생략(false), showMigrations 호출 안 함', async () => {
    const ds = { showMigrations: jest.fn() };
    const logger = makeLogger();

    const halt = await checkPendingMigrations(ds, 'off', logger);

    expect(halt).toBe(false);
    expect(ds.showMigrations).not.toHaveBeenCalled();
  });

  it('strict + 점검 자체 실패 → 보수적으로 중단(true)', async () => {
    const ds = {
      showMigrations: jest.fn().mockRejectedValue(new Error('ORA-00942')),
    };
    const logger = makeLogger();

    const halt = await checkPendingMigrations(ds, 'strict', logger);

    expect(halt).toBe(true);
    expect(logger.error).toHaveBeenCalled();
  });

  it('warn + 점검 실패 → 계속(false)', async () => {
    const ds = {
      showMigrations: jest.fn().mockRejectedValue(new Error('conn refused')),
    };
    const logger = makeLogger();

    const halt = await checkPendingMigrations(ds, 'warn', logger);

    expect(halt).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });
});

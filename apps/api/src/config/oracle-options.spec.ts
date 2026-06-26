import {
  ORACLE_MIGRATIONS_TABLE,
  baseOracleOptions,
  resolveOracleConnection,
} from './oracle-options';

describe('resolveOracleConnection', () => {
  const creds = { username: 'u', password: 'p' };

  it('connectString 이 있으면 그대로 사용하고 host 류는 무시한다', () => {
    const c = resolveOracleConnection({
      ...creds,
      connectString: 'db:1521/svc',
      host: 'ignored',
      serviceName: 'ignored',
    });
    expect(c).toEqual({ ...creds, connectString: 'db:1521/svc' });
    expect('host' in c).toBe(false);
  });

  it('serviceName 이 있으면 serviceName 으로 접속한다 (sid 아님)', () => {
    const c = resolveOracleConnection({
      ...creds,
      host: 'db',
      port: 1521,
      serviceName: 'xepdb1',
      sid: 'XE',
    });
    expect(c).toEqual({
      ...creds,
      host: 'db',
      port: 1521,
      serviceName: 'xepdb1',
    });
    expect('sid' in c).toBe(false);
  });

  it('serviceName 이 없으면 sid 로 폴백한다', () => {
    const c = resolveOracleConnection({
      ...creds,
      host: 'db',
      port: 1521,
      sid: 'XE',
    });
    expect(c).toEqual({ ...creds, host: 'db', port: 1521, sid: 'XE' });
    expect('serviceName' in c).toBe(false);
  });

  it('port 미지정 시 1521 로 기본 설정한다', () => {
    const c = resolveOracleConnection({
      ...creds,
      host: 'db',
      serviceName: 's',
    });
    expect(c).toMatchObject({ port: 1521 });
  });

  it('connectString 도 host 도 없으면 예외를 던진다', () => {
    expect(() =>
      resolveOracleConnection({ ...creds, serviceName: 's' }),
    ).toThrow(/DB_HOST/);
  });
});

describe('baseOracleOptions', () => {
  it('불변 정책(type/synchronize/migrationsTableName)을 강제한다', () => {
    const o = baseOracleOptions({
      username: 'u',
      password: 'p',
      connectString: 'db:1521/svc',
    });
    expect(o.type).toBe('oracle');
    expect(o.synchronize).toBe(false);
    expect(o.migrationsTableName).toBe(ORACLE_MIGRATIONS_TABLE);
  });

  it('logging 기본값은 false 이고, 전달 시 반영한다', () => {
    expect(
      baseOracleOptions({ username: 'u', password: 'p', connectString: 'x' })
        .logging,
    ).toBe(false);
    expect(
      baseOracleOptions({
        username: 'u',
        password: 'p',
        connectString: 'x',
        logging: true,
      }).logging,
    ).toBe(true);
  });
});

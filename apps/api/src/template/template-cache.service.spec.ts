import { DataSource } from 'typeorm';
import { TemplateCacheService } from './template-cache.service';

function makeService() {
  const rows = [{ TMPLT_ID: 1 }, { TMPLT_ID: 2 }];
  const query = jest.fn().mockResolvedValue(rows);
  const dataSource = { query } as unknown as DataSource;
  return { service: new TemplateCacheService(dataSource), query, rows };
}

describe('TemplateCacheService', () => {
  afterEach(() => jest.useRealTimers());

  it('첫 조회는 DB 를 치고, 이후 조회는 캐시를 반환한다(재조회 없음)', async () => {
    const { service, query, rows } = makeService();

    expect(await service.getRows()).toBe(rows);
    expect(await service.getRows()).toBe(rows);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('invalidate 후에는 다시 DB 를 친다', async () => {
    const { service, query } = makeService();

    await service.getRows();
    service.invalidate();
    await service.getRows();
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('TTL(5분) 경과 시 재조회한다', async () => {
    jest.useFakeTimers();
    const { service, query } = makeService();

    await service.getRows();
    expect(query).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(5 * 60_000 + 1);
    await service.getRows();
    expect(query).toHaveBeenCalledTimes(2);
  });
});

import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 미사용 임시 테이블 정리.
 *
 * TMP_AUDIT_LOGS, TMP_TEST_ITEMS 는 애플리케이션 코드 어디에서도 참조되지
 * 않는다(전수 검색 확인). 베이스라인 도입과 함께 제거한다.
 *
 * down()은 의도적으로 비워 둔다. 미사용 테이블이라 복원 가치가 없고,
 * 원본 스키마/데이터도 보존 대상이 아니다.
 */
export class DropUnusedTmpTables1781913700000 implements MigrationInterface {
  name = 'DropUnusedTmpTables1781913700000';

  private readonly tables = ['TMP_AUDIT_LOGS', 'TMP_TEST_ITEMS'];

  public async up(q: QueryRunner): Promise<void> {
    for (const name of this.tables) {
      const rows: Array<{ CNT: number }> = await q.query(
        `SELECT COUNT(*) AS CNT FROM USER_TABLES WHERE TABLE_NAME = :1`,
        [name],
      );
      const cnt =
        rows?.[0]?.CNT ?? (rows?.[0] as unknown as number[])?.[0] ?? 0;
      if (Number(cnt) > 0) {
        await q.query(`DROP TABLE ${name} CASCADE CONSTRAINTS PURGE`);
      }
    }
  }

  public async down(): Promise<void> {
    // 의도적 no-op: 미사용 테이블은 복원하지 않는다.
  }
}

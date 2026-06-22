import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 감사 로그에 보안·관리 이벤트(LOGIN/PASSWORD_CHANGE/PERM_CHANGE 등)를 적재하면서
 * ACTION 값이 10자를 넘게 되어 컬럼 폭을 20자로 확장한다. (멱등)
 */
export class WidenAuditActionColumn1781914200000 implements MigrationInterface {
  name = 'WidenAuditActionColumn1781914200000';

  public async up(q: QueryRunner): Promise<void> {
    if ((await this.actionLength(q)) < 20) {
      await q.query(`ALTER TABLE TMDM_AUDIT_LOG MODIFY (ACTION VARCHAR2(20))`);
    }
  }

  public async down(q: QueryRunner): Promise<void> {
    // 되돌리기는 데이터가 10자 이내일 때만 의미가 있다(긴 값이 있으면 Oracle 이 거부).
    if ((await this.actionLength(q)) > 10) {
      await q.query(`ALTER TABLE TMDM_AUDIT_LOG MODIFY (ACTION VARCHAR2(10))`);
    }
  }

  private async actionLength(q: QueryRunner): Promise<number> {
    const rows = (await q.query(
      `SELECT CHAR_LENGTH AS LEN FROM USER_TAB_COLUMNS
       WHERE TABLE_NAME = 'TMDM_AUDIT_LOG' AND COLUMN_NAME = 'ACTION'`,
    )) as Array<{ LEN: number }>;
    return Number(rows?.[0]?.LEN ?? 0);
  }
}

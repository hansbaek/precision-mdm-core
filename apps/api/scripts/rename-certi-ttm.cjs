/**
 * TEMPLATE_STD_TEST_ITEM.CERTI_TTM → CERTI_TEST_YN 컬럼 rename (멱등).
 * 실행: node scripts/rename-certi-ttm.cjs (apps/api에서, .env 필요)
 */
const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const TABLE = 'TEMPLATE_STD_TEST_ITEM';
const OLD = 'CERTI_TTM';
const NEW = 'CERTI_TEST_YN';

(async () => {
  const conn = await oracledb.getConnection({
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    connectString: `${env.DB_HOST}:${env.DB_PORT}/${env.DB_SERVICE_NAME}`,
  });
  try {
    const colExists = async (col) => {
      const r = await conn.execute(
        'SELECT COUNT(*) FROM USER_TAB_COLUMNS WHERE TABLE_NAME = :1 AND COLUMN_NAME = :2',
        [TABLE, col],
      );
      return r.rows[0][0] > 0;
    };

    const hasNew = await colExists(NEW);
    const hasOld = await colExists(OLD);

    if (hasNew) {
      console.log(`${NEW} 이미 존재 — rename 스킵`);
    } else if (!hasOld) {
      throw new Error(`${OLD} 컬럼이 존재하지 않습니다 — 확인 필요`);
    } else {
      await conn.execute(`ALTER TABLE ${TABLE} RENAME COLUMN ${OLD} TO ${NEW}`);
      console.log(`RENAME COLUMN ${OLD} → ${NEW} 완료`);
    }

    const verify = await conn.execute(
      'SELECT COLUMN_NAME FROM USER_TAB_COLUMNS WHERE TABLE_NAME = :1 AND COLUMN_NAME IN (:2, :3)',
      [TABLE, OLD, NEW],
    );
    console.log('검증 — 현재 존재 컬럼:', verify.rows.map((r) => r[0]).join(', ') || '(없음)');
  } finally {
    await conn.close();
  }
})().catch((e) => {
  console.error('ERR:', e.message);
  process.exit(1);
});

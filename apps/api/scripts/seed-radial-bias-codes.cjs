/**
 * DW_STD_CODE 'RADIAL_BIAS' 그룹 시드 (멱등).
 * RADIAL_BIAS 필드 입력값을 R(Radial) / B(Bias) 로 제한하기 위한 옵션 소스.
 * 실행: node scripts/seed-radial-bias-codes.cjs (apps/api에서, .env 필요)
 */
const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const GRP = 'RADIAL_BIAS';
// [CODE_CD, CODE_NM, CODE_DESC, SORT_ORDER]
const CODES = [
  ['R', 'Radial (레이디얼)', '레이디얼 구조', 1],
  ['B', 'Bias (바이어스)', '바이어스 구조', 2],
];

(async () => {
  const conn = await oracledb.getConnection({
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    connectString: `${env.DB_HOST}:${env.DB_PORT}/${env.DB_SERVICE_NAME}`,
  });
  try {
    for (const [cd, nm, desc, sort] of CODES) {
      const exists = await conn.execute(
        'SELECT COUNT(*) FROM DW_STD_CODE WHERE CODE_GRP_ID = :1 AND CODE_CD = :2',
        [GRP, cd],
      );
      if (exists.rows[0][0] > 0) {
        console.log(`${GRP}/${cd}: 이미 존재 — 스킵`);
        continue;
      }
      await conn.execute(
        `INSERT INTO DW_STD_CODE (CODE_GRP_ID, CODE_CD, CODE_LVL, CODE_NM, CODE_DESC, SORT_ORDER, USE_YN)
         VALUES (:1, :2, 1, :3, :4, :5, 'Y')`,
        [GRP, cd, nm, desc, sort],
      );
      console.log(`${GRP}/${cd}: INSERT`);
    }
    await conn.commit();

    const verify = await conn.execute(
      'SELECT CODE_CD, CODE_NM, SORT_ORDER, USE_YN FROM DW_STD_CODE WHERE CODE_GRP_ID = :1 ORDER BY SORT_ORDER',
      [GRP],
    );
    console.log('검증 —', verify.rows.map((r) => `${r[0]}(${r[1]})`).join(', '));
  } finally {
    await conn.close();
  }
})().catch((e) => {
  console.error('ERR:', e.message);
  process.exit(1);
});

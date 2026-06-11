/**
 * DW_ENDUR_SVRTY_RANK / DW_REGULATION_MARKET_MAP 생성 + 시드 (멱등).
 * '[별첨11] 법규 주행시험 가혹도 순위' 기준.
 * 실행: node scripts/seed-endur-svrty.cjs (apps/api에서, .env 필요)
 */
const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

// [PRODUCT_LINE, TEST_CATEGORY, SPEED_GRADE_COND, TEST_CDN_NAME, REGULATION_CODE, SVRTY_RANK, MANDATORY_YN]
const RANK_SEED = [
  // PCR 고속내구
  ['PCR', 'HS', 'ALL', 'PS88', 'GB', 1, 'N'],
  ['PCR', 'HS', 'ALL', 'PS88', 'SNI', 1, 'N'],
  ['PCR', 'HS', 'ALL', 'PS10', 'GSO', 2, 'N'],
  ['PCR', 'HS', 'ALL', 'PS09', 'ECE', 3, 'N'],
  ['PCR', 'HS', 'ALL', 'PS09', 'NORM', 3, 'N'],
  ['PCR', 'HS', 'ALL', 'PS09', 'KS', 3, 'N'],
  ['PCR', 'HS', 'ALL', 'PS09', 'JIS', 3, 'N'],
  ['PCR', 'HS', 'ALL', 'PS09', 'BIS', 3, 'N'],
  ['PCR', 'HS', 'ALL', 'PS139', 'FMVSS', 4, 'Y'],
  ['PCR', 'HS', 'ALL', 'PS01', 'KS', 5, 'N'],
  ['PCR', 'HS', 'ALL', 'PS01', 'JIS', 5, 'N'],
  // LTR 고속내구 — 속도등급 R 이하
  ['LTR', 'HS', 'R_BELOW', 'PS139', 'FMVSS', 1, 'Y'],
  ['LTR', 'HS', 'R_BELOW', 'LS09', 'ECE', 2, 'N'],
  ['LTR', 'HS', 'R_BELOW', 'LS09', 'KS', 2, 'N'],
  ['LTR', 'HS', 'R_BELOW', 'LS09', 'JIS', 2, 'N'],
  ['LTR', 'HS', 'R_BELOW', 'LS09', 'BIS', 2, 'N'],
  ['LTR', 'HS', 'R_BELOW', 'LS19', 'BIS', 3, 'N'],
  ['LTR', 'HS', 'R_BELOW', 'LS88', 'GB', 3, 'N'],
  // LTR 고속내구 — 속도등급 S 이상
  ['LTR', 'HS', 'S_ABOVE', 'LS09', 'ECE', 1, 'N'],
  ['LTR', 'HS', 'S_ABOVE', 'LS09', 'KS', 1, 'N'],
  ['LTR', 'HS', 'S_ABOVE', 'LS09', 'JIS', 1, 'N'],
  ['LTR', 'HS', 'S_ABOVE', 'LS09', 'BIS', 1, 'N'],
  ['LTR', 'HS', 'S_ABOVE', 'LS88', 'GB', 2, 'N'],
  ['LTR', 'HS', 'S_ABOVE', 'PS139', 'FMVSS', 2, 'Y'],
  // 일반내구 (PCR/LTR 공통)
  ['ALL', 'GE', 'ALL', 'PP139', 'FMVSS', 1, 'Y'],
  ['ALL', 'GE', 'ALL', 'PL88', 'GB', 1, 'N'],
  ['ALL', 'GE', 'ALL', 'PL10', 'GSO', 2, 'N'],
  ['ALL', 'GE', 'ALL', 'PL11', 'KS', 3, 'N'],
  ['ALL', 'GE', 'ALL', 'PL11', 'JIS', 3, 'N'],
  ['ALL', 'GE', 'ALL', 'PL11', 'BIS', 3, 'N'],
  ['ALL', 'GE', 'ALL', 'PL11', 'SNI', 3, 'N'],
];

// [REGULATION_CODE, MARKET_CODE]
const MAP_SEED = [
  ['FMVSS', 'NA'],
  ['ECE', 'E1'], ['ECE', 'E2'], ['ECE', 'E3'], ['ECE', 'E4'], ['ECE', 'E5'], ['ECE', 'E6'],
  ['KS', 'K1'],
  ['GSO', 'M1'], ['GSO', 'M2'], ['GSO', 'M3'], ['GSO', 'M4'], ['GSO', 'M5'], ['GSO', 'M6'],
  ['GB', 'A3'],   // China
  ['JIS', 'A2'],  // Japan
  ['BIS', 'A8'],  // India
  ['SNI', 'A6'],  // Indonesia
  ['NORM', 'L1'], // Brazil
];

(async () => {
  const conn = await oracledb.getConnection({
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    connectString: `${env.DB_HOST}:${env.DB_PORT}/${env.DB_SERVICE_NAME}`,
  });
  try {
    const tableExists = async (name) => {
      const r = await conn.execute('SELECT COUNT(*) FROM USER_TABLES WHERE TABLE_NAME = :1', [name]);
      return r.rows[0][0] > 0;
    };

    if (!(await tableExists('DW_ENDUR_SVRTY_RANK'))) {
      await conn.execute(`CREATE TABLE DW_ENDUR_SVRTY_RANK (
        PRODUCT_LINE      VARCHAR2(10)  NOT NULL,
        TEST_CATEGORY     VARCHAR2(5)   NOT NULL,
        SPEED_GRADE_COND  VARCHAR2(10)  NOT NULL,
        TEST_CDN_NAME     VARCHAR2(20)  NOT NULL,
        REGULATION_CODE   VARCHAR2(20)  NOT NULL,
        SVRTY_RANK        NUMBER        NOT NULL,
        MANDATORY_YN      VARCHAR2(1)   DEFAULT 'N',
        USE_YN            VARCHAR2(1)   DEFAULT 'Y',
        REG_DTM           DATE          DEFAULT SYSDATE,
        CONSTRAINT PK_DW_ENDUR_SVRTY_RANK PRIMARY KEY
          (PRODUCT_LINE, TEST_CATEGORY, SPEED_GRADE_COND, TEST_CDN_NAME, REGULATION_CODE)
      )`);
      console.log('DW_ENDUR_SVRTY_RANK: CREATE 완료');
    } else {
      console.log('DW_ENDUR_SVRTY_RANK: 이미 존재 — CREATE 스킵');
    }

    if (!(await tableExists('DW_REGULATION_MARKET_MAP'))) {
      await conn.execute(`CREATE TABLE DW_REGULATION_MARKET_MAP (
        REGULATION_CODE  VARCHAR2(20)  NOT NULL,
        MARKET_CODE      VARCHAR2(10)  NOT NULL,
        USE_YN           VARCHAR2(1)   DEFAULT 'Y',
        REG_DTM          DATE          DEFAULT SYSDATE,
        CONSTRAINT PK_DW_REGULATION_MARKET_MAP PRIMARY KEY (REGULATION_CODE, MARKET_CODE)
      )`);
      console.log('DW_REGULATION_MARKET_MAP: CREATE 완료');
    } else {
      console.log('DW_REGULATION_MARKET_MAP: 이미 존재 — CREATE 스킵');
    }

    const rankCount = await conn.execute('SELECT COUNT(*) FROM DW_ENDUR_SVRTY_RANK');
    if (rankCount.rows[0][0] === 0) {
      for (const [pl, cat, sg, cdn, reg, rank, mand] of RANK_SEED) {
        await conn.execute(
          `INSERT INTO DW_ENDUR_SVRTY_RANK
           (PRODUCT_LINE, TEST_CATEGORY, SPEED_GRADE_COND, TEST_CDN_NAME, REGULATION_CODE, SVRTY_RANK, MANDATORY_YN, USE_YN, REG_DTM)
           VALUES (:1, :2, :3, :4, :5, :6, :7, 'Y', SYSDATE)`,
          [pl, cat, sg, cdn, reg, rank, mand],
        );
      }
      console.log(`RANK 시드: ${RANK_SEED.length}건 INSERT`);
    } else {
      console.log(`RANK 시드: 기존 ${rankCount.rows[0][0]}건 — 스킵`);
    }

    const mapCount = await conn.execute('SELECT COUNT(*) FROM DW_REGULATION_MARKET_MAP');
    if (mapCount.rows[0][0] === 0) {
      for (const [reg, mkt] of MAP_SEED) {
        await conn.execute(
          `INSERT INTO DW_REGULATION_MARKET_MAP (REGULATION_CODE, MARKET_CODE, USE_YN, REG_DTM)
           VALUES (:1, :2, 'Y', SYSDATE)`,
          [reg, mkt],
        );
      }
      console.log(`MAP 시드: ${MAP_SEED.length}건 INSERT`);
    } else {
      console.log(`MAP 시드: 기존 ${mapCount.rows[0][0]}건 — 스킵`);
    }

    await conn.commit();

    const v1 = await conn.execute('SELECT COUNT(*) FROM DW_ENDUR_SVRTY_RANK');
    const v2 = await conn.execute('SELECT COUNT(*) FROM DW_REGULATION_MARKET_MAP');
    console.log(`검증 — RANK: ${v1.rows[0][0]}건 / MAP: ${v2.rows[0][0]}건`);
  } finally {
    await conn.close();
  }
})().catch((e) => {
  console.error('ERR:', e.message);
  process.exit(1);
});

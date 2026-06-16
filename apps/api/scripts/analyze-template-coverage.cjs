/**
 * 역방향 매칭(mcode → 필요 시험) 타당성 실측 — 읽기 전용 (SELECT only).
 *
 * 목적:
 *  1) TEMPLATE_STD_TEST_ITEM 의 각 "필터 조건" 컬럼이 실제로 얼마나 채워져
 *     있는지(채움률)·distinct 값·샘플을 본다.  빈 조건 = wildcard 이므로,
 *     쿼리가 못 채우는 컬럼이라도 실데이터에서 거의 비어 있으면 매칭에 무해.
 *  2) 38개 마켓 플래그 컬럼이 행별로 얼마나 쓰이는지 본다.
 *  3) 마켓 코드 매핑 검증 — TEMPLATE 의 38코드(F1..L8) ↔ V_MCODE_INFO_4_HINT /
 *     V_PIC_MATTR_MDPT_INFO_4_HINT 의 마켓 컬럼 값이 같은 코드 체계인지 비교.
 *
 * 실행:  node scripts/analyze-template-coverage.cjs
 */
const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');

const TABLE = 'TEMPLATE_STD_TEST_ITEM';

// 38 마켓 플래그 컬럼 (template.constants.ts 의 MARKET_COLS 와 동일 순서)
const MARKET_COLS = [
  'F1', 'F2', 'F3', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9',
  'N1', 'N2', 'N3', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'K1', 'M1', 'M2', 'M3',
  'M4', 'M5', 'M6', 'NA', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8',
];
const MARKET_SET = new Set(MARKET_COLS);

// 출력/도출 컬럼 (필터 조건 아님) + 감사 컬럼 — 채움률 표에서는 [출력]으로만 표시
const OUTPUT_COLS = new Set([
  'ENDUR_SVRTY', 'CERTI_TEST_YN', 'CERTI_TYPE', 'CDN_PATTERN',
  'TBR_ITEM_CNT_PER_BARCODE',
  'TEST_ITEM_NAME', 'TEST_MTH_NAME', 'TEST_CDN_NAME', 'TEST_GROUP_NAME',
]);
const SKIP_COLS = new Set(['TMPLT_ID', 'CREATED_AT', 'CREATED_BY']);

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const pad = (s, n) => String(s ?? '').padEnd(n);
const padL = (s, n) => String(s ?? '').padStart(n);

async function q(conn, sql, binds = []) {
  const r = await conn.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_ARRAY });
  return r.rows;
}

async function safe(label, fn) {
  try {
    return await fn();
  } catch (e) {
    console.log(`  ! ${label} 실패: ${e.message}`);
    return null;
  }
}

(async () => {
  const conn = await oracledb.getConnection({
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    connectString: `${env.DB_HOST}:${env.DB_PORT}/${env.DB_SERVICE_NAME}`,
  });
  try {
    // 컬럼 메타 (이름·타입)
    const colRows = await q(
      conn,
      `SELECT COLUMN_NAME, DATA_TYPE FROM USER_TAB_COLUMNS WHERE TABLE_NAME = :1 ORDER BY COLUMN_ID`,
      [TABLE],
    );
    const cols = colRows.map(([name, type]) => ({ name, type }));
    const colType = new Map(cols.map((c) => [c.name, c.type]));

    const totalRow = await q(conn, `SELECT COUNT(*) FROM ${TABLE}`);
    const total = Number(totalRow[0][0]);
    console.log(`\n==================================================================`);
    console.log(`  ${TABLE} — 총 ${total} 행`);
    console.log(`==================================================================`);

    // ---- 섹션 B: 필터 조건 컬럼 채움률 ----
    console.log(`\n[B] 필터 조건 컬럼 — 채움률 / distinct / 샘플`);
    console.log(`  ${pad('COLUMN', 26)}${pad('채움', 14)}${pad('distinct', 10)}샘플값`);
    console.log(`  ${'-'.repeat(96)}`);

    const filterCols = cols
      .map((c) => c.name)
      .filter((n) => !MARKET_SET.has(n) && !SKIP_COLS.has(n));

    const rowsForCol = [];
    for (const name of filterCols) {
      const isChar = /CHAR|CLOB/.test(colType.get(name) || '');
      const blankExpr = isChar
        ? `SUM(CASE WHEN ${name} IS NULL OR TRIM(${name}) IS NULL THEN 1 ELSE 0 END)`
        : `SUM(CASE WHEN ${name} IS NULL THEN 1 ELSE 0 END)`;
      const agg = await q(
        conn,
        `SELECT ${blankExpr} AS blanks, COUNT(DISTINCT ${name}) AS dcnt FROM ${TABLE}`,
      );
      const blanks = Number(agg[0][0]);
      const distinct = Number(agg[0][1]);
      const filled = total - blanks;
      const pct = total ? ((filled / total) * 100).toFixed(0) : '0';

      let samples = [];
      if (distinct > 0) {
        const s = await q(
          conn,
          `SELECT * FROM (SELECT DISTINCT ${name} v FROM ${TABLE} WHERE ${name} IS NOT NULL ORDER BY 1) WHERE ROWNUM <= 8`,
        );
        samples = s.map((r) => String(r[0]));
      }
      rowsForCol.push({ name, filled, pct: Number(pct), distinct, samples });
    }

    // 채움률 내림차순 — 실제로 쓰이는 조건이 위로
    rowsForCol.sort((a, b) => b.filled - a.filled);
    for (const r of rowsForCol) {
      const tag = OUTPUT_COLS.has(r.name) ? ' [출력]' : '';
      const fillStr = `${padL(r.filled, 5)} (${padL(r.pct, 3)}%)`;
      const sample = r.samples.slice(0, 6).join(' | ');
      console.log(
        `  ${pad(r.name + tag, 26)}${pad(fillStr, 14)}${padL(r.distinct, 6)}    ${sample}`,
      );
    }

    // ---- 섹션 C: 38 마켓 플래그 사용량 ----
    console.log(`\n[C] 38 마켓 플래그 — 적용 행 수 (값이 NULL/0/N 이 아닌 행)`);
    const marketCounts = [];
    for (const m of MARKET_COLS) {
      if (!colType.has(m)) {
        marketCounts.push({ m, n: -1 });
        continue;
      }
      const r = await q(
        conn,
        `SELECT COUNT(*) FROM ${TABLE} WHERE ${m} IS NOT NULL AND TO_CHAR(${m}) NOT IN ('0','N')`,
      );
      marketCounts.push({ m, n: Number(r[0][0]) });
    }
    const line = (arr) =>
      arr.map((x) => `${x.m}:${x.n < 0 ? '없음' : x.n}`).join('   ');
    for (let i = 0; i < marketCounts.length; i += 8) {
      console.log('  ' + line(marketCounts.slice(i, i + 8)));
    }
    const usedMarkets = marketCounts.filter((x) => x.n > 0).map((x) => x.m);
    console.log(`  → 실제 사용된 마켓 코드 (${usedMarkets.length}/38): ${usedMarkets.join(', ') || '없음'}`);

    // ---- 섹션 D: 마켓 코드 매핑 검증 ----
    console.log(`\n[D] 마켓 코드 체계 비교 — TEMPLATE 38코드 ↔ 소스 뷰`);

    const distinctVals = async (label, sql) => {
      const rows = await safe(label, () => q(conn, sql));
      if (!rows) return null;
      const vals = rows
        .map((r) => (r[0] == null ? null : String(r[0]).trim()))
        .filter((v) => v);
      return vals;
    };

    const report = (label, vals) => {
      if (!vals) return;
      const inSet = vals.filter((v) => MARKET_SET.has(v));
      const notIn = vals.filter((v) => !MARKET_SET.has(v));
      console.log(`\n  · ${label} — distinct ${vals.length}개`);
      console.log(`     38코드와 일치: ${inSet.length}개  ${inSet.slice(0, 20).join(', ')}`);
      console.log(`     38코드 외(매핑필요): ${notIn.length}개  ${notIn.slice(0, 30).join(', ')}`);
    };

    report(
      'DW_REGULATION_MARKET_MAP.MARKET_CODE',
      await distinctVals(
        'REGULATION_MARKET_MAP',
        `SELECT DISTINCT MARKET_CODE FROM DW_REGULATION_MARKET_MAP ORDER BY 1`,
      ),
    );
    report(
      'V_MCODE_INFO_4_HINT.MAIN_MARKET',
      await distinctVals(
        'MAIN_MARKET',
        `SELECT DISTINCT MAIN_MARKET FROM V_MCODE_INFO_4_HINT WHERE MAIN_MARKET IS NOT NULL ORDER BY 1`,
      ),
    );
    report(
      'V_MCODE_INFO_4_HINT.SPECIAL_MARKET',
      await distinctVals(
        'SPECIAL_MARKET',
        `SELECT DISTINCT SPECIAL_MARKET FROM V_MCODE_INFO_4_HINT WHERE SPECIAL_MARKET IS NOT NULL ORDER BY 1`,
      ),
    );
    report(
      'V_PIC_MATTR_MDPT_INFO_4_HINT.MAIN_MKT',
      await distinctVals(
        'MAIN_MKT',
        `SELECT DISTINCT MAIN_MKT FROM V_PIC_MATTR_MDPT_INFO_4_HINT WHERE MAIN_MKT IS NOT NULL ORDER BY 1`,
      ),
    );
    report(
      'V_PIC_MATTR_MDPT_INFO_4_HINT.SUB_MKT',
      await distinctVals(
        'SUB_MKT',
        `SELECT DISTINCT SUB_MKT FROM V_PIC_MATTR_MDPT_INFO_4_HINT WHERE SUB_MKT IS NOT NULL ORDER BY 1`,
      ),
    );

    // ---- 섹션 E: 소스 뷰가 제공하는 타이어 속성 샘플 (파싱 필요성 확인) ----
    console.log(`\n[E] V_MCODE_INFO_4_HINT — 타이어 속성 샘플 (SIZE/SS/POSITION 등 5행)`);
    await safe('mcode 샘플', async () => {
      const rows = await q(
        conn,
        `SELECT * FROM (
           SELECT MCODE, PRODUCT_LINE, SIZE_DESCRIPTION, PATTERN, PRODUCT_SPEED_SYMBOL,
                  TIRE_POSITION, HINDICATOR, MAIN_MARKET, SPECIAL_MARKET
           FROM V_MCODE_INFO_4_HINT WHERE ACTIVE_YN = 'Y'
         ) WHERE ROWNUM <= 5`,
      );
      const heads = ['MCODE', 'PL', 'SIZE_DESCRIPTION', 'PATTERN', 'SPD_SYM', 'POS', 'HIND', 'MAIN_MKT', 'SPC_MKT'];
      console.log('  ' + heads.map((h, i) => pad(h, [12, 5, 22, 10, 9, 6, 6, 10, 10][i])).join(''));
      for (const r of rows) {
        console.log('  ' + r.map((v, i) => pad(v, [12, 5, 22, 10, 9, 6, 6, 10, 10][i])).join(''));
      }
    });

    console.log(`\n완료.\n`);
  } finally {
    await conn.close();
  }
})().catch((e) => {
  console.error('ERR:', e.message);
  process.exit(1);
});

/**
 * Phase 1 검증 — mcode → 정규화된 타이어 속성 (대표마켓 결정 포함).
 * 서비스로 옮기기 전 로직 검증용 (읽기 전용).
 * 실행:  node scripts/phase1-resolve-tire.cjs [mcode ...]
 */
const fs = require('fs'), path = require('path'), oracledb = require('oracledb');
const env = {};
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const O = { outFormat: oracledb.OUT_FORMAT_OBJECT };

// 1자리 main_market 지역 → 38코드 셋
const REGION_MAP = {
  A: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9'],
  C: ['A3'],
  E: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'],
  K: ['K1'],
  M: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
  N: ['NA'],
};
const MARKET_38 = new Set([
  'F1','F2','F3','A0','A1','A2','A3','A4','A5','A6','A7','A8','A9','N1','N2','N3',
  'E1','E2','E3','E4','E5','E6','K1','M1','M2','M3','M4','M5','M6','NA',
  'L1','L2','L3','L4','L5','L6','L7','L8',
]);

const tokens38 = (csv) =>
  String(csv || '').split(',').map((t) => t.trim()).map((t) => (t === '1' ? 'K1' : t))
    .filter((t) => MARKET_38.has(t));

// mcode 의 모든 (md) 행을 받아 대표마켓 코드셋 결정
function resolveMarket(mainMarket, mktRows) {
  const mk = (mainMarket || '').trim();
  if (mk.length === 1 && REGION_MAP[mk]) {
    return { source: `region:${mk}`, codes: REGION_MAP[mk] };
  }
  // 2자리(OEM) / '-' / null → md.MAIN_MKT 최빈 38코드 1개
  const freq = new Map();
  for (const r of mktRows) for (const t of tokens38(r)) freq.set(t, (freq.get(t) || 0) + 1);
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1])[0];
  return { source: mk.length === 2 ? `oem:${mk}→md최빈` : 'md최빈', codes: top ? [top[0]] : [] };
}

const ATTR_SQL = `
SELECT
  m.MAIN_MARKET main_market, m.PRODUCT_LINE product_line,
  md.MAIN_MKT mkt2, md.SEGMENT segment, md.FRT frt, md.POR por, md.M_PLUS_S mplus,
  md.TIRE_SIZE tiresize,
  m.INCH/100 rim_inch, m.LOAD_INDEX_SINGLE li, m.PLY_RATING ply, m.TIRE_POSITION tire_position,
  CASE WHEN substr(m.PRODUCT_SPEED_SYMBOL,1,1)='1' THEN '('||substr(m.PRODUCT_SPEED_SYMBOL,2,1)||')'
       ELSE substr(m.PRODUCT_SPEED_SYMBOL,2,1) END ss,
  CASE WHEN p.MAINGROOVEDEPTH=0 THEN NULL ELSE p.MAINGROOVEDEPTH END grv_depth,
  CASE WHEN REGEXP_LIKE(m.SIZE_DESCRIPTION,'[0-9]R[0-9]') THEN 'R'
       WHEN REGEXP_LIKE(m.SIZE_DESCRIPTION,'[0-9]B[0-9]') THEN 'B'
       WHEN REGEXP_LIKE(m.SIZE_DESCRIPTION,'[0-9]-[0-9]') THEN 'B' ELSE NULL END radial_bias,
  CASE WHEN md.THREE_PMSF='Y' OR INSTR(m.PATTERN,'W')>0 THEN 'Y' END winter
FROM v_mcode_info_4_hint m
JOIN v_pic_mattr_mdpt_info_4_hint md ON m.MCODE=md.MCODE
LEFT JOIN DRW_PARAM_INFO p ON m.MCODE=p.PRODUCTCODE
WHERE m.ACTIVE_YN='Y' AND md.MAIN_MKT IS NOT NULL AND m.MCODE=:mc`;

const first = (rows, k) => { for (const r of rows) if (r[k] != null && String(r[k]).trim() !== '') return r[k]; return null; };

async function resolve(conn, mc) {
  const rows = (await conn.execute(ATTR_SQL, { mc }, O)).rows;
  if (!rows.length) return null;
  const market = resolveMarket(rows[0].MAIN_MARKET, rows.map((r) => r.MKT2));
  const segSet = [...new Set(rows.flatMap((r) => String(r.SEGMENT || '').split(',').map((s) => s.trim()).filter(Boolean)))];
  return {
    mcode: mc,
    productLine: first(rows, 'PRODUCT_LINE'),
    mainMarket: rows[0].MAIN_MARKET,
    market,
    rimInch: first(rows, 'RIM_INCH'),
    ss: first(rows, 'SS'),
    li: first(rows, 'LI'),
    ply: first(rows, 'PLY'),
    grvDepth: first(rows, 'GRV_DEPTH'),
    radialBias: first(rows, 'RADIAL_BIAS'),
    segment: segSet,
    frt: first(rows, 'FRT'),
    por: first(rows, 'POR'),
    winter: first(rows, 'WINTER'),
    tirePosition: first(rows, 'TIRE_POSITION'),
    _rowCount: rows.length,
  };
}

(async () => {
  const conn = await oracledb.getConnection({
    user: env.DB_USERNAME, password: env.DB_PASSWORD,
    connectString: `${env.DB_HOST}:${env.DB_PORT}/${env.DB_SERVICE_NAME}`,
  });
  try {
    let mcodes = process.argv.slice(2);
    if (!mcodes.length) {
      // 지역별 샘플 mcode 2개씩 자동 선택
      const r = await conn.execute(`
        SELECT main_market, mcode FROM (
          SELECT m.MAIN_MARKET main_market, m.MCODE,
                 ROW_NUMBER() OVER (PARTITION BY m.MAIN_MARKET ORDER BY m.MCODE) rn
          FROM v_mcode_info_4_hint m JOIN v_pic_mattr_mdpt_info_4_hint md ON m.MCODE=md.MCODE
          WHERE m.ACTIVE_YN='Y' AND md.MAIN_MKT IS NOT NULL AND LENGTH(m.MAIN_MARKET)=1
        ) WHERE rn<=2 ORDER BY main_market`, [], O);
      mcodes = r.rows.map((x) => x.MCODE);
    }
    for (const mc of mcodes) {
      const t = await resolve(conn, mc);
      if (!t) { console.log(`\n${mc}: (조회 결과 없음)`); continue; }
      console.log(`\n● ${t.mcode}  [${t.productLine}]  main_market=${t.mainMarket}  (md행 ${t._rowCount})`);
      console.log(`   대표마켓: {${t.market.codes.join(',')}}  (${t.market.source})`);
      console.log(`   rim=${t.rimInch} ss=${t.ss} li=${t.li} ply=${t.ply} grv=${t.grvDepth ?? '-'} rb=${t.radialBias ?? '-'}`);
      console.log(`   segment=[${t.segment.join(',')}] frt=${t.frt ?? '-'} por=${t.por ?? '-'} winter=${t.winter ?? '-'} pos=${t.tirePosition ?? '-'}`);
    }
    console.log('');
  } finally { await conn.close(); }
})().catch((e) => { console.error('ERR:', e.message); process.exit(1); });

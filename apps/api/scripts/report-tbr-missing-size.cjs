/**
 * 일회성: 활성 TBR mcode 중 규격(SIZE_SMPL, Release 우선)을 못 구한 건 목록 + 원인 진단.
 * 빠른 방식: 상관 서브쿼리 없이 단일 GROUP BY 스캔 2회로 처리.
 * 원인: NO_SPEC(스펙행 없음) / SMPL_NULL(스펙은 있으나 SIZE_SMPL 전부 null).
 * 실행: node scripts/report-tbr-missing-size.cjs   (apps/api 에서)
 */
const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');

const env = {};
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

(async () => {
  const c = await oracledb.getConnection({ user: env.DB_USERNAME, password: env.DB_PASSWORD, connectString: `${env.DB_HOST}:${env.DB_PORT}/${env.DB_SERVICE_NAME}` });
  const OBJ = { outFormat: oracledb.OUT_FORMAT_OBJECT, fetchArraySize: 5000 };
  try {
    // A) 활성 TBR mcode (서브쿼리 없음 — 빠름)
    const act = (await c.execute(
      `SELECT MCODE, SIZE_DESCRIPTION FROM V_MCODE_INFO_4_HINT WHERE ACTIVE_YN='Y' AND PRODUCT_LINE='TBR'`,
      [], OBJ)).rows;

    // B) TBR 스펙을 PRODUCT_CODE 단위로 1회 집계 (단일 스캔)
    const spec = (await c.execute(
      `SELECT PRODUCT_CODE,
              COUNT(*) spec_rows,
              COUNT(SIZE_SMPL) smpl_nonnull,
              MAX(SIZE_FULL) any_full,
              MAX(SIZE_SMPL) KEEP (DENSE_RANK FIRST ORDER BY CASE WHEN SPEC_STATE='Release' THEN 0 ELSE 1 END) rel_smpl,
              LISTAGG(DISTINCT SPEC_STATE, ',') WITHIN GROUP (ORDER BY SPEC_STATE) states
         FROM DW_SPEC_PLM_TIRE WHERE PRODUCT_LINE='TBR' GROUP BY PRODUCT_CODE`,
      [], OBJ)).rows;
    const byCode = new Map(spec.map(r => [r.PRODUCT_CODE, r]));

    const miss = [];
    for (const m of act) {
      const d = byCode.get(m.MCODE);
      const relNull = !d || d.REL_SMPL == null;   // Release 우선 규격을 못 구함
      if (relNull) miss.push({ ...m, d });
    }

    const agg = {};
    for (const r of miss) {
      const k = !r.d ? 'NO_SPEC' : (r.d.SMPL_NONNULL === 0 ? 'SMPL_NULL' : '기타(Release외 규격만)');
      agg[k] = (agg[k] || 0) + 1;
    }
    console.log(`활성 TBR mcode: ${act.length}건 | 규격 없는 건: ${miss.length}건`);
    console.log('원인 분류:', JSON.stringify(agg), '\n');
    console.log('MCODE     | SIZE_DESCRIPTION       | spec행 | SIZE_FULL(스펙)        | 상태            | 원인');
    console.log('----------+------------------------+--------+------------------------+-----------------+--------');
    for (const r of miss) {
      const d = r.d;
      const cause = !d ? 'NO_SPEC' : (d.SMPL_NONNULL === 0 ? 'SMPL_NULL' : '기타');
      console.log(
        `${String(r.MCODE).padEnd(9)} | ${String(r.SIZE_DESCRIPTION || '').padEnd(22)} | ${String(d ? d.SPEC_ROWS : 0).padEnd(6)} | ${String((d && d.ANY_FULL) || '-').padEnd(22)} | ${String((d && d.STATES) || '-').padEnd(15)} | ${cause}`
      );
    }
  } finally { await c.close(); }
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });

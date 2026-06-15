/**
 * TEMPLATE_STD_TEST_ITEM.CDN_PATTERN 도입 마이그레이션 (멱등).
 *  - CDN_PATTERN 컬럼 추가 (없으면)
 *  - 확장형 TEST_CDN_NAME(분류 마스터에 없는 패턴/접미사)을
 *      대표값(분류 마스터의 TEST_COND_NAME) + 명시적 중괄호 패턴으로 분리:
 *        TEST_CDN_NAME = 대표값(예: LL09)
 *        CDN_PATTERN   = 명시 패턴(예: LL09{SS}{RADIAL_BIAS})
 *  - 치환자 매핑:  %→{SS}   #→{RADIAL_BIAS}   @→{POR}
 *
 * 실행:
 *   node scripts/migrate-cdn-pattern.cjs           # dry-run (계획만 출력)
 *   node scripts/migrate-cdn-pattern.cjs --apply    # 실제 적용
 */
const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');

const APPLY = process.argv.includes('--apply');
const TABLE = 'TEMPLATE_STD_TEST_ITEM';

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const SIGIL_TO_TOKEN = { '%': '{SS}', '#': '{RADIAL_BIAS}', '@': '{POR}' };

function toPattern(rest) {
  return rest.replace(/[%#@]/g, (ch) => SIGIL_TO_TOKEN[ch]);
}

/**
 * Split a value into { base, pattern } only when it carries a substitution
 * sigil (% # @). Values without a sigil — even if absent from the master
 * (e.g. LL10A, TP08A) — are real condition names and stay whole in
 * TEST_CDN_NAME with no pattern.
 */
function analyze(value, clsSet) {
  const v = value;
  const sigil = v.match(/[%#@]/);
  if (!sigil) return null; // no placeholder → not a pattern, leave as-is
  const base = v.slice(0, sigil.index);
  const pattern = base + toPattern(v.slice(sigil.index));
  return { base, pattern, baseInCls: clsSet.has(base) };
}

(async () => {
  const conn = await oracledb.getConnection({
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    connectString: `${env.DB_HOST}:${env.DB_PORT}/${env.DB_SERVICE_NAME}`,
  });
  try {
    // 1) Add CDN_PATTERN if missing
    const colChk = await conn.execute(
      `SELECT COUNT(*) FROM USER_TAB_COLUMNS WHERE TABLE_NAME=:1 AND COLUMN_NAME='CDN_PATTERN'`,
      [TABLE],
    );
    const hasCol = colChk.rows[0][0] > 0;
    if (!hasCol) {
      if (APPLY) {
        await conn.execute(`ALTER TABLE ${TABLE} ADD CDN_PATTERN VARCHAR2(60)`);
        console.log('CDN_PATTERN 컬럼 추가 완료');
      } else {
        console.log('[dry-run] CDN_PATTERN 컬럼 추가 예정');
      }
    } else {
      console.log('CDN_PATTERN 컬럼 이미 존재 — 추가 스킵');
    }

    // 2) Build classification condition-name set
    const cls = await conn.execute(
      `SELECT DISTINCT TEST_COND_NAME FROM DW_HNT_CLASSIFICATION WHERE TEST_COND_NAME IS NOT NULL`,
    );
    const clsSet = new Set(cls.rows.map((r) => r[0]));

    // 3) Plan over distinct current TEST_CDN_NAME
    const distinct = await conn.execute(
      `SELECT TEST_CDN_NAME v, COUNT(*) n FROM ${TABLE} WHERE TEST_CDN_NAME IS NOT NULL GROUP BY TEST_CDN_NAME`,
    );
    const plan = [];
    const warnings = [];
    for (const [v, n] of distinct.rows) {
      const a = analyze(v, clsSet);
      if (!a) continue; // canonical — no change
      if (a.base === null) {
        warnings.push(`  ! 대표값 판별 불가: [${v}] x${n} — 스킵`);
        continue;
      }
      plan.push({ from: v, base: a.base, pattern: a.pattern, n, baseInCls: a.baseInCls });
    }

    console.log(`\n=== 변환 계획 (${plan.length}종) ===`);
    console.log('  FROM            ->  TEST_CDN_NAME   CDN_PATTERN                 (행수)');
    for (const p of plan) {
      console.log(
        `  ${p.from.padEnd(14)} ->  ${p.base.padEnd(14)}  ${p.pattern.padEnd(26)} x${p.n}${p.baseInCls ? '' : '  <base NOT in cls>'}`,
      );
    }
    if (warnings.length) {
      console.log('\n=== 경고 ===');
      warnings.forEach((w) => console.log(w));
    }

    if (!APPLY) {
      console.log('\n[dry-run] 적용하려면 --apply 플래그로 재실행하세요.');
      return;
    }

    // 4) Apply (idempotent: only rows still holding the old extension value)
    let total = 0;
    for (const p of plan) {
      const r = await conn.execute(
        `UPDATE ${TABLE} SET TEST_CDN_NAME=:newName, CDN_PATTERN=:pat WHERE TEST_CDN_NAME=:oldName`,
        { newName: p.base, pat: p.pattern, oldName: p.from },
      );
      total += r.rowsAffected;
    }
    await conn.commit();
    console.log(`\n적용 완료 — ${plan.length}종 / ${total}행 업데이트`);
  } finally {
    await conn.close();
  }
})().catch((e) => {
  console.error('ERR:', e.message);
  process.exit(1);
});

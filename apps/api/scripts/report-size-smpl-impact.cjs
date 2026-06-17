/**
 * 일회성 영향 리포트: SIZE_SMPL을 정식 매칭 조건으로 승격했을 때
 * 전체 활성 mcode에서 매칭이 몇 건 빠지는지 집계.
 * (SIZE_SMPL 템플릿 행은 전부 TBR이므로 TBR mcode만 영향 — TBR 전수 평가.)
 *
 * 실행: node scripts/report-size-smpl-impact.cjs   (apps/api 에서, .env 필요)
 */
const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');

const env = {};
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

// ---- 서비스와 동일한 상수 ----
const REGION_MAP = {
  A: ['A0','A1','A2','A3','A4','A5','A6','A7','A8','A9'], C: ['A3'],
  E: ['E1','E2','E3','E4','E5','E6'], K: ['K1'],
  M: ['M1','M2','M3','M4','M5','M6'], N: ['NA'],
};
const CODE_TO_GROUP = { NA:'NA',M1:'ME',M2:'ME',M3:'ME',M4:'ME',M5:'ME',M6:'ME',F1:'AF',F2:'AF',F3:'AF',A1:'AP',A2:'AP',A3:'AP',A5:'AP',A7:'AP',A0:'AI',A4:'AI',A6:'AI',A8:'AI',A9:'AI',N1:'AI',N2:'AI',N3:'AI',L1:'SA',L2:'SA',L3:'SA',L4:'SA',L5:'SA',L6:'SA',L7:'SA',L8:'SA',E1:'EU',E2:'EU',E3:'EU',E4:'EU',E5:'EU',E6:'EU',K1:'KR' };
const MARKET_COLS = ['F1','F2','F3','A0','A1','A2','A3','A4','A5','A6','A7','A8','A9','N1','N2','N3','E1','E2','E3','E4','E5','E6','K1','M1','M2','M3','M4','M5','M6','NA','L1','L2','L3','L4','L5','L6','L7','L8'];
const MARKET_38 = new Set(MARKET_COLS);

// ---- 서비스와 동일한 헬퍼 ----
const str = (v) => (typeof v!=='string'&&typeof v!=='number'&&typeof v!=='boolean') ? '' : String(v).trim();
const num = (v) => { const s=str(v); if(s==='')return null; const n=Number(s); return Number.isNaN(n)?null:n; };
const isOn = (v) => { const s=str(v).toUpperCase(); return s!==''&&s!=='0'&&s!=='N'; };
const tokens38 = (csv) => str(csv).split(',').map(t=>t.trim()).map(t=>t==='1'?'K1':t).filter(t=>MARKET_38.has(t));

function resolveMarket(mainMarket, mktRows) {
  const mk = (mainMarket??'').trim();
  if (mk.length===1 && REGION_MAP[mk]) return [...REGION_MAP[mk]];
  const codes = [];
  for (const r of mktRows) for (const t of tokens38(r)) codes.push(t);
  if (!codes.length) return [];
  const gc = new Map();
  for (const c of codes) { const g=CODE_TO_GROUP[c]; if(g) gc.set(g,(gc.get(g)??0)+1); }
  const top = [...gc.entries()].sort((a,b)=>b[1]-a[1])[0][0];
  return [...new Set(codes.filter(c=>CODE_TO_GROUP[c]===top))];
}

function evalRange(cond, value) {
  const c=str(cond); if(c==='')return 'pass'; if(value==null)return 'unknown';
  const m=c.match(/^(<=|>=|<>|!=|<|>|=)?\s*(-?\d+(?:\.\d+)?)$/); if(!m)return 'unknown';
  const op=m[1]||'='; const n=Number(m[2]);
  switch(op){case '<':return value<n?'pass':'fail';case '>':return value>n?'pass':'fail';case '<=':return value<=n?'pass':'fail';case '>=':return value>=n?'pass':'fail';case '<>':case '!=':return value!==n?'pass':'fail';default:return value===n?'pass':'fail';}
}
const evalFlag = (tmpl, tireOn) => { const t=str(tmpl).toUpperCase(); if(t==='')return 'pass'; const wantOn=t!=='N'&&t!=='0'; return tireOn===wantOn?'pass':'fail'; };
function evalCsvMember(tmplCsv, tireVal) { const c=str(tmplCsv); if(c==='')return 'pass'; if(!tireVal)return 'unknown'; const list=c.split(/[,\s]+/).map(s=>s.trim()).filter(Boolean); return list.includes(tireVal)?'pass':'fail'; }
function evalTbrPosition(tmplCsv, tirePos) { const c=str(tmplCsv); if(c==='')return 'pass'; if(!tirePos)return 'unknown'; const list=c.split(/[,\s]+/).map(s=>s.trim().toUpperCase()).filter(Boolean); if(list.includes('A')||tirePos.toUpperCase()==='A')return 'pass'; return list.includes(tirePos.toUpperCase())?'pass':'fail'; }
function evalCsvIntersect(tmplCsv, tireVals) { const c=str(tmplCsv); if(c==='')return 'pass'; if(!tireVals.length)return 'unknown'; const list=new Set(c.split(/[,\s]+/).map(s=>s.trim()).filter(Boolean)); return tireVals.some(v=>list.has(v))?'pass':'fail'; }

const ATTR_SQL_ALL = `
SELECT m.MCODE,
  m.MAIN_MARKET main_market, m.PRODUCT_LINE product_line,
  md.MAIN_MKT mkt2, md.SEGMENT segment, md.FRT frt, md.POR por,
  CASE WHEN md.TIRE_SIZE IS NULL THEN m.SIZE_DESCRIPTION ELSE md.TIRE_SIZE END tiresize,
  m.INCH/100 rim_inch, m.LOAD_INDEX_SINGLE li, m.PLY_RATING ply, m.TIRE_POSITION tire_position, m.TL tl,
  CASE WHEN substr(m.PRODUCT_SPEED_SYMBOL,1,1)='1' THEN '('||substr(m.PRODUCT_SPEED_SYMBOL,2,1)||')' ELSE substr(m.PRODUCT_SPEED_SYMBOL,2,1) END ss,
  CASE WHEN p.MAINGROOVEDEPTH=0 THEN NULL ELSE p.MAINGROOVEDEPTH END grv_depth,
  CASE WHEN REGEXP_LIKE(m.SIZE_DESCRIPTION,'[0-9]R[0-9]') THEN 'R' WHEN REGEXP_LIKE(m.SIZE_DESCRIPTION,'[0-9]B[0-9]') THEN 'B' WHEN REGEXP_LIKE(m.SIZE_DESCRIPTION,'[0-9]-[0-9]') THEN 'B' ELSE NULL END radial_bias,
  CASE WHEN md.THREE_PMSF='Y' OR INSTR(m.PATTERN,'W')>0 THEN 'Y' END winter,
  (SELECT MAX(s.SIZE_SMPL) KEEP (DENSE_RANK FIRST ORDER BY CASE WHEN s.SPEC_STATE='Release' THEN 0 ELSE 1 END)
     FROM DW_SPEC_PLM_TIRE s WHERE s.PRODUCT_CODE = m.MCODE) size_smpl
FROM V_MCODE_INFO_4_HINT m
LEFT JOIN V_PIC_MATTR_MDPT_INFO_4_HINT md ON m.MCODE=md.MCODE
LEFT JOIN DRW_PARAM_INFO p ON m.MCODE=p.PRODUCTCODE
WHERE m.ACTIVE_YN='Y' AND m.PRODUCT_LINE='TBR'`;

const normSize = (desc) => { const s=str(desc); if(s==='')return null; const m=s.match(/\d+(?:\.\d+)?(?:\/\d+)?[RB]\d+(?:\.\d+)?/); return m?m[0]:null; };
const first = (rows, k) => { for(const r of rows){const s=str(r[k]); if(s!=='')return s;} return null; };
const firstNum = (rows, k) => { for(const r of rows){const n=num(r[k]); if(n!=null)return n;} return null; };

function buildTire(mcode, rows) {
  const mainMarket = first(rows,'MAIN_MARKET');
  const market = resolveMarket(mainMarket??'', rows.map(r=>r['MKT2']));
  const segment = [...new Set(rows.flatMap(r=>str(r['SEGMENT']).split(',').map(s=>s.trim()).filter(Boolean)))];
  return { mcode, productLine: first(rows,'PRODUCT_LINE')??'', market, sizeSmpl: first(rows,'SIZE_SMPL') ?? normSize(first(rows,'TIRESIZE')),
    rimInch: firstNum(rows,'RIM_INCH'), ss: first(rows,'SS'), li: firstNum(rows,'LI'), ply: firstNum(rows,'PLY'),
    grvDepth: firstNum(rows,'GRV_DEPTH'), radialBias: first(rows,'RADIAL_BIAS'), segment,
    frt: first(rows,'FRT'), por: first(rows,'POR'), winter: first(rows,'WINTER'),
    tirePosition: first(rows,'TIRE_POSITION'), tlIndicator: first(rows,'TL') };
}

/** 비-SIZE_SMPL 조건만 평가 → 'matched-other' 여부 (OLD 매칭). */
function matchesOther(t, r) {
  if (str(r['PRODUCT_LINE']) !== t.productLine) return false;
  const onMk = MARKET_COLS.filter(c=>isOn(r[c]));
  if (onMk.length>0) { const set=new Set(t.market); if(!onMk.some(c=>set.has(c))) return false; }
  const ssNorm = (t.ss??'').replace(/[()]/g,'')||null;
  const v = [
    evalCsvMember(r['SS'], ssNorm),
    evalRange(r['RIM_INCH'], t.rimInch),
    evalRange(r['LI'], t.li),
    evalRange(r['PLY_RATING'], t.ply),
    evalRange(r['GRV_DEPTH'], t.grvDepth),
    evalFlag(r['POR'], isOn(t.por)),
    evalFlag(r['FRT'], isOn(t.frt)),
    evalFlag(r['SNOW_MARK'], isOn(t.winter)),
    evalTbrPosition(r['TBR_POSITION'], t.tirePosition),
    evalCsvIntersect(r['TBR_SEGMENT'], t.segment),
    evalCsvMember(r['TL_INDICATOR'], t.tlIndicator),
    evalCsvMember(r['RADIAL_BIAS'], t.radialBias),
  ];
  return !v.includes('fail');
}

(async () => {
  const c = await oracledb.getConnection({ user: env.DB_USERNAME, password: env.DB_PASSWORD, connectString: `${env.DB_HOST}:${env.DB_PORT}/${env.DB_SERVICE_NAME}` });
  const OBJ = { outFormat: oracledb.OUT_FORMAT_OBJECT };
  try {
    // SIZE_SMPL 비어있지 않은 템플릿 행
    const tpl = (await c.execute(`SELECT * FROM TEMPLATE_STD_TEST_ITEM WHERE SIZE_SMPL IS NOT NULL AND TRIM(SIZE_SMPL) IS NOT NULL`, [], OBJ)).rows;
    console.log(`SIZE_SMPL 보유 템플릿 행: ${tpl.length}건 (전부 PRODUCT_LINE=${[...new Set(tpl.map(r=>r.PRODUCT_LINE))].join(',')})`);

    // 활성 TBR 전수 속성 (md 다중행 → mcode 그룹)
    const rows = (await c.execute(ATTR_SQL_ALL, [], { ...OBJ, fetchArraySize: 5000 })).rows;
    const byMcode = new Map();
    for (const r of rows) { if(!byMcode.has(r.MCODE)) byMcode.set(r.MCODE,[]); byMcode.get(r.MCODE).push(r); }
    console.log(`활성 TBR mcode: ${byMcode.size}건\n`);

    let affectedMcodes = 0, totalDropped = 0, sizeKnown = 0, sizeNull = 0;
    const perTemplate = new Map();   // tmplId → dropped count
    const examples = [];

    for (const [mcode, mrows] of byMcode) {
      const t = buildTire(mcode, mrows);
      if (t.sizeSmpl) sizeKnown++; else sizeNull++;
      let dropped = 0;
      for (const r of tpl) {
        if (!matchesOther(t, r)) continue;              // OLD에서도 매칭 안 됨 → 무관
        // NEW: SIZE_SMPL 멤버십. fail일 때만 제외(=delta). unknown(규격없음)은 유지.
        if (evalCsvMember(r['SIZE_SMPL'], t.sizeSmpl) === 'fail') {
          dropped++;
          perTemplate.set(r.TMPLT_ID, (perTemplate.get(r.TMPLT_ID)??0)+1);
        }
      }
      if (dropped>0) { affectedMcodes++; totalDropped+=dropped;
        if (examples.length<8) examples.push(`${mcode}(규격 ${t.sizeSmpl}, 시장 ${t.market.join('/')||'-'}) → -${dropped}`); }
    }

    console.log('===== 영향 요약 (OLD=SIZE_SMPL 무시 → NEW=SIZE_SMPL 필터) =====');
    console.log(`• 활성 TBR mcode 중 규격 확보: ${sizeKnown} / 규격없음(영향 없음): ${sizeNull}`);
    console.log(`• 매칭이 줄어든 mcode 수: ${affectedMcodes}`);
    console.log(`• 빠진 (mcode×시험) 총건수: ${totalDropped}`);
    console.log(`• 비-TBR mcode: 영향 0 (SIZE_SMPL 템플릿이 전부 TBR)`);
    console.log('\n--- 템플릿 행별 제외 건수 ---');
    for (const [id,cnt] of [...perTemplate.entries()].sort((a,b)=>b[1]-a[1])) {
      const row = tpl.find(r=>r.TMPLT_ID===id);
      console.log(`  TMPLT ${id} (${row.TEST_ITEM_NAME}, SIZE_SMPL=${row.SIZE_SMPL}) → ${cnt}건 제외`);
    }
    console.log('\n--- 예시 mcode ---');
    examples.forEach(e=>console.log('  '+e));
  } finally { await c.close(); }
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });

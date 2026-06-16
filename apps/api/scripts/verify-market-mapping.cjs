const fs=require('fs'),path=require('path'),oracledb=require('oracledb');
const env={};for(const l of fs.readFileSync(path.join(__dirname,'..','.env'),'utf8').split(/\r?\n/)){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim();}
const O={outFormat:oracledb.OUT_FORMAT_OBJECT};const pad=(s,n)=>String(s??'').padEnd(n);
(async()=>{const c=await oracledb.getConnection({user:env.DB_USERNAME,password:env.DB_PASSWORD,connectString:`${env.DB_HOST}:${env.DB_PORT}/${env.DB_SERVICE_NAME}`});
const q=async(s,b=[])=>(await c.execute(s,b,O)).rows;
try{
  // 1) main_market 값을 자리수별로 분류
  console.log('\n[1] main_market distinct — 자리수별 (mcode 기준)');
  const r1=await q(`
    SELECT main_mkt, LENGTH(main_mkt) len, COUNT(*) cnt FROM (
      SELECT DISTINCT m.MCODE, m.MAIN_MARKET main_mkt
      FROM v_mcode_info_4_hint m JOIN v_pic_mattr_mdpt_info_4_hint md ON m.MCODE=md.MCODE
      WHERE m.ACTIVE_YN='Y' AND md.MAIN_MKT IS NOT NULL AND m.MAIN_MARKET IS NOT NULL AND m.MAIN_MARKET<>'-'
    ) GROUP BY main_mkt, LENGTH(main_mkt) ORDER BY len, cnt DESC`);
  console.log('  1자리(지역): '+r1.filter(x=>x.LEN===1).map(x=>`${x.MAIN_MKT}(${x.CNT})`).join(' '));
  console.log('  2자리(OEM) : '+r1.filter(x=>x.LEN===2).map(x=>`${x.MAIN_MKT}(${x.CNT})`).join(' '));

  // 2) 1자리 main_market 별 md.MAIN_MKT 38코드 빈도 (제안 매핑 검증)
  console.log('\n[2] 1자리 main_market → md.MAIN_MKT 38코드 빈도 (상위 8)');
  const rows=await q(`
    SELECT m.MAIN_MARKET mk, md.MAIN_MKT mkt2
    FROM v_mcode_info_4_hint m JOIN v_pic_mattr_mdpt_info_4_hint md ON m.MCODE=md.MCODE
    WHERE m.ACTIVE_YN='Y' AND md.MAIN_MKT IS NOT NULL AND LENGTH(m.MAIN_MARKET)=1`);
  const M=new Map();
  for(const r of rows){const inner=M.get(r.MK)||new Map();
    for(let t of String(r.MKT2||'').split(',')){t=t.trim();if(!t)continue;if(t==='1')t='K1';inner.set(t,(inner.get(t)||0)+1);}
    M.set(r.MK,inner);}
  const PROP={A:'A0~A9',C:'A3',E:'E1~E6',K:'K1',M:'M1~M6',N:'NA'};
  for(const[mk,inner]of[...M.entries()].sort()){
    const top=[...inner.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([c,n])=>`${c}:${n}`).join('  ');
    console.log(`  ${pad(mk,3)} (제안 ${pad(PROP[mk]||'?',6)}) → ${top}`);
  }
  console.log('');
}finally{await c.close()}})().catch(e=>{console.error('ERR:',e.message);process.exit(1)});

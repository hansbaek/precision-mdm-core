import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { DataSource } from 'typeorm';
import { TestMatchService } from '../src/test-match/test-match.service';
import { TemplateCacheService } from '../src/template/template-cache.service';

/**
 * test-match 핵심 쿼리(ATTR_SQL)의 Oracle 전용 SQL을 **실제 Oracle**에서 검증한다.
 * 모킹으로는 확인 불가한 부분: KEEP (DENSE_RANK FIRST …), REGEXP_LIKE, INCH/100,
 * substr CASE(속도기호), LEFT JOIN 미존재행(grv_depth null), 대표마켓(지역/OER md그룹).
 *
 * 기본 테스트에서 제외(별도 config `jest-db.json` + `pnpm api:test:db`). **Docker 필요.**
 * `ATTR_SQL`이 읽는 소스 객체(앱 소유 아님)는 픽스처 테이블로 생성/시드한다.
 */
const PASSWORD = 'tmdm';
const PDB = 'FREEPDB1';

const DDL = [
  `CREATE TABLE V_MCODE_INFO_4_HINT (
    MCODE VARCHAR2(50), ACTIVE_YN VARCHAR2(1), MAIN_MARKET VARCHAR2(10),
    PRODUCT_LINE VARCHAR2(20), SIZE_DESCRIPTION VARCHAR2(60), INCH NUMBER,
    LOAD_INDEX_SINGLE NUMBER, PLY_RATING NUMBER, TIRE_POSITION VARCHAR2(10),
    TL VARCHAR2(10), PRODUCT_SPEED_SYMBOL VARCHAR2(10), PATTERN VARCHAR2(60)
  )`,
  `CREATE TABLE V_PIC_MATTR_MDPT_INFO_4_HINT (
    MCODE VARCHAR2(50), MAIN_MKT VARCHAR2(200), SEGMENT VARCHAR2(100),
    FRT VARCHAR2(10), POR VARCHAR2(10), M_PLUS_S VARCHAR2(10),
    TIRE_SIZE VARCHAR2(60), THREE_PMSF VARCHAR2(10)
  )`,
  `CREATE TABLE DRW_PARAM_INFO (PRODUCTCODE VARCHAR2(50), MAINGROOVEDEPTH NUMBER)`,
  `CREATE TABLE DW_SPEC_PLM_TIRE (PRODUCT_CODE VARCHAR2(50), SIZE_SMPL VARCHAR2(60), SPEC_STATE VARCHAR2(20))`,
];

const SEED = [
  // MC1 — 지역마켓(K), radial, Release 스펙 선호, md.TIRE_SIZE 없음, winter via THREE_PMSF
  `INSERT INTO V_MCODE_INFO_4_HINT VALUES ('MC1','Y','K','TBR','11R22.5',2250,146,16,'D','TL','ZL','HL432')`,
  `INSERT INTO V_PIC_MATTR_MDPT_INFO_4_HINT VALUES ('MC1','K1','LongHaul,Regional','Y',NULL,NULL,NULL,'Y')`,
  `INSERT INTO DRW_PARAM_INFO VALUES ('MC1',12)`,
  `INSERT INTO DW_SPEC_PLM_TIRE VALUES ('MC1','11R22.5','Release')`,
  `INSERT INTO DW_SPEC_PLM_TIRE VALUES ('MC1','99R99.9','Draft')`,
  // MC2 — OEM main_market(2자리)→md그룹(EU), 속도기호 '1V'→'(V)', p행 없음(grv null),
  //        스펙 없음→normalizeSize 폴백, winter via PATTERN 'W'
  `INSERT INTO V_MCODE_INFO_4_HINT VALUES ('MC2','Y','50','PCR','205/55R16',1600,91,4,'F','TL','1V','SUMMERW')`,
  `INSERT INTO V_PIC_MATTR_MDPT_INFO_4_HINT VALUES ('MC2','E1,E2,NA','UHP',NULL,'Y',NULL,NULL,NULL)`,
  // MC3 — 비활성(ACTIVE_YN='N') → resolveTire null
  `INSERT INTO V_MCODE_INFO_4_HINT VALUES ('MC3','N','K','TBR','11R22.5',2250,146,16,'D','TL','ZL','HL432')`,
];

describe('test-match resolveTire (Oracle, DB)', () => {
  let container: StartedTestContainer;
  let dataSource: DataSource;
  let service: TestMatchService;

  beforeAll(async () => {
    container = await new GenericContainer('gvenzl/oracle-free:slim-faststart')
      .withEnvironment({
        ORACLE_PASSWORD: 'oracle',
        APP_USER: 'tmdm',
        APP_USER_PASSWORD: PASSWORD,
      })
      .withExposedPorts(1521)
      .withWaitStrategy(Wait.forLogMessage(/DATABASE IS READY TO USE/, 1))
      .withStartupTimeout(180_000)
      .start();

    dataSource = new DataSource({
      type: 'oracle',
      connectString: `${container.getHost()}:${container.getMappedPort(1521)}/${PDB}`,
      username: 'tmdm',
      password: PASSWORD,
      synchronize: false,
      logging: false,
    });
    await dataSource.initialize();
    for (const stmt of [...DDL, ...SEED]) await dataSource.query(stmt);
    await dataSource.query('COMMIT');

    service = new TestMatchService(
      dataSource,
      {} as unknown as TemplateCacheService,
    );
  }, 240_000);

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (container) await container.stop();
  });

  it('MC1: 지역마켓·radial·Release 스펙·치수 도출', async () => {
    const t = await service.resolveTire('MC1');
    expect(t).not.toBeNull();
    expect(t!.productLine).toBe('TBR');
    expect(t!.mainMarket).toBe('K');
    expect(t!.market).toEqual({ codes: ['K1'], source: 'region:K' });
    expect(t!.tireSize).toBe('11R22.5');
    // KEEP (DENSE_RANK FIRST … Release우선) → Draft 행 무시
    expect(t!.sizeSmpl).toBe('11R22.5');
    expect(t!.rimInch).toBe(22.5); // INCH/100
    expect(t!.ss).toBe('L'); // substr: 첫자 '1' 아님 → 둘째자
    expect(t!.li).toBe(146);
    expect(t!.ply).toBe(16);
    expect(t!.grvDepth).toBe(12);
    expect(t!.radialBias).toBe('R'); // REGEXP_LIKE
    expect([...t!.segment].sort()).toEqual(['LongHaul', 'Regional']);
    expect(t!.frt).toBe('Y');
    expect(t!.winter).toBe('Y'); // THREE_PMSF='Y'
    expect(t!.tirePosition).toBe('D');
    expect(t!.tlIndicator).toBe('TL');
  });

  it('MC2: OEM→md그룹(EU) 대표마켓·속도기호 괄호·LEFT JOIN null·규격 폴백', async () => {
    const t = await service.resolveTire('MC2');
    expect(t).not.toBeNull();
    expect([...t!.market.codes].sort()).toEqual(['E1', 'E2']);
    expect(t!.market.source).toBe('oem:50→md그룹:EU');
    expect(t!.ss).toBe('(V)'); // substr: 첫자 '1' → '('||둘째자||')'
    expect(t!.rimInch).toBe(16);
    expect(t!.grvDepth).toBeNull(); // p행 없음(LEFT JOIN)
    expect(t!.por).toBe('Y');
    expect(t!.frt).toBeNull();
    expect(t!.winter).toBe('Y'); // PATTERN 'W'
    // 스펙 미등재 → SIZE_DESCRIPTION normalizeSize 폴백
    expect(t!.sizeSmpl).toBe('205/55R16');
    expect(t!.radialBias).toBe('R');
  });

  it('비활성/미존재 mcode → null', async () => {
    expect(await service.resolveTire('MC3')).toBeNull(); // ACTIVE_YN='N'
    expect(await service.resolveTire('NOPE')).toBeNull();
  });
});

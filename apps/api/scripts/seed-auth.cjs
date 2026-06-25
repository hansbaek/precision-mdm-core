/**
 * 인증/권한 테이블 생성 + 시드 (멱등).
 * TMDM_ROLE / TMDM_USER / TMDM_MENU / TMDM_ROLE_MENU_PERM 을 생성하고
 * 기본 역할(ADMIN/EDITOR/VIEWER), 메뉴 카탈로그(사이드바 모듈+탭),
 * 역할별 권한 매트릭스, 초기 admin 사용자를 적재한다.
 *
 * 실행: ADMIN_PASSWORD='강력한_비밀번호' node scripts/seed-auth.cjs   (apps/api 에서, .env 필요)
 * 초기 admin 비밀번호: 환경변수 ADMIN_PASSWORD 또는 .env 의 ADMIN_PASSWORD
 *   (둘 다 없으면 admin 신규 생성 시 에러. 명령줄 값이 .env 보다 우선.)
 */
const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');
const bcrypt = require('bcryptjs');

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

// 명령줄 환경변수 우선, 없으면 .env 의 ADMIN_PASSWORD. 기본값은 없다.
// (admin 신규 생성이 필요한 경우에만 필수 — 아래에서 검사.)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || env.ADMIN_PASSWORD;

// [MENU_ID, PARENT_ID, MENU_TYPE, MENU_NM, I18N_KEY, SORT_ORDER]
const MENUS = [
  ['test-master', null, 'MODULE', '시험 항목 기준 마스터', 'app.nav.testMaster', 1],
  ['test-master.dashboard', 'test-master', 'TAB', '대시보드', 'app.tabs.dashboard', 1],
  ['test-master.test-match', 'test-master', 'TAB', '필요시험조회', 'app.tabs.testMatch', 2],
  ['test-master.analytics', 'test-master', 'TAB', '분석', 'app.tabs.analytics', 3],
  ['test-master.reports', 'test-master', 'TAB', '보고서', 'app.tabs.reports', 4],
  ['testing-protocols', null, 'MODULE', '시험 분류 마스터', 'app.nav.classificationMaster', 2],
  ['vehicle-config', null, 'MODULE', '차량 구성', 'app.nav.vehicleConfig', 4],
  ['data-audit', null, 'MODULE', '데이터 감사', 'app.nav.dataAudit', 5],
  ['admin', null, 'MODULE', '권한 관리', 'app.nav.admin', 99],
];

// 더 이상 사용하지 않는 메뉴. MERGE 는 삭제를 못 하므로 비활성화 + 권한 정리한다.
// (표준코드 관리는 admin 모듈 하위 탭으로, admin 권한을 재사용하므로 별도 메뉴 없음)
const OBSOLETE_MENU_IDS = ['material-specs'];

// [ROLE_ID, ROLE_NM, IS_SYSTEM_YN, SORT_ORDER]
const ROLES = [
  ['ADMIN', '관리자', 'Y', 1],
  ['EDITOR', '편집자', 'N', 2],
  ['VIEWER', '조회자', 'N', 3],
];

const allMenuIds = MENUS.map((m) => m[0]);
const nonAdminMenuIds = allMenuIds.filter((id) => id !== 'admin' && id !== 'data-audit');

// role → (menuId → [view, create, update, delete]). 누락 메뉴는 전부 N.
const VCUD = [true, true, true, true];
const V = [true, false, false, false];

const PERMS = {
  // ADMIN: 전 메뉴 전 권한
  ADMIN: Object.fromEntries(allMenuIds.map((id) => [id, VCUD])),
  // EDITOR: 데이터 메뉴 CRUD, admin 제외
  EDITOR: Object.fromEntries(nonAdminMenuIds.map((id) => [id, VCUD])),
  // VIEWER: 데이터 메뉴 조회만
  VIEWER: Object.fromEntries(nonAdminMenuIds.map((id) => [id, V])),
};

const yn = (b) => (b ? 'Y' : 'N');

(async () => {
  const conn = await oracledb.getConnection({
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    connectString: `${env.DB_HOST}:${env.DB_PORT}/${env.DB_SERVICE_NAME}`,
  });
  try {
    const tableExists = async (name) => {
      const r = await conn.execute(
        'SELECT COUNT(*) FROM USER_TABLES WHERE TABLE_NAME = :1',
        [name],
      );
      return r.rows[0][0] > 0;
    };
    const createIfAbsent = async (name, ddl) => {
      if (!(await tableExists(name))) {
        await conn.execute(ddl);
        console.log(`${name}: CREATE 완료`);
      } else {
        console.log(`${name}: 이미 존재 — CREATE 스킵`);
      }
    };

    await createIfAbsent(
      'TMDM_ROLE',
      `CREATE TABLE TMDM_ROLE (
        ROLE_ID       VARCHAR2(50)  NOT NULL,
        ROLE_NM       VARCHAR2(100) NOT NULL,
        IS_SYSTEM_YN  VARCHAR2(1)   DEFAULT 'N',
        SORT_ORDER    NUMBER,
        USE_YN        VARCHAR2(1)   DEFAULT 'Y',
        CONSTRAINT PK_TMDM_ROLE PRIMARY KEY (ROLE_ID)
      )`,
    );

    await createIfAbsent(
      'TMDM_USER',
      `CREATE TABLE TMDM_USER (
        USER_ID        VARCHAR2(50)  NOT NULL,
        USER_NM        VARCHAR2(100),
        USER_NM_ENG    VARCHAR2(100),
        TEAM_NM        VARCHAR2(100),
        TEAM_NM_ENG    VARCHAR2(100),
        PASSWORD_HASH  VARCHAR2(200),
        AUTH_SOURCE    VARCHAR2(10)  DEFAULT 'LOCAL',
        ROLE_ID        VARCHAR2(50),
        USE_YN         VARCHAR2(1)   DEFAULT 'Y',
        CREATED_AT     TIMESTAMP     DEFAULT SYSTIMESTAMP,
        UPDATED_AT     TIMESTAMP     DEFAULT SYSTIMESTAMP,
        CONSTRAINT PK_TMDM_USER PRIMARY KEY (USER_ID)
      )`,
    );

    await createIfAbsent(
      'TMDM_MENU',
      `CREATE TABLE TMDM_MENU (
        MENU_ID     VARCHAR2(100) NOT NULL,
        PARENT_ID   VARCHAR2(100),
        MENU_TYPE   VARCHAR2(10)  NOT NULL,
        MENU_NM     VARCHAR2(100),
        I18N_KEY    VARCHAR2(100),
        SORT_ORDER  NUMBER,
        USE_YN      VARCHAR2(1)   DEFAULT 'Y',
        CONSTRAINT PK_TMDM_MENU PRIMARY KEY (MENU_ID)
      )`,
    );

    await createIfAbsent(
      'TMDM_ROLE_MENU_PERM',
      `CREATE TABLE TMDM_ROLE_MENU_PERM (
        ROLE_ID        VARCHAR2(50)  NOT NULL,
        MENU_ID        VARCHAR2(100) NOT NULL,
        CAN_VIEW_YN    VARCHAR2(1)   DEFAULT 'N',
        CAN_CREATE_YN  VARCHAR2(1)   DEFAULT 'N',
        CAN_UPDATE_YN  VARCHAR2(1)   DEFAULT 'N',
        CAN_DELETE_YN  VARCHAR2(1)   DEFAULT 'N',
        CONSTRAINT PK_TMDM_ROLE_MENU_PERM PRIMARY KEY (ROLE_ID, MENU_ID)
      )`,
    );

    // --- MERGE 시드 (멱등): 존재하면 갱신, 없으면 삽입 ---
    for (const [id, parent, type, nm, i18n, sort] of MENUS) {
      await conn.execute(
        `MERGE INTO TMDM_MENU t USING (SELECT :id MENU_ID FROM DUAL) s
         ON (t.MENU_ID = s.MENU_ID)
         WHEN MATCHED THEN UPDATE SET PARENT_ID=:parent, MENU_TYPE=:type, MENU_NM=:nm, I18N_KEY=:i18n, SORT_ORDER=:sort, USE_YN='Y'
         WHEN NOT MATCHED THEN INSERT (MENU_ID, PARENT_ID, MENU_TYPE, MENU_NM, I18N_KEY, SORT_ORDER, USE_YN)
           VALUES (:id, :parent, :type, :nm, :i18n, :sort, 'Y')`,
        { id, parent, type, nm, i18n, sort },
      );
    }
    console.log(`TMDM_MENU 시드: ${MENUS.length}건 MERGE`);

    // 폐기 메뉴 정리: 권한 행 삭제 후 메뉴 비활성화(USE_YN='N').
    for (const id of OBSOLETE_MENU_IDS) {
      await conn.execute('DELETE FROM TMDM_ROLE_MENU_PERM WHERE MENU_ID = :id', {
        id,
      });
      const r = await conn.execute(
        `UPDATE TMDM_MENU SET USE_YN = 'N' WHERE MENU_ID = :id`,
        { id },
      );
      if (r.rowsAffected) console.log(`TMDM_MENU 폐기: ${id} 비활성화`);
    }

    for (const [id, nm, sys, sort] of ROLES) {
      await conn.execute(
        `MERGE INTO TMDM_ROLE t USING (SELECT :id ROLE_ID FROM DUAL) s
         ON (t.ROLE_ID = s.ROLE_ID)
         WHEN MATCHED THEN UPDATE SET ROLE_NM=:nm, IS_SYSTEM_YN=:sys, SORT_ORDER=:sort, USE_YN='Y'
         WHEN NOT MATCHED THEN INSERT (ROLE_ID, ROLE_NM, IS_SYSTEM_YN, SORT_ORDER, USE_YN)
           VALUES (:id, :nm, :sys, :sort, 'Y')`,
        { id, nm, sys, sort },
      );
    }
    console.log(`TMDM_ROLE 시드: ${ROLES.length}건 MERGE`);

    let permCount = 0;
    for (const [roleId, menuMap] of Object.entries(PERMS)) {
      for (const [menuId, [v, c, u, d]] of Object.entries(menuMap)) {
        await conn.execute(
          `MERGE INTO TMDM_ROLE_MENU_PERM t
             USING (SELECT :roleId ROLE_ID, :menuId MENU_ID FROM DUAL) s
             ON (t.ROLE_ID = s.ROLE_ID AND t.MENU_ID = s.MENU_ID)
           WHEN MATCHED THEN UPDATE SET CAN_VIEW_YN=:v, CAN_CREATE_YN=:c, CAN_UPDATE_YN=:u, CAN_DELETE_YN=:d
           WHEN NOT MATCHED THEN INSERT (ROLE_ID, MENU_ID, CAN_VIEW_YN, CAN_CREATE_YN, CAN_UPDATE_YN, CAN_DELETE_YN)
             VALUES (:roleId, :menuId, :v, :c, :u, :d)`,
          { roleId, menuId, v: yn(v), c: yn(c), u: yn(u), d: yn(d) },
        );
        permCount++;
      }
    }
    console.log(`TMDM_ROLE_MENU_PERM 시드: ${permCount}건 MERGE`);

    // 초기 admin 사용자 (없을 때만 생성 — 기존 비밀번호 보존)
    const adminExists = await conn.execute(
      `SELECT COUNT(*) FROM TMDM_USER WHERE USER_ID = 'admin'`,
    );
    if (adminExists.rows[0][0] === 0) {
      if (!ADMIN_PASSWORD) {
        throw new Error(
          "admin 계정을 생성하려면 ADMIN_PASSWORD 가 필요합니다. " +
            "명령줄(ADMIN_PASSWORD='강력한_비밀번호' node scripts/seed-auth.cjs) 또는 " +
            "apps/api/.env 에 ADMIN_PASSWORD=... 로 지정하십시오.",
        );
      }
      const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
      await conn.execute(
        `INSERT INTO TMDM_USER
           (USER_ID, USER_NM, USER_NM_ENG, TEAM_NM, TEAM_NM_ENG, PASSWORD_HASH, AUTH_SOURCE, ROLE_ID, USE_YN)
         VALUES ('admin', '관리자', 'Administrator', '시스템', 'System', :hash, 'LOCAL', 'ADMIN', 'Y')`,
        { hash },
      );
      // 보안상 비밀번호는 출력하지 않는다.
      console.log('admin 사용자 생성 완료 (비밀번호는 ADMIN_PASSWORD 로 설정됨)');
    } else {
      console.log('admin 사용자: 이미 존재 — 스킵');
    }

    await conn.commit();

    const counts = {};
    for (const t of ['TMDM_ROLE', 'TMDM_USER', 'TMDM_MENU', 'TMDM_ROLE_MENU_PERM']) {
      const r = await conn.execute(`SELECT COUNT(*) FROM ${t}`);
      counts[t] = r.rows[0][0];
    }
    console.log('검증 —', counts);
  } finally {
    await conn.close();
  }
})().catch((e) => {
  console.error('ERR:', e.message);
  process.exit(1);
});

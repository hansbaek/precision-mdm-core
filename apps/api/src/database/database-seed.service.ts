import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeedService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    await this.createTablesIfNotExist();
    await this.seedDataIfEmpty();
  }

  private async tableExists(tableName: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `SELECT COUNT(*) AS CNT FROM USER_TABLES WHERE TABLE_NAME = :1`,
      [tableName.toUpperCase()],
    );
    return Number(result[0]?.CNT ?? result[0]?.cnt ?? 0) > 0;
  }

  private async createTablesIfNotExist() {
    if (!(await this.tableExists('TMP_TEST_ITEMS'))) {
      await this.dataSource.query(`
        CREATE TABLE TMP_TEST_ITEMS (
          ID            VARCHAR2(20)   PRIMARY KEY,
          CATEGORY      VARCHAR2(100)  NOT NULL,
          NAME_KR       VARCHAR2(200)  NOT NULL,
          NAME_EN       VARCHAR2(200)  NOT NULL,
          SPECIFICATION VARCHAR2(200),
          UNIT          VARCHAR2(50),
          MANDATORY     VARCHAR2(20)   DEFAULT 'OPTIONAL' NOT NULL,
          LAST_UPDATED  VARCHAR2(20),
          STATUS        VARCHAR2(20)   DEFAULT 'Active'   NOT NULL,
          PRODUCT_LINES VARCHAR2(200),
          DESCRIPTION   VARCHAR2(2000),
          CREATED_BY    VARCHAR2(100)
        )
      `);
      this.logger.log('TMP_TEST_ITEMS 테이블 생성 완료');
    } else {
      this.logger.log('TMP_TEST_ITEMS 이미 존재');
    }

    if (!(await this.tableExists('TMP_AUDIT_LOGS'))) {
      await this.dataSource.query(`
        CREATE TABLE TMP_AUDIT_LOGS (
          ID          VARCHAR2(20)   PRIMARY KEY,
          ITEM_ID     VARCHAR2(20),
          ITEM_NAME   VARCHAR2(300),
          ACTION      VARCHAR2(30)   NOT NULL,
          DETAILS     VARCHAR2(1000),
          LOGGED_AT   VARCHAR2(30),
          OPERATED_BY VARCHAR2(100)
        )
      `);
      this.logger.log('TMP_AUDIT_LOGS 테이블 생성 완료');
    } else {
      this.logger.log('TMP_AUDIT_LOGS 이미 존재');
    }
  }

  private async seedDataIfEmpty() {
    const itemCount = await this.dataSource.query(
      `SELECT COUNT(*) AS CNT FROM TMP_TEST_ITEMS`,
    );
    const count = Number(itemCount[0]?.CNT ?? itemCount[0]?.cnt ?? 0);

    if (count > 0) {
      this.logger.log(`TMP_TEST_ITEMS 시드 건너뜀 (기존 ${count}건 존재)`);
      return;
    }

    this.logger.log('TMP_TEST_ITEMS 시드 데이터 삽입 시작');
    await this.insertTestItems();
    await this.insertAuditLogs();
    this.logger.log('시드 완료');
  }

  private async insertTestItems() {
    const items = [
      {
        id: 'T-10042', category: 'Material Strength',
        nameKr: '인장강도 테스트', nameEn: 'Tensile Strength Test',
        specification: 'ASTM D412', unit: 'MPa',
        mandatory: 'REQUIRED', lastUpdated: '2023-11-20',
        status: 'Active', productLines: 'PCR,LTR,TBR,EV',
        description: '고무 가황물의 인장 응력 변형 유동성 및 파단 연신율 정밀 측정 규격.',
        createdBy: 'hans.baek@gmail.com',
      },
      {
        id: 'T-10043', category: 'Durability',
        nameKr: '마모 수명 테스트', nameEn: 'Abrasion Life Test',
        specification: 'ISO 4649', unit: 'mm³',
        mandatory: 'OPTIONAL', lastUpdated: '2023-12-05',
        status: 'Active', productLines: 'PCR,LTR,RAC',
        description: '드럼식 회전 마모 시험기를 통하여 가황 고무의 상대적 마모 저항 지수를 측정.',
        createdBy: 'system.operator@hankook.com',
      },
      {
        id: 'T-10045', category: 'Noise & Vibration',
        nameKr: '노면 소음 분석', nameEn: 'Pass-by Noise Analysis',
        specification: 'ECE R117', unit: 'dB(A)',
        mandatory: 'REQUIRED', lastUpdated: '2024-01-12',
        status: 'Pending', productLines: 'PCR,EV',
        description: '주행 차량의 외부 보행자 인지 소음 측정을 위한 노면 고주파수 음압 분석 규정.',
        createdBy: 'junior.engineer@hankook.com',
      },
      {
        id: 'T-10048', category: 'Aerodynamics',
        nameKr: '공기 저항 계수', nameEn: 'Drag Coefficient Evaluation',
        specification: 'HK-STD-009', unit: 'Cd',
        mandatory: 'OPTIONAL', lastUpdated: '2023-10-15',
        status: 'Inactive', productLines: 'EV,RAC',
        description: '풍동 실험실 내 고정 제어 환경에서 타이어 휠 형상에 따른 유동 저항 평가.',
        createdBy: 'hans.baek@gmail.com',
      },
      {
        id: 'T-10051', category: 'Material Strength',
        nameKr: '압축 영구 변형 테스트', nameEn: 'Compression Set Test',
        specification: 'ASTM D395', unit: '%',
        mandatory: 'REQUIRED', lastUpdated: '2023-11-28',
        status: 'Active', productLines: 'PCR,LTR,TBR',
        description: '고온 장시간 압축 상태에서 가황 고무 비탄성 복원 회복 능력 평가.',
        createdBy: 'system.operator@hankook.com',
      },
      {
        id: 'T-10055', category: 'Durability',
        nameKr: '초고속 주행 신뢰성 시험', nameEn: 'High Speed Durability Race',
        specification: 'FMVSS 139', unit: 'hr',
        mandatory: 'REQUIRED', lastUpdated: '2024-02-14',
        status: 'Active', productLines: 'PCR,RAC,EV',
        description: '실내 스텝 업 조건 하에 타이어 구조적 이탈 및 박리 임계 속도 검증.',
        createdBy: 'senior.analyst@hankook.com',
      },
      {
        id: 'T-10058', category: 'Thermal Performance',
        nameKr: '타이어 발열 축적 검증', nameEn: 'Heat Buildup and Flexing',
        specification: 'ASTM D623', unit: '°C',
        mandatory: 'OPTIONAL', lastUpdated: '2023-09-18',
        status: 'Inactive', productLines: 'TBR,LTR',
        description: '압축 플렉소미터를 이용한 타이어 트레드 고무의 내부 온도 변화량 추적.',
        createdBy: 'system.operator@hankook.com',
      },
      {
        id: 'T-10061', category: 'Wet Grip Grip Performance',
        nameKr: '젖은 노면 제동 테스트', nameEn: 'Wet Grip Rating Evaluation',
        specification: 'ISO 23671', unit: 'G',
        mandatory: 'REQUIRED', lastUpdated: '2024-03-01',
        status: 'Active', productLines: 'PCR,LTR,EV',
        description: '표준 계측 트레일러 주행을 통한 아스팔트 살수 표면 동마찰 계수 역학 분석.',
        createdBy: 'hans.baek@gmail.com',
      },
      {
        id: 'T-10064', category: 'Tread Pattern Strength',
        nameKr: '블록 강성 하중 측정', nameEn: 'Tread Block Stiffness Test',
        specification: 'HK-STD-021', unit: 'N/mm',
        mandatory: 'OPTIONAL', lastUpdated: '2024-03-20',
        status: 'Pending', productLines: 'PCR,RAC',
        description: '트레드 단일 패턴 형상의 정적/동적 횡방향 탄성 복원 하중 한계 계측.',
        createdBy: 'junior.engineer@hankook.com',
      },
      {
        id: 'T-10068', category: 'Aerodynamics',
        nameKr: '타이어 측면 와류 난류 관찰', nameEn: 'Sidewall Turbulence Flow Test',
        specification: 'ISO 12211', unit: 'm/s',
        mandatory: 'OPTIONAL', lastUpdated: '2023-08-11',
        status: 'Active', productLines: 'EV',
        description: '전기차 전용 저소음 타이어를 타겟으로 사이드월 문자 각인 굴곡 주변의 난류 흐름 계측.',
        createdBy: 'senior.analyst@hankook.com',
      },
      {
        id: 'T-10072', category: 'High Speed Uniformity',
        nameKr: '고속 균일성 회전 발란스', nameEn: 'High Speed Uniformity Standard',
        specification: 'SAE J1261', unit: 'N',
        mandatory: 'REQUIRED', lastUpdated: '2024-04-05',
        status: 'Active', productLines: 'PCR,EV,LTR,TBR',
        description: '진동 및 흔들림 최소화를 위해 고속 회전 시 타이어 강성과 형상의 방사상 균일 정렬 측정.',
        createdBy: 'system.operator@hankook.com',
      },
      {
        id: 'T-10075', category: 'Thermal Performance',
        nameKr: '저온 메사 취화 부서짐 검사', nameEn: 'Low Temperature Brittleness',
        specification: 'ASTM D2137', unit: '°C',
        mandatory: 'REQUIRED', lastUpdated: '2023-12-25',
        status: 'Active', productLines: 'PCR,LTR,TBR,RAC',
        description: '극한 냉각 오일조 속에서 가속 충격 가할 시 고무 시편 균열 시점 온도 탐색.',
        createdBy: 'hans.baek@gmail.com',
      },
    ];

    for (const item of items) {
      await this.dataSource.query(
        `INSERT INTO TMP_TEST_ITEMS
          (ID, CATEGORY, NAME_KR, NAME_EN, SPECIFICATION, UNIT,
           MANDATORY, LAST_UPDATED, STATUS, PRODUCT_LINES, DESCRIPTION, CREATED_BY)
         VALUES (:1,:2,:3,:4,:5,:6,:7,:8,:9,:10,:11,:12)`,
        [
          item.id, item.category, item.nameKr, item.nameEn,
          item.specification, item.unit, item.mandatory, item.lastUpdated,
          item.status, item.productLines, item.description, item.createdBy,
        ],
      );
    }
    this.logger.log(`TMP_TEST_ITEMS ${items.length}건 삽입 완료`);
  }

  private async insertAuditLogs() {
    const logs = [
      {
        id: 'LOG-001', itemId: 'T-10042',
        itemName: '인장강도 테스트 (Tensile Strength)',
        action: 'CREATE',
        details: '신규모듈 최초 항목 등록: ASTM D412 규격 지정',
        loggedAt: '2023-11-20 10:14:22',
        operatedBy: 'hans.baek@gmail.com',
      },
      {
        id: 'LOG-002', itemId: 'T-10045',
        itemName: '노면 소음 분석',
        action: 'UPDATE',
        details: '규격 사양 갱신: ECE R117 02 계열 반영',
        loggedAt: '2024-01-12 14:32:00',
        operatedBy: 'junior.engineer@hankook.com',
      },
      {
        id: 'LOG-003', itemId: 'T-10048',
        itemName: '공기 저항 계수',
        action: 'STATUS_CHANGE',
        details: '양산 적용 홀딩으로 인하여 인액티브(Inactive) 상태로 전환',
        loggedAt: '2023-10-15 17:05:10',
        operatedBy: 'hans.baek@gmail.com',
      },
      {
        id: 'LOG-004', itemId: 'T-10051',
        itemName: '압축 영구 변형 테스트',
        action: 'CREATE',
        details: '신규 가황 고무 품질 기준 표준 검증 데이터 삽입',
        loggedAt: '2023-11-28 09:12:45',
        operatedBy: 'system.operator@hankook.com',
      },
      {
        id: 'LOG-005', itemId: 'T-10061',
        itemName: '젖은 노면 제동 테스트',
        action: 'CREATE',
        details: '친환경/전기차 타이어 젖은 노면 제동 등급 강제 항목 등록',
        loggedAt: '2024-03-01 11:45:30',
        operatedBy: 'hans.baek@gmail.com',
      },
    ];

    for (const log of logs) {
      await this.dataSource.query(
        `INSERT INTO TMP_AUDIT_LOGS
          (ID, ITEM_ID, ITEM_NAME, ACTION, DETAILS, LOGGED_AT, OPERATED_BY)
         VALUES (:1,:2,:3,:4,:5,:6,:7)`,
        [
          log.id, log.itemId, log.itemName, log.action,
          log.details, log.loggedAt, log.operatedBy,
        ],
      );
    }
    this.logger.log(`TMP_AUDIT_LOGS ${logs.length}건 삽입 완료`);
  }
}

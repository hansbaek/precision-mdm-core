import type { EditGroup } from './types';

/** 선언적 필드 그룹 정의 — EditSection 이 렌더한다. (Section 2·3 은 전용 컴포넌트) */
export const EDIT_GROUPS: EditGroup[] = [
  {
    title: '1. 기본 식별 정보',
    description: '제품 라인은 수정 가능하며, 템플릿 ID는 하단 읽기 전용 정보로 표시합니다.',
    fields: [
      {
        key: 'productLine',
        column: 'PRODUCT_LINE',
        label: '제품 라인 (PCR/LTR/TBR)',
        mono: true,
        type: 'select',
        codeGrp: 'PRODUCT_LINE',
      },
    ],
  },
  {
    title: '3-1. 인증 상세 (코드/구분)',
    description:
      'CERTI_TYPE_ID는 인증 유형 고유번호(코드), CERTI_REGULATION_TYPE은 인증/법규/내부 시험 구분입니다.',
    fields: [
      {
        key: 'certiRegulationType',
        column: 'CERTI_REGULATION_TYPE',
        label: '인증/법규/내부 구분',
      },
      {
        key: 'certiTypeId',
        column: 'CERTI_TYPE_ID',
        label: '인증 유형 고유번호',
        mono: true,
      },
    ],
  },
  {
    title: '4. 특수 시험 속성',
    description: '특수 시험 속성 플래그를 수정합니다. (인증 정보는 3. 시장 적용 정보로 이동)',
    fields: [
      { key: 'tempTire', column: 'TEMP_TIRE', label: '스페어(임시)타이어 여부', type: 'flag' },
      { key: 'snowMark', column: 'SNOW_MARK', label: '스노우 마크 여부', type: 'flag' },
      { key: 'frt', column: 'FRT', label: 'Free Rolling Tire 여부', type: 'flag' },
      { key: 'utqg', column: 'UTQG', label: 'UTQG 여부', type: 'flag' },
      {
        key: 'por',
        column: 'POR',
        label: 'Professional Off Road Tire (Y→S / N→공백)',
        type: 'flag',
        flagOn: 'S',
        flagOff: '',
      },
    ],
  },
  {
    title: '5. 타이어 구조 / 기본 스펙 조건',
    description: '1줄: 속도 기호 / 2줄: 림·그루브·하중·플라이 범위 / 3줄: 구조·TL 구분.',
    fields: [
      // 1줄 — 속도 기호 (전체 폭, 다중 선택)
      {
        key: 'ss',
        column: 'SS',
        label: '속도 기호 (다중 선택 · 콤마 구분)',
        type: 'multi',
        codeGrp: 'SPEED_SYMBOL',
        separator: ',',
        defaultHighlight: 'T',
        full: true,
      },
      // 2줄 — 범위 입력 항목 4개
      { key: 'rimInch', column: 'RIM_INCH', label: '림 인치 조건', type: 'range', unit: 'inch' },
      { key: 'grvDepth', column: 'GRV_DEPTH', label: '그루브 깊이 조건', type: 'range', unit: 'mm' },
      { key: 'li', column: 'LI', label: '하중 지수 조건', type: 'range', unit: 'LI' },
      { key: 'plyRating', column: 'PLY_RATING', label: '플라이 레이팅', type: 'range', unit: 'PR' },
      // 3줄 — 구조 / TL 구분
      {
        key: 'radialBias',
        column: 'RADIAL_BIAS',
        label: '레이디얼/바이어스 (R/B · 미지정 가능)',
        mono: true,
        type: 'select',
        codeGrp: 'RADIAL_BIAS',
      },
      {
        key: 'tlIndicator',
        column: 'TL_INDICATOR',
        label: 'TL 지시자',
        mono: true,
        type: 'select',
        codeGrp: 'TL_INDICATOR',
      },
    ],
  },
  {
    title: '6. TBR 전용 조건',
    description: 'TBR 포지션, 그루브, 세그먼트, 바코드당 항목 수 조건입니다.',
    requiresProductLine: 'TBR',
    fields: [
      {
        key: 'tbrPosition',
        column: 'TBR_POSITION',
        label: 'TBR 포지션 (A:All / D:Drive / T:Trailer)',
        type: 'multi',
        codeGrp: 'TBR_POSITION',
      },
      { key: 'tbrGrv3', column: 'TBR_GRV_3', label: 'TBR 3번 그루브 여부', type: 'flag' },
      {
        key: 'tbrSegment',
        column: 'TBR_SEGMENT',
        label: 'TBR 세그먼트',
        type: 'multi',
        codeGrp: 'TBR_SEGMENT',
      },
      {
        key: 'tbrItemCntPerBarcode',
        column: 'TBR_ITEM_CNT_PER_BARCODE',
        label: 'TBR 바코드당 시험 항목 수',
        mono: true,
        type: 'select',
        codeGrp: 'TBR_ITEM_CNT_PER_BARCODE',
      },
    ],
  },
  {
    title: '7. 사이즈 / 샘플 조건',
    description: '신규 사이즈 여부와 특정 사이즈 샘플 지정 조건입니다.',
    fields: [
      { key: 'newSizeYn', column: 'NEW_SIZE_YN', label: '신규 사이즈 여부', type: 'flag' },
      { key: 'sizeSmpl', column: 'SIZE_SMPL', label: '특정 사이즈 샘플 지정', mono: true, wide: true },
    ],
  },
];

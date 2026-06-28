/** STD 시험항목 편집 폼의 필드 상태(모든 값은 문자열). */
export type FormState = {
  productLine: string;
  testItemName: string;
  testMethod: string;
  testCondition: string;
  cdnPattern: string;
  endurSvrty: string;
  certiTestYn: string;
  certiType: string;
  certiRegulationType: string;
  certiTypeId: string;
  tempTire: string;
  snowMark: string;
  frt: string;
  utqg: string;
  por: string;
  radialBias: string;
  rimInch: string;
  grvDepth: string;
  ss: string;
  li: string;
  plyRating: string;
  tlIndicator: string;
  tbrPosition: string;
  tbrGrv3: string;
  tbrSegment: string;
  tbrItemCntPerBarcode: string;
  newSizeYn: string;
  sizeSmpl: string;
};

export type EditFieldType = 'text' | 'select' | 'flag' | 'multi' | 'range';

export type EditFieldConfig = {
  key: keyof FormState;
  column: string;
  label: string;
  mono?: boolean;
  wide?: boolean;
  /** Span the full grid row (all 4 columns on xl). */
  full?: boolean;
  /** Input widget — defaults to free text. */
  type?: EditFieldType;
  /** DW_STD_CODE group backing 'select'/'multi' option lists. */
  codeGrp?: string;
  /** 'multi' token separator — defaults to ', '. */
  separator?: string;
  /** 'multi' option highlighted by default when the list opens. */
  defaultHighlight?: string;
  /** 'range' unit hint shown after the value (e.g. 'inch', 'mm', 'LI', 'PR'). */
  unit?: string;
  /** 'flag' value mapping — Y stores flagOn, N stores flagOff (e.g. POR: 'S'/''). */
  flagOn?: string;
  flagOff?: string;
};

export type EditGroup = {
  title: string;
  description: string;
  fields: EditFieldConfig[];
  /** Section is editable only when PRODUCT_LINE equals this value (e.g. 'TBR'). */
  requiresProductLine?: string;
};

export const EMPTY_FORM: FormState = {
  productLine: '',
  testItemName: '',
  testMethod: '',
  testCondition: '',
  cdnPattern: '',
  endurSvrty: '',
  certiTestYn: '',
  certiType: '',
  certiRegulationType: '',
  certiTypeId: '',
  tempTire: '',
  snowMark: '',
  frt: '',
  utqg: '',
  por: '',
  radialBias: '',
  rimInch: '',
  grvDepth: '',
  ss: '',
  li: '',
  plyRating: '',
  tlIndicator: '',
  tbrPosition: '',
  tbrGrv3: '',
  tbrSegment: '',
  tbrItemCntPerBarcode: '',
  newSizeYn: '',
  sizeSmpl: '',
};

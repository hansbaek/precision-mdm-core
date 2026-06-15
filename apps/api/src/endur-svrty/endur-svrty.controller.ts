import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EndurSvrtyService } from './endur-svrty.service';

@ApiTags('endur-svrty')
@Controller('endur-svrty')
export class EndurSvrtyController {
  constructor(private readonly service: EndurSvrtyService) {}

  @Get('suggest')
  @ApiOperation({
    summary: '시장 기반 내구 가혹도 제안',
    description:
      '선택 시장에 적용되는 법규의 가혹도 순위([별첨11])에서 최고 가혹도(최소 rank)를 제안. US 포함 시 필수 시험 경고 동반.',
  })
  @ApiQuery({
    name: 'productLine',
    required: true,
    description: 'PCR | LTR | TBR',
  })
  @ApiQuery({
    name: 'markets',
    required: true,
    description: '콤마 구분 마켓 코드 (예: E1,NA)',
  })
  @ApiQuery({
    name: 'testMethod',
    required: false,
    description: '시험 방법명 (HS/GE 도출용)',
  })
  @ApiQuery({
    name: 'ss',
    required: false,
    description: '속도 기호 목록 (LTR 속도등급 도출용)',
  })
  suggest(
    @Query('productLine') productLine?: string,
    @Query('markets') markets?: string,
    @Query('testMethod') testMethod?: string,
    @Query('ss') ss?: string,
  ) {
    if (!productLine) {
      throw new BadRequestException('productLine 파라미터가 필요합니다.');
    }
    return this.service.suggest(productLine, markets ?? '', testMethod, ss);
  }

  @Get('suggest-certi-type')
  @ApiOperation({
    summary: '시장 기반 인증유형(CERTI_TYPE) 제안',
    description:
      '선택 시장에 매핑된 법규 코드(DW_REGULATION_MARKET_MAP)를 인증유형으로 제안. 매핑 없는 시장은 별도 표기.',
  })
  @ApiQuery({
    name: 'markets',
    required: true,
    description: '콤마 구분 마켓 코드 (예: E1,NA)',
  })
  suggestCertiType(@Query('markets') markets?: string) {
    return this.service.suggestCertiType(markets ?? '');
  }

  @Get('regulations')
  @ApiOperation({
    summary: '규제 코드 목록 (CERTI_TYPE 콤보 소스)',
    description: 'DW_REGULATION_MARKET_MAP의 distinct REGULATION_CODE.',
  })
  findRegulations() {
    return this.service.findRegulations();
  }

  @Get('ranks')
  @ApiOperation({ summary: '가혹도 순위 마스터 전체 목록 (검증·관리용)' })
  findRanks() {
    return this.service.findRanks();
  }
}

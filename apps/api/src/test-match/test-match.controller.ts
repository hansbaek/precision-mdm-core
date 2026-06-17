import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TestMatchService } from './test-match.service';

@ApiTags('test-match')
@Controller('test-match')
export class TestMatchController {
  constructor(private readonly service: TestMatchService) {}

  @Get()
  @ApiOperation({
    summary: 'mcode 기준 필요 시험 매칭',
    description:
      'mcode(product_code)의 타이어 속성(제품라인·대표마켓·치수·구조 등)을 도출해 ' +
      'TEMPLATE_STD_TEST_ITEM 조건과 대조, 수행해야 할 시험 목록을 반환. ' +
      '값이 있으나 평가 불가한 조건은 unevaluated 로 표기(행은 포함).',
  })
  @ApiQuery({ name: 'mcode', required: true, description: '제품 코드(mcode)' })
  match(@Query('mcode') mcode?: string) {
    const mc = (mcode ?? '').trim();
    if (!mc) throw new BadRequestException('mcode 파라미터가 필요합니다.');
    return this.service.match(mc);
  }

  @Get('tire')
  @ApiOperation({
    summary: 'mcode 정규화 속성 조회 (디버그/검증용)',
    description: '매칭 없이 타이어 속성 도출 결과만 반환.',
  })
  @ApiQuery({ name: 'mcode', required: true, description: '제품 코드(mcode)' })
  async tire(@Query('mcode') mcode?: string) {
    const mc = (mcode ?? '').trim();
    if (!mc) throw new BadRequestException('mcode 파라미터가 필요합니다.');
    const tire = await this.service.resolveTire(mc);
    if (!tire) throw new BadRequestException(`mcode '${mc}' 정보 없음.`);
    return tire;
  }

  @Get('export')
  @ApiOperation({
    summary: 'mcode 필요시험 보고서 xlsx 다운로드',
    description: '매칭 결과(시험·추출이유·미평가)를 Excel로 출력.',
  })
  @ApiQuery({ name: 'mcode', required: true, description: '제품 코드(mcode)' })
  async export(@Query('mcode') mcode: string, @Res() res: Response) {
    const mc = (mcode ?? '').trim();
    if (!mc) throw new BadRequestException('mcode 파라미터가 필요합니다.');
    const buffer = await this.service.buildReportXlsx(mc); // 404 전파
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="test-match-${mc}.xlsx"`,
    );
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }
}

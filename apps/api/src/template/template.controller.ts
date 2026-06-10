import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { TemplateService } from './template.service';
import { UpdateStdTestItemDto } from './dto/update-std-test-item.dto';

@ApiTags('template')
@Controller('template')
export class TemplateController {
  constructor(private readonly service: TemplateService) {}

  @Get('std-test-items')
  @ApiOperation({ summary: 'TEMPLATE_STD_TEST_ITEM 목록 조회 (필터 지원)' })
  @ApiQuery({ name: 'productLine', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'markets',
    required: false,
    description: '콤마/스페이스 구분 시장 코드 (예: A0,K1 NA)',
  })
  findAll(
    @Query('productLine') productLine?: string,
    @Query('search') search?: string,
    @Query('markets') markets?: string,
  ) {
    return this.service.findAllStdTestItems({ productLine, search, markets });
  }

  @Get('stats')
  @ApiOperation({
    summary: 'TEMPLATE_STD_TEST_ITEM 집계 통계 (Analytics/Reports)',
  })
  getStats() {
    return this.service.getStats();
  }

  @Get('std-test-items/:id')
  @ApiOperation({ summary: 'TEMPLATE_STD_TEST_ITEM 단건 조회' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneStdTestItem(id);
  }

  @Patch('std-test-items/:id')
  @ApiOperation({ summary: 'TEMPLATE_STD_TEST_ITEM 수정' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStdTestItemDto,
  ) {
    return this.service.updateStdTestItem(id, dto);
  }

  @Get('download')
  @ApiOperation({ summary: 'TEMPLATE_STD_TEST_ITEM xlsx 다운로드' })
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.service.generateTemplateXlsx();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="TEMPLATE_STD_TEST_ITEM.xlsx"',
    );
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }
}

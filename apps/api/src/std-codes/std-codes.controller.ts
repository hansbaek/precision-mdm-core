import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { StdCodesService } from './std-codes.service';

@ApiTags('std-codes')
@Controller('std-codes')
export class StdCodesController {
  constructor(private readonly service: StdCodesService) {}

  @Get()
  @ApiOperation({ summary: '표준 코드 목록 조회' })
  @ApiQuery({
    name: 'grpId',
    required: true,
    description: 'CODE_GRP_ID (예: PRODUCT_LINE)',
  })
  @ApiQuery({
    name: 'level',
    required: false,
    description: 'CODE_LVL 필터 (예: 2, 최대: 5)',
  })
  findByGroupId(
    @Query('grpId') grpId: string,
    @Query('level', new ParseIntPipe({ optional: true })) level?: number,
  ) {
    return this.service.findByGroupId(grpId, level);
  }
}

import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TestClassificationService } from './test-classification.service';

@ApiTags('test-classification')
@Controller('test-classification')
export class TestClassificationController {
  constructor(private readonly service: TestClassificationService) {}

  @Get('list')
  @ApiOperation({
    summary: '분류 마스터 전체 목록 (관리/표시 화면)',
    description: 'DW_HNT_CLASSIFICATION 행 목록. mode/group/item + 명칭 검색 필터.',
  })
  @ApiQuery({ name: 'mode', required: false })
  @ApiQuery({ name: 'group', required: false })
  @ApiQuery({ name: 'item', required: false })
  @ApiQuery({ name: 'search', required: false, description: '명칭 부분검색' })
  findAll(
    @Query('mode') mode?: string,
    @Query('group') group?: string,
    @Query('item') item?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({ mode, group, item, search });
  }

  @Get('modes')
  @ApiOperation({ summary: '모드 목록 (필터 드롭다운 소스)' })
  findModes() {
    return this.service.findModes();
  }

  @Get('groups')
  @ApiOperation({ summary: '시험 그룹 목록 (DW_HNT_CLASSIFICATION)' })
  @ApiQuery({ name: 'mode', required: false, description: "기본값 'Indoor'" })
  findGroups(@Query('mode') mode?: string) {
    return this.service.findGroups(mode);
  }

  @Get('items')
  @ApiOperation({ summary: '시험 항목 목록 (그룹 필터 가능)' })
  @ApiQuery({ name: 'mode', required: false, description: "기본값 'Indoor'" })
  @ApiQuery({ name: 'group', required: false })
  findItems(@Query('mode') mode?: string, @Query('group') group?: string) {
    return this.service.findItems(mode, group);
  }

  @Get('methods')
  @ApiOperation({ summary: '시험 방법 목록 (항목 필수)' })
  @ApiQuery({ name: 'item', required: true })
  @ApiQuery({ name: 'mode', required: false, description: "기본값 'Indoor'" })
  @ApiQuery({ name: 'group', required: false })
  findMethods(
    @Query('item') item?: string,
    @Query('mode') mode?: string,
    @Query('group') group?: string,
  ) {
    if (!item) throw new BadRequestException('item 파라미터가 필요합니다.');
    return this.service.findMethods(item, mode, group);
  }

  @Get('conditions')
  @ApiOperation({ summary: '시험 조건 목록 (항목·방법 필수)' })
  @ApiQuery({ name: 'item', required: true })
  @ApiQuery({ name: 'method', required: true })
  @ApiQuery({ name: 'mode', required: false, description: "기본값 'Indoor'" })
  @ApiQuery({ name: 'group', required: false })
  findConditions(
    @Query('item') item?: string,
    @Query('method') method?: string,
    @Query('mode') mode?: string,
    @Query('group') group?: string,
  ) {
    if (!item) throw new BadRequestException('item 파라미터가 필요합니다.');
    if (!method) throw new BadRequestException('method 파라미터가 필요합니다.');
    return this.service.findConditions(item, method, mode, group);
  }
}

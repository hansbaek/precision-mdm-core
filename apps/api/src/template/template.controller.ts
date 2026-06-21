import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { TemplateService } from './template.service';
import { TemplateUploadService } from './template-upload.service';
import { UpdateStdTestItemDto } from './dto/update-std-test-item.dto';
import { CreateStdTestItemDto } from './dto/create-std-test-item.dto';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { ChangeRequestsService } from '../change-requests/change-requests.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

/** 시험항목기준마스터 데이터는 대시보드 탭에 귀속된다. */
const DASHBOARD_MENU = 'test-master.dashboard';

const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

const UPLOAD_BODY_SCHEMA = {
  schema: {
    type: 'object' as const,
    properties: {
      file: { type: 'string' as const, format: 'binary' as const },
    },
    required: ['file'],
  },
};

@ApiTags('template')
@Controller('template')
export class TemplateController {
  constructor(
    private readonly service: TemplateService,
    private readonly uploadService: TemplateUploadService,
    @Inject(forwardRef(() => ChangeRequestsService))
    private readonly changeRequests: ChangeRequestsService,
  ) {}

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

  @Post('std-test-items')
  @RequirePermission(DASHBOARD_MENU, 'create')
  @ApiOperation({
    summary: 'TEMPLATE_STD_TEST_ITEM 신규 생성 (승인 워크플로 적용)',
    description:
      '승인권자는 즉시 반영, 그 외 사용자는 승인 대기로 등록된다. 응답 applied=false 이면 crId 로 대기 등록됨.',
  })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateStdTestItemDto) {
    return this.changeRequests.submitStdChange(user, {
      operation: 'CREATE',
      payload: dto,
      summary: `생성: ${dto.productLine} / ${dto.testItemName}`,
    });
  }

  @Patch('std-test-items/:id')
  @RequirePermission(DASHBOARD_MENU, 'update')
  @ApiOperation({ summary: 'TEMPLATE_STD_TEST_ITEM 수정 (승인 워크플로 적용)' })
  update(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStdTestItemDto,
  ) {
    return this.changeRequests.submitStdChange(user, {
      operation: 'UPDATE',
      targetId: id,
      payload: dto,
      summary: `수정: 항목 #${id}`,
    });
  }

  @Delete('std-test-items/:id')
  @RequirePermission(DASHBOARD_MENU, 'delete')
  @ApiOperation({ summary: 'TEMPLATE_STD_TEST_ITEM 삭제 (승인 워크플로 적용)' })
  remove(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.changeRequests.submitStdChange(user, {
      operation: 'DELETE',
      targetId: id,
      summary: `삭제: 항목 #${id}`,
    });
  }

  @Post('upload/preview')
  @ApiOperation({
    summary: 'xlsx 업로드 동기화 미리보기 (DB 쓰기 없음)',
    description:
      'TMPLT_ID 기준 diff: 빈 ID=추가, 변경 셀=수정, 파일에 없는 DB 행=삭제. 검증 오류가 있으면 valid=false.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody(UPLOAD_BODY_SCHEMA)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: UPLOAD_MAX_BYTES } }),
  )
  previewUpload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('file 필드가 필요합니다.');
    return this.uploadService.preview(file.buffer);
  }

  @Post('upload/apply')
  @RequirePermission(DASHBOARD_MENU, 'update')
  @ApiOperation({
    summary: 'xlsx 업로드 동기화 적용 (단일 트랜잭션)',
    description:
      '파일을 다시 받아 재diff 후 INSERT/UPDATE/DELETE를 한 트랜잭션으로 적용. 대량 삭제(>50%)는 force=true 필요(없으면 409).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody(UPLOAD_BODY_SCHEMA)
  @ApiQuery({
    name: 'force',
    required: false,
    description: '대량 삭제 경고를 무시하고 적용하려면 true',
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: UPLOAD_MAX_BYTES } }),
  )
  applyUpload(
    @CurrentUser() user: JwtUser,
    @UploadedFile() file?: Express.Multer.File,
    @Query('force') force?: string,
  ) {
    if (!file) throw new BadRequestException('file 필드가 필요합니다.');
    return this.uploadService.apply(file.buffer, force === 'true', user.userId);
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

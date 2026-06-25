import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import {
  CreateStdCodeDto,
  MoveStdCodeDto,
  UpdateStdCodeDto,
} from './dto/std-code.dto';
import { StdCodesService } from './std-codes.service';

@ApiTags('std-codes')
@Controller('std-codes')
export class StdCodesController {
  constructor(private readonly service: StdCodesService) {}

  @Get()
  @ApiOperation({ summary: '표준 코드 목록 조회(드롭다운 참조용)' })
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

  // ---------- 관리(표준코드 관리) — admin 권한 ----------
  @Get('groups')
  @RequirePermission('admin', 'view')
  @ApiOperation({ summary: '코드 그룹 목록(관리)' })
  listGroups() {
    return this.service.listGroups();
  }

  @Get('tree')
  @RequirePermission('admin', 'view')
  @ApiOperation({ summary: '그룹 코드 트리 조회(관리)' })
  @ApiQuery({ name: 'grpId', required: true, description: 'CODE_GRP_ID' })
  getTree(@Query('grpId') grpId: string) {
    return this.service.getTree(grpId);
  }

  @Post()
  @RequirePermission('admin', 'create')
  @ApiOperation({ summary: '표준코드 생성(관리)' })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateStdCodeDto) {
    return this.service.create(dto, user.userId);
  }

  @Patch(':grpId/:lvl/:cd')
  @RequirePermission('admin', 'update')
  @ApiOperation({ summary: '표준코드 수정(관리)' })
  update(
    @CurrentUser() user: JwtUser,
    @Param('grpId') grpId: string,
    @Param('lvl', ParseIntPipe) lvl: number,
    @Param('cd') cd: string,
    @Body() dto: UpdateStdCodeDto,
  ) {
    return this.service.update(grpId, lvl, cd, dto, user.userId);
  }

  @Patch(':grpId/:lvl/:cd/move')
  @RequirePermission('admin', 'update')
  @ApiOperation({ summary: '표준코드 이동/정렬(트리 드래그, 관리)' })
  async move(
    @CurrentUser() user: JwtUser,
    @Param('grpId') grpId: string,
    @Param('lvl', ParseIntPipe) lvl: number,
    @Param('cd') cd: string,
    @Body() dto: MoveStdCodeDto,
  ) {
    await this.service.move(grpId, lvl, cd, dto, user.userId);
    return { ok: true };
  }

  @Delete(':grpId/:lvl/:cd')
  @RequirePermission('admin', 'delete')
  @ApiOperation({ summary: '표준코드 삭제(비활성, 관리)' })
  async remove(
    @CurrentUser() user: JwtUser,
    @Param('grpId') grpId: string,
    @Param('lvl', ParseIntPipe) lvl: number,
    @Param('cd') cd: string,
  ) {
    await this.service.remove(grpId, lvl, cd, user.userId);
    return { ok: true };
  }
}

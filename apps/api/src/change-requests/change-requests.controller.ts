import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import {
  ChangeRequestsService,
  ChangeRequestView,
  STD_MENU,
} from './change-requests.service';
import { ReviewDto } from './dto/review.dto';

interface CommonReturn<T> {
  ok: boolean;
  result?: T;
  error?: string;
}

@ApiTags('change-requests')
@Controller('change-requests')
export class ChangeRequestsController {
  constructor(private readonly service: ChangeRequestsService) {}

  @Get('mine')
  @ApiOperation({ summary: '내가 제출한 변경요청 목록' })
  async listMine(
    @CurrentUser() user: JwtUser,
  ): Promise<CommonReturn<ChangeRequestView[]>> {
    return { ok: true, result: await this.service.listMine(user.userId) };
  }

  @Get('pending')
  @RequirePermission(STD_MENU, 'approve')
  @ApiOperation({ summary: '승인 대기 목록 (승인권자)' })
  async listPending(): Promise<CommonReturn<ChangeRequestView[]>> {
    return { ok: true, result: await this.service.listPending() };
  }

  @Post(':id/approve')
  @RequirePermission(STD_MENU, 'approve')
  @ApiOperation({ summary: '변경요청 승인 — 실제 데이터에 반영' })
  async approve(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CommonReturn<ChangeRequestView>> {
    return { ok: true, result: await this.service.approve(user, id) };
  }

  @Post(':id/reject')
  @RequirePermission(STD_MENU, 'approve')
  @ApiOperation({ summary: '변경요청 반려' })
  async reject(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewDto,
  ): Promise<CommonReturn<ChangeRequestView>> {
    return {
      ok: true,
      result: await this.service.reject(user, id, dto.comment),
    };
  }
}

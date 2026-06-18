import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import {
  NotificationsService,
  NotificationView,
} from './notifications.service';

interface CommonReturn<T> {
  ok: boolean;
  result?: T;
  error?: string;
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '내 알림 목록 + 안읽음 개수' })
  async list(
    @CurrentUser() user: JwtUser,
  ): Promise<CommonReturn<{ items: NotificationView[]; unread: number }>> {
    const [items, unread] = await Promise.all([
      this.service.list(user.userId),
      this.service.unreadCount(user.userId),
    ]);
    return { ok: true, result: { items, unread } };
  }

  @Post(':id/read')
  @ApiOperation({ summary: '알림 단건 읽음 처리' })
  async markRead(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CommonReturn<null>> {
    await this.service.markRead(user.userId, id);
    return { ok: true };
  }

  @Post('read-all')
  @ApiOperation({ summary: '내 알림 전체 읽음 처리' })
  async markAllRead(@CurrentUser() user: JwtUser): Promise<CommonReturn<null>> {
    await this.service.markAllRead(user.userId);
    return { ok: true };
  }
}

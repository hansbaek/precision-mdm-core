import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  NotificationEntity,
  NotificationType,
} from './entities/notification.entity';

export interface NotificationView {
  notiId: number;
  type: NotificationType;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

const MAX_LIST = 50;

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {}

  /** 한 명의 수신자에게 알림 생성. */
  async create(params: {
    recipientId: string;
    type: NotificationType;
    message: string;
    link?: string | null;
  }): Promise<void> {
    await this.repo.save(
      this.repo.create({
        recipientId: params.recipientId,
        type: params.type,
        message: params.message,
        link: params.link ?? null,
        isReadYn: 'N',
      }),
    );
  }

  /** 여러 수신자에게 동일 알림 생성(예: 승인권자 전원). */
  async createMany(
    recipientIds: string[],
    params: { type: NotificationType; message: string; link?: string | null },
  ): Promise<void> {
    if (recipientIds.length === 0) return;
    await this.repo.save(
      recipientIds.map((recipientId) =>
        this.repo.create({
          recipientId,
          type: params.type,
          message: params.message,
          link: params.link ?? null,
          isReadYn: 'N',
        }),
      ),
    );
  }

  /** 최근 알림 목록(최대 50건, 최신순). */
  async list(recipientId: string): Promise<NotificationView[]> {
    const rows = await this.repo.find({
      where: { recipientId },
      order: { createdAt: 'DESC' },
      take: MAX_LIST,
    });
    return rows.map((r) => ({
      notiId: r.notiId,
      type: r.type,
      message: r.message,
      link: r.link,
      isRead: r.isReadYn === 'Y',
      createdAt: r.createdAt,
    }));
  }

  /** 안읽음 개수. */
  async unreadCount(recipientId: string): Promise<number> {
    return this.repo.count({ where: { recipientId, isReadYn: 'N' } });
  }

  /** 단건 읽음 처리(본인 소유만). */
  async markRead(recipientId: string, notiId: number): Promise<void> {
    await this.repo.update({ notiId, recipientId }, { isReadYn: 'Y' });
  }

  /** 전체 읽음 처리. */
  async markAllRead(recipientId: string): Promise<void> {
    await this.repo.update({ recipientId, isReadYn: 'N' }, { isReadYn: 'Y' });
  }

  /** 다건 읽음(선택). */
  async markManyRead(recipientId: string, notiIds: number[]): Promise<void> {
    if (notiIds.length === 0) return;
    await this.repo.update(
      { recipientId, notiId: In(notiIds) },
      { isReadYn: 'Y' },
    );
  }
}

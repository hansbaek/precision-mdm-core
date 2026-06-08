import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditLogEntity } from './entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  async findAll(itemId?: string) {
    const qb = this.repo.createQueryBuilder('log');
    if (itemId) {
      qb.where('log.itemId = :itemId', { itemId });
    }
    qb.orderBy('log.timestamp', 'DESC');
    return qb.getMany();
  }

  async findByItemId(itemId: string) {
    const exists = await this.repo.findOneBy({ itemId });
    if (!exists) throw new NotFoundException(`No logs for item '${itemId}'`);
    return this.repo.find({ where: { itemId }, order: { timestamp: 'DESC' } });
  }

  async create(dto: CreateAuditLogDto) {
    const entity = this.repo.create({
      ...dto,
      timestamp:
        dto.timestamp ??
        new Date().toISOString().replace('T', ' ').substring(0, 19),
    });
    return this.repo.save(entity);
  }
}

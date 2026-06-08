import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogEntity } from './entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}

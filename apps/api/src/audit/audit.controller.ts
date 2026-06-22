import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { AuditService, AuditView } from './audit.service';

/** 변경 이력 조회는 '데이터 감사' 메뉴 권한(view)으로 게이팅된다. */
const AUDIT_MENU = 'data-audit';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get('logs')
  @RequirePermission(AUDIT_MENU, 'view')
  @ApiOperation({ summary: '변경 이력 조회 (필터/페이징, 최신순)' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'actorId', required: false, description: '부분 일치' })
  @ApiQuery({
    name: 'action',
    required: false,
    description:
      'CREATE/UPDATE/DELETE/BULK_UPLOAD/LOGIN/LOGIN_FAILED/LOGOUT/PASSWORD_CHANGE/PASSWORD_RESET/PERM_CHANGE',
  })
  @ApiQuery({
    name: 'source',
    required: false,
    description: 'API/APPROVAL/EXCEL_UPLOAD/AUTH/ADMIN',
  })
  @ApiQuery({ name: 'from', required: false, description: 'ISO 일시(이상)' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO 일시(이하)' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  list(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('source') source?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ rows: AuditView[]; total: number }> {
    return this.audit.list({
      entityType,
      entityId,
      actorId,
      action,
      source,
      from,
      to,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }
}

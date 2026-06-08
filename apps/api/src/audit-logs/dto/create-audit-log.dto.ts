import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAuditLogDto {
  @ApiProperty({ example: 'LOG-001' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({ example: 'T-10042' })
  @IsString()
  @IsOptional()
  itemId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  itemName?: string;

  @ApiProperty({
    enum: ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'BULK_IMPORT'],
  })
  @IsIn(['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'BULK_IMPORT'])
  action: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  details?: string;

  @ApiPropertyOptional({ example: '2024-01-01 10:00:00' })
  @IsString()
  @IsOptional()
  timestamp?: string;

  @ApiPropertyOptional({ example: 'hans.baek@gmail.com' })
  @IsString()
  @IsOptional()
  user?: string;
}

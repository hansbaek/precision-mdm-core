import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UpdateStdTestItemDto } from './update-std-test-item.dto';

/**
 * Create payload — same column set as the update DTO, but PRODUCT_LINE and
 * TEST_ITEM_NAME are required (NOT NULL columns). TMPLT_ID / CREATED_AT are
 * server-assigned; CREATED_BY defaults to 'SYSTEM' when omitted.
 */
export class CreateStdTestItemDto extends OmitType(UpdateStdTestItemDto, [
  'productLine',
  'testItemName',
] as const) {
  @ApiProperty() @IsString() @IsNotEmpty() productLine!: string;
  @ApiProperty() @IsString() @IsNotEmpty() testItemName!: string;
  @ApiPropertyOptional({ description: '생성자 사번 (미지정 시 SYSTEM)' })
  @IsString()
  @IsOptional()
  createdBy?: string;
}

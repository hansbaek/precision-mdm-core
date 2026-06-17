import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsString, ValidateNested } from 'class-validator';

export class MenuPermissionInput {
  @ApiProperty()
  @IsString()
  menuId: string;

  @ApiProperty()
  @IsBoolean()
  canView: boolean;

  @ApiProperty()
  @IsBoolean()
  canCreate: boolean;

  @ApiProperty()
  @IsBoolean()
  canUpdate: boolean;

  @ApiProperty()
  @IsBoolean()
  canDelete: boolean;
}

export class UpdatePermissionsDto {
  @ApiProperty({ type: [MenuPermissionInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuPermissionInput)
  permissions: MenuPermissionInput[];
}

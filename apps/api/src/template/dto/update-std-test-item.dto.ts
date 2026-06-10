import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateStdTestItemDto {
  @ApiPropertyOptional() @IsString() @IsOptional() productLine?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() testItemName?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() testMethod?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() testCondition?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() endurSvrty?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() certiTtm?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() certiType?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() tempTire?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() snowMark?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() frt?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() utqg?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() por?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() radialBias?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() rimInch?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() grvDepth?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() ss?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() li?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() plyRating?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() tlIndicator?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() tbrPosition?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() tbrGrv3?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() tbrSegment?: string;
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tbrItemCntPerBarcode?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() newSizeYn?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() sizeSmpl?: string;
  /** comma-separated market codes, e.g. "A0,A1,K1,NA" */
  @ApiPropertyOptional() @IsString() @IsOptional() markets?: string;
}

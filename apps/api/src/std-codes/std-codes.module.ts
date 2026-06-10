import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StdCodeEntity } from './entities/std-code.entity';
import { StdCodesController } from './std-codes.controller';
import { StdCodesService } from './std-codes.service';

@Module({
  imports: [TypeOrmModule.forFeature([StdCodeEntity])],
  controllers: [StdCodesController],
  providers: [StdCodesService],
  exports: [StdCodesService],
})
export class StdCodesModule {}

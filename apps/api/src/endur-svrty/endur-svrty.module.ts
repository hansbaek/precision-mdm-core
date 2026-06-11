import { Module } from '@nestjs/common';
import { EndurSvrtyController } from './endur-svrty.controller';
import { EndurSvrtyService } from './endur-svrty.service';

@Module({
  controllers: [EndurSvrtyController],
  providers: [EndurSvrtyService],
})
export class EndurSvrtyModule {}

import { Module } from '@nestjs/common';
import { TestMatchController } from './test-match.controller';
import { TestMatchService } from './test-match.service';

@Module({
  controllers: [TestMatchController],
  providers: [TestMatchService],
})
export class TestMatchModule {}

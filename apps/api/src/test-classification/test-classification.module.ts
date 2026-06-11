import { Module } from '@nestjs/common';
import { TestClassificationController } from './test-classification.controller';
import { TestClassificationService } from './test-classification.service';

@Module({
  controllers: [TestClassificationController],
  providers: [TestClassificationService],
})
export class TestClassificationModule {}

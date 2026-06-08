import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestItemEntity } from './entities/test-item.entity';
import { TestItemsController } from './test-items.controller';
import { TestItemsService } from './test-items.service';

@Module({
  imports: [TypeOrmModule.forFeature([TestItemEntity])],
  controllers: [TestItemsController],
  providers: [TestItemsService],
  exports: [TestItemsService],
})
export class TestItemsModule {}

import { Module } from '@nestjs/common';
import { TemplateModule } from '../template/template.module';
import { TestMatchController } from './test-match.controller';
import { TestMatchService } from './test-match.service';

@Module({
  // 템플릿 캐시(TemplateCacheService)를 공유받아 매칭마다 전체 재조회를 피한다.
  imports: [TemplateModule],
  controllers: [TestMatchController],
  providers: [TestMatchService],
})
export class TestMatchModule {}

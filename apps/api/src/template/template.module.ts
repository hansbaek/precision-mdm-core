import { forwardRef, Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ChangeRequestsModule } from '../change-requests/change-requests.module';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';
import { TemplateCacheService } from './template-cache.service';
import { TemplateUploadService } from './template-upload.service';

@Module({
  // 컨트롤러가 변경요청 게이팅을 호출하고, 변경요청 모듈은 적용을 위해
  // TemplateService 를 쓰므로 forwardRef 로 순환 의존을 해소한다.
  imports: [forwardRef(() => ChangeRequestsModule), AuditModule],
  controllers: [TemplateController],
  providers: [TemplateService, TemplateUploadService, TemplateCacheService],
  // TemplateCacheService 는 test-match 가 공유한다(쓰기 무효화 + 매칭 조회).
  exports: [TemplateService, TemplateCacheService],
})
export class TemplateModule {}

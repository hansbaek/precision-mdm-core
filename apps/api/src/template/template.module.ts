import { forwardRef, Module } from '@nestjs/common';
import { ChangeRequestsModule } from '../change-requests/change-requests.module';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';
import { TemplateUploadService } from './template-upload.service';

@Module({
  // 컨트롤러가 변경요청 게이팅을 호출하고, 변경요청 모듈은 적용을 위해
  // TemplateService 를 쓰므로 forwardRef 로 순환 의존을 해소한다.
  imports: [forwardRef(() => ChangeRequestsModule)],
  controllers: [TemplateController],
  providers: [TemplateService, TemplateUploadService],
  exports: [TemplateService],
})
export class TemplateModule {}

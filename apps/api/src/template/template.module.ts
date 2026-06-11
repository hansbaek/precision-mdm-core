import { Module } from '@nestjs/common';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';
import { TemplateUploadService } from './template-upload.service';

@Module({
  controllers: [TemplateController],
  providers: [TemplateService, TemplateUploadService],
})
export class TemplateModule {}

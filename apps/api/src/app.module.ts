import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getOracleTypeOrmOptions } from './config/database.config';
import { validateEnvironment } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { StdCodesModule } from './std-codes/std-codes.module';
import { TemplateModule } from './template/template.module';
import { TestClassificationModule } from './test-classification/test-classification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getOracleTypeOrmOptions,
    }),
    HealthModule,
    StdCodesModule,
    TemplateModule,
    TestClassificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

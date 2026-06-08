import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { getOracleTypeOrmOptions } from './config/database.config';
import { validateEnvironment } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { TestItemsModule } from './test-items/test-items.module';

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
    DatabaseModule,
    TestItemsModule,
    AuditLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

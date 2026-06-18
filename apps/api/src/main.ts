import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  // 운영은 리버스 프록시 뒤에서 동작한다. 첫 홉을 신뢰해야 rate limiting 이
  // 프록시 IP 가 아닌 실제 클라이언트 IP 기준으로 동작한다.
  if (isProduction) {
    app.set('trust proxy', 1);
  }

  // 보안 헤더. Swagger UI 는 인라인 스크립트/스타일을 사용하므로 운영이 아닐 때는
  // CSP 를 끄고, 운영에서는 helmet 기본 CSP 를 적용한다.
  app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));

  // CORS: CORS_ORIGINS(콤마 구분) 화이트리스트. 미설정 시 개발에서는 전체 허용,
  // 운영에서는 차단(빈 목록)하여 설정 누락이 곧 보안 사고로 이어지지 않게 한다.
  const corsOrigins = (configService.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length ? corsOrigins : !isProduction,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // API 문서는 운영 환경에서 노출하지 않는다.
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('T:MDM API')
      .setDescription('T:MDM backend API')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, swaggerDocument);
  }

  const port = configService.get<number>('API_PORT', 4000);
  await app.listen(port);
}
void bootstrap();

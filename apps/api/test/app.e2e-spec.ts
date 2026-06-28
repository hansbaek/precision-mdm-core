import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

/**
 * 루트 엔드포인트 e2e. 기본 e2e 스위트는 DB-free(모킹) 원칙이므로 AppModule
 * 전체(Oracle 연결 포함)를 import 하지 않고 필요한 컨트롤러/서비스만 부팅한다.
 */
describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) → 루트 인사말', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('엔지니어링 마스터데이터베이스 관리!!');
  });
});

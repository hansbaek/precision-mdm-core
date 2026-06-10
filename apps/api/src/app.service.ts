import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '엔지니어링 마스터데이터베이스 관리!!';
  }
}

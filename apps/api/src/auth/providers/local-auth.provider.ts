import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { AuthProvider, AuthenticatedUser } from './auth-provider.interface';

/** TMDM_USER + bcrypt 기반 로컬 인증. */
@Injectable()
export class LocalAuthProvider implements AuthProvider {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async authenticate(
    userId: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.userRepo.findOne({
      where: { userId, useYn: 'Y' },
    });
    if (!user || user.authSource !== 'LOCAL' || !user.passwordHash) {
      return null;
    }
    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) return null;

    return {
      userId: user.userId,
      userNm: user.userNm,
      userNmEng: user.userNmEng,
      teamNm: user.teamNm,
      teamNmEng: user.teamNmEng,
      roleId: user.roleId,
    };
  }
}

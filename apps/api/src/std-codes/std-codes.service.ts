import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { StdCodeEntity } from './entities/std-code.entity';

@Injectable()
export class StdCodesService {
  constructor(
    @InjectRepository(StdCodeEntity)
    private readonly repo: Repository<StdCodeEntity>,
  ) {}

  async findByGroupId(
    codeGrpId: string,
    codeLvl?: number,
  ): Promise<StdCodeEntity[]> {
    return this.repo.find({
      where: {
        codeGrpId,
        useYn: 'Y',
        ...(codeLvl !== undefined && { codeLvl: LessThanOrEqual(codeLvl) }),
      },
      order: { sortOrder: 'ASC', codeCd: 'ASC' },
    });
  }
}

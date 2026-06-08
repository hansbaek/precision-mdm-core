import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTestItemDto } from './dto/create-test-item.dto';
import { UpdateTestItemDto } from './dto/update-test-item.dto';
import { TestItemEntity } from './entities/test-item.entity';

@Injectable()
export class TestItemsService {
  constructor(
    @InjectRepository(TestItemEntity)
    private readonly repo: Repository<TestItemEntity>,
  ) {}

  private toProductLinesString(arr?: string[]): string {
    return arr && arr.length > 0 ? arr.join(',') : '';
  }

  private fromProductLinesString(str: string): string[] {
    return str ? str.split(',').filter(Boolean) : [];
  }

  private toResponse(entity: TestItemEntity) {
    return {
      ...entity,
      productLines: this.fromProductLinesString(entity.productLines),
    };
  }

  async findAll(filters?: {
    category?: string;
    status?: string;
    mandatory?: string;
    productLine?: string;
  }) {
    const qb = this.repo.createQueryBuilder('item');

    if (filters?.category) {
      qb.andWhere('item.category = :category', { category: filters.category });
    }
    if (filters?.status) {
      qb.andWhere('item.status = :status', { status: filters.status });
    }
    if (filters?.mandatory) {
      qb.andWhere('item.mandatory = :mandatory', {
        mandatory: filters.mandatory,
      });
    }
    if (filters?.productLine) {
      qb.andWhere(
        `(item.productLines = :pl OR item.productLines LIKE :plStart OR item.productLines LIKE :plMid OR item.productLines LIKE :plEnd)`,
        {
          pl: filters.productLine,
          plStart: `${filters.productLine},%`,
          plMid: `%,${filters.productLine},%`,
          plEnd: `%,${filters.productLine}`,
        },
      );
    }

    qb.orderBy('item.id', 'ASC');
    const entities = await qb.getMany();
    return entities.map((e) => this.toResponse(e));
  }

  async findOne(id: string) {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`TestItem '${id}' not found`);
    return this.toResponse(entity);
  }

  async create(dto: CreateTestItemDto) {
    const exists = await this.repo.findOneBy({ id: dto.id });
    if (exists) throw new ConflictException(`TestItem '${dto.id}' already exists`);

    const entity = this.repo.create({
      ...dto,
      productLines: this.toProductLinesString(dto.productLines),
      lastUpdated:
        dto.lastUpdated ?? new Date().toISOString().split('T')[0],
    });

    await this.repo.save(entity);
    return this.toResponse(entity);
  }

  async update(id: string, dto: UpdateTestItemDto) {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`TestItem '${id}' not found`);

    Object.assign(entity, {
      ...dto,
      productLines:
        dto.productLines !== undefined
          ? this.toProductLinesString(dto.productLines)
          : entity.productLines,
      lastUpdated: new Date().toISOString().split('T')[0],
    });

    await this.repo.save(entity);
    return this.toResponse(entity);
  }

  async remove(id: string) {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`TestItem '${id}' not found`);
    await this.repo.remove(entity);
  }
}

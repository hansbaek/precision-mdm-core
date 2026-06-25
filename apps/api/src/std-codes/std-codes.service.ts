import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { AuditFieldChange, AuditService } from '../audit/audit.service';
import {
  CreateStdCodeDto,
  MoveStdCodeDto,
  UpdateStdCodeDto,
} from './dto/std-code.dto';
import { StdCodeEntity } from './entities/std-code.entity';

/** 코드 그룹 요약(좌측 목록용). */
export interface StdCodeGroup {
  codeGrpId: string;
  codeGrpNm: string | null;
  codeCount: number;
}

/** 트리 노드 = 코드 한 건 + 자식들. */
export type StdCodeNode = StdCodeEntity & { children: StdCodeNode[] };

/** 편집/감사 대상이 되는 속성 컬럼. */
const EDITABLE_KEYS: Array<keyof StdCodeEntity> = [
  'codeNm',
  'codeDesc',
  'sortOrder',
  'useYn',
  'attr1Val',
  'attr1Nm',
  'attr1Desc',
  'attr2Val',
  'attr2Nm',
  'attr2Desc',
  'attr3Val',
  'attr3Nm',
  'attr3Desc',
];

const diffFields = (
  before: StdCodeEntity,
  after: StdCodeEntity,
  keys: Array<keyof StdCodeEntity>,
): AuditFieldChange[] =>
  keys
    .filter((k) => before[k] !== after[k])
    .map((k) => ({
      column: String(k),
      before: before[k] == null ? null : String(before[k]),
      after: after[k] == null ? null : String(after[k]),
    }));

@Injectable()
export class StdCodesService {
  constructor(
    @InjectRepository(StdCodeEntity)
    private readonly repo: Repository<StdCodeEntity>,
    private readonly audit: AuditService,
  ) {}

  /**
   * 드롭다운 참조용 조회(USE_YN='Y'). level 을 주면 CODE_LVL <= level 만.
   * 기존 소비자 호환을 위해 유지한다.
   */
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

  /** 코드 그룹 목록(그룹별 코드 수 포함). 관리 화면 좌측 패널용. */
  async listGroups(): Promise<StdCodeGroup[]> {
    const rows = await this.repo
      .createQueryBuilder('c')
      .select('c.CODE_GRP_ID', 'codeGrpId')
      .addSelect('MAX(c.CODE_GRP_NM)', 'codeGrpNm')
      .addSelect('COUNT(*)', 'codeCount')
      .groupBy('c.CODE_GRP_ID')
      .orderBy('c.CODE_GRP_ID', 'ASC')
      .getRawMany<{
        codeGrpId: string;
        codeGrpNm: string | null;
        codeCount: string | number;
      }>();
    return rows.map((r) => ({
      codeGrpId: r.codeGrpId,
      codeGrpNm: r.codeGrpNm,
      codeCount: Number(r.codeCount),
    }));
  }

  /** 그룹의 모든 코드(USE_YN 무관)를 PARENT_CD 기준 중첩 트리로 반환. */
  async getTree(codeGrpId: string): Promise<StdCodeNode[]> {
    const rows = await this.repo.find({
      where: { codeGrpId },
      order: { codeLvl: 'ASC', sortOrder: 'ASC', codeCd: 'ASC' },
    });
    if (rows.length === 0) return [];

    const nodes = new Map<string, StdCodeNode>();
    for (const r of rows) {
      nodes.set(this.key(r.codeLvl, r.codeCd), { ...r, children: [] });
    }
    const roots: StdCodeNode[] = [];
    for (const node of nodes.values()) {
      const parent =
        node.parentCd != null
          ? nodes.get(this.key(node.codeLvl - 1, node.parentCd))
          : undefined;
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
    return roots;
  }

  async create(dto: CreateStdCodeDto, actorId: string): Promise<StdCodeEntity> {
    // 부모가 지정되면 그 레벨+1, 아니면 루트(레벨 1).
    let codeLvl = 1;
    if (dto.parentCd) {
      const parent = await this.repo.findOne({
        where: { codeGrpId: dto.codeGrpId, codeCd: dto.parentCd, useYn: 'Y' },
        order: { codeLvl: 'DESC' },
      });
      if (!parent) {
        throw new BadRequestException(
          `부모 코드(${dto.parentCd})를 찾을 수 없습니다.`,
        );
      }
      codeLvl = parent.codeLvl + 1;
    }

    const dup = await this.repo.findOne({
      where: { codeGrpId: dto.codeGrpId, codeLvl, codeCd: dto.codeCd },
    });
    if (dup) {
      throw new ConflictException(
        `이미 존재하는 코드입니다: ${dto.codeGrpId}/L${codeLvl}/${dto.codeCd}`,
      );
    }

    // 그룹명: 신규 그룹이면 dto 값, 기존 그룹이면 기존 그룹명을 따른다.
    const existingInGroup = await this.repo.findOne({
      where: { codeGrpId: dto.codeGrpId },
    });
    const codeGrpNm =
      existingInGroup?.codeGrpNm ?? dto.codeGrpNm ?? dto.codeGrpId;

    const now = new Date();
    const entity = this.repo.create({
      codeGrpId: dto.codeGrpId,
      codeGrpNm,
      codeLvl,
      parentCd: dto.parentCd ?? null,
      codeCd: dto.codeCd,
      codeNm: dto.codeNm ?? null,
      codeDesc: dto.codeDesc ?? null,
      sortOrder: dto.sortOrder ?? 0,
      useYn: dto.useYn ?? 'Y',
      attr1Val: dto.attr1Val ?? null,
      attr1Nm: dto.attr1Nm ?? null,
      attr1Desc: dto.attr1Desc ?? null,
      attr2Val: dto.attr2Val ?? null,
      attr2Nm: dto.attr2Nm ?? null,
      attr2Desc: dto.attr2Desc ?? null,
      attr3Val: dto.attr3Val ?? null,
      attr3Nm: dto.attr3Nm ?? null,
      attr3Desc: dto.attr3Desc ?? null,
      regDtm: now,
      updDtm: now,
    });
    const saved = await this.repo.save(entity);
    await this.audit.record({
      entityType: 'STD_CODE',
      entityId: this.entityId(saved),
      action: 'CREATE',
      ctx: { actorId, source: 'ADMIN' },
      summary: `표준코드 생성: ${saved.codeGrpId} / ${saved.codeCd} (${saved.codeNm ?? ''})`,
    });
    return saved;
  }

  async update(
    codeGrpId: string,
    codeLvl: number,
    codeCd: string,
    dto: UpdateStdCodeDto,
    actorId: string,
  ): Promise<StdCodeEntity> {
    const code = await this.findOneOrThrow(codeGrpId, codeLvl, codeCd);
    const before = { ...code };

    // 그룹명 변경은 그룹 전체에 일괄 적용한다.
    if (dto.codeGrpNm !== undefined && dto.codeGrpNm !== code.codeGrpNm) {
      await this.repo.update({ codeGrpId }, { codeGrpNm: dto.codeGrpNm });
      code.codeGrpNm = dto.codeGrpNm;
    }

    const codeRec = code as unknown as Record<string, unknown>;
    for (const k of EDITABLE_KEYS) {
      const v = (dto as Record<string, unknown>)[k as string];
      if (v !== undefined) codeRec[k as string] = v;
    }
    code.updDtm = new Date();
    const saved = await this.repo.save(code);

    await this.audit.record({
      entityType: 'STD_CODE',
      entityId: this.entityId(saved),
      action: 'UPDATE',
      ctx: { actorId, source: 'ADMIN' },
      changes: diffFields(before, saved, EDITABLE_KEYS),
      summary: `표준코드 수정: ${saved.codeGrpId} / ${saved.codeCd}`,
    });
    return saved;
  }

  /** 소프트 삭제(USE_YN='N'). 하위 코드가 있으면 거부한다. */
  async remove(
    codeGrpId: string,
    codeLvl: number,
    codeCd: string,
    actorId: string,
  ): Promise<void> {
    const code = await this.findOneOrThrow(codeGrpId, codeLvl, codeCd);
    const childCount = await this.repo.count({
      where: { codeGrpId, codeLvl: codeLvl + 1, parentCd: codeCd },
    });
    if (childCount > 0) {
      throw new BadRequestException(
        `하위 코드가 ${childCount}개 있어 삭제할 수 없습니다. 하위 코드를 먼저 삭제하세요.`,
      );
    }
    code.useYn = 'N';
    code.updDtm = new Date();
    await this.repo.save(code);
    await this.audit.record({
      entityType: 'STD_CODE',
      entityId: this.entityId(code),
      action: 'DELETE',
      ctx: { actorId, source: 'ADMIN' },
      summary: `표준코드 삭제(비활성): ${code.codeGrpId} / ${code.codeCd}`,
    });
  }

  /**
   * 트리 이동(드래그&드롭). 부모 변경(재부모화) + 형제 내 정렬을 한 번에 처리한다.
   * 부모가 바뀌면 이동 노드의 서브트리 CODE_LVL 이 같은 만큼 시프트되며,
   * CODE_LVL 이 PK 의 일부라 트랜잭션 내에서 삭제 후 재삽입한다.
   */
  async move(
    codeGrpId: string,
    codeLvl: number,
    codeCd: string,
    dto: MoveStdCodeDto,
    actorId: string,
  ): Promise<void> {
    const all = await this.repo.find({ where: { codeGrpId } });
    // 이동 노드는 반드시 all 내부 인스턴스를 써야 서브트리 변이가 반영된다.
    const node = all.find((r) => r.codeLvl === codeLvl && r.codeCd === codeCd);
    if (!node) throw new NotFoundException('표준코드를 찾을 수 없습니다.');

    // 이동 노드의 서브트리(자기 자신 포함) 수집.
    const subtree = this.collectSubtree(all, node);
    const subtreeKeys = new Set(
      subtree.map((r) => this.key(r.codeLvl, r.codeCd)),
    );

    // 새 부모 해석 → 새 레벨.
    let newLvl = 1;
    if (dto.newParentCd) {
      const parent = all.find((r) => r.codeCd === dto.newParentCd);
      if (!parent) {
        throw new BadRequestException(
          `부모 코드(${dto.newParentCd})를 찾을 수 없습니다.`,
        );
      }
      // 순환 방지: 새 부모가 자기 자신 또는 서브트리 내부면 거부.
      if (subtreeKeys.has(this.key(parent.codeLvl, parent.codeCd))) {
        throw new BadRequestException(
          '자기 자신 또는 하위 코드 아래로는 이동할 수 없습니다.',
        );
      }
      newLvl = parent.codeLvl + 1;
    }

    const delta = newLvl - node.codeLvl;
    const newParentCd = dto.newParentCd ?? null;

    // 레벨 시프트 시 서브트리 밖의 코드와 PK 충돌 검사.
    if (delta !== 0) {
      const byKey = new Map(all.map((r) => [this.key(r.codeLvl, r.codeCd), r]));
      for (const r of subtree) {
        const targetKey = this.key(r.codeLvl + delta, r.codeCd);
        if (byKey.has(targetKey) && !subtreeKeys.has(targetKey)) {
          throw new ConflictException(
            `이동 위치에 이미 같은 코드가 있습니다: L${r.codeLvl + delta}/${r.codeCd}`,
          );
        }
      }
    }

    await this.repo.manager.transaction(async (m) => {
      const repo = m.getRepository(StdCodeEntity);
      const now = new Date();

      if (delta !== 0) {
        // PK(CODE_LVL) 변경 → 삭제 후 레벨 시프트하여 재삽입.
        for (const r of subtree) {
          await repo.delete({
            codeGrpId,
            codeLvl: r.codeLvl,
            codeCd: r.codeCd,
          });
        }
        for (const r of subtree) r.codeLvl += delta;
      }
      // 이동 노드의 부모/시각 갱신.
      node.parentCd = newParentCd;
      node.updDtm = now;
      if (delta !== 0) {
        await repo.insert(subtree);
      } else {
        await repo.save(node);
      }

      // 대상 형제 그룹 재정렬(beforeCd 앞 / 없으면 맨 뒤).
      const siblings = await repo.find({
        where: {
          codeGrpId,
          codeLvl: newLvl,
          parentCd: newParentCd === null ? IsNull() : newParentCd,
        },
        order: { sortOrder: 'ASC', codeCd: 'ASC' },
      });
      const ordered = this.orderSiblings(siblings, node.codeCd, dto.beforeCd);
      for (let i = 0; i < ordered.length; i++) {
        const s = ordered[i];
        if (s.sortOrder !== i * 10) {
          s.sortOrder = i * 10;
          await repo.update(
            { codeGrpId, codeLvl: newLvl, codeCd: s.codeCd },
            { sortOrder: i * 10 },
          );
        }
      }
    });

    await this.audit.record({
      entityType: 'STD_CODE',
      entityId: this.entityId({ ...node, codeLvl: newLvl } as StdCodeEntity),
      action: 'UPDATE',
      ctx: { actorId, source: 'ADMIN' },
      summary: `표준코드 이동: ${codeGrpId} / ${codeCd} → 부모 ${newParentCd ?? '(루트)'}`,
    });
  }

  /** 이동 노드부터 모든 하위 코드를 BFS 로 수집(자기 자신 포함). */
  private collectSubtree(
    all: StdCodeEntity[],
    root: StdCodeEntity,
  ): StdCodeEntity[] {
    const childrenOf = new Map<string, StdCodeEntity[]>();
    for (const r of all) {
      if (r.parentCd == null) continue;
      const k = `${r.parentCd}|${r.codeLvl}`;
      (childrenOf.get(k) ?? childrenOf.set(k, []).get(k)!).push(r);
    }
    const out: StdCodeEntity[] = [];
    const queue: StdCodeEntity[] = [root];
    while (queue.length) {
      const cur = queue.shift()!;
      out.push(cur);
      const kids = childrenOf.get(`${cur.codeCd}|${cur.codeLvl + 1}`) ?? [];
      queue.push(...kids);
    }
    return out;
  }

  /** 형제 목록에서 movedCd 를 beforeCd 앞(없으면 맨 뒤)으로 재배치. */
  private orderSiblings(
    siblings: StdCodeEntity[],
    movedCd: string,
    beforeCd?: string,
  ): StdCodeEntity[] {
    const rest = siblings.filter((s) => s.codeCd !== movedCd);
    const moved = siblings.find((s) => s.codeCd === movedCd);
    if (!moved) return siblings;
    const idx = beforeCd ? rest.findIndex((s) => s.codeCd === beforeCd) : -1;
    if (idx < 0) return [...rest, moved];
    return [...rest.slice(0, idx), moved, ...rest.slice(idx)];
  }

  private async findOneOrThrow(
    codeGrpId: string,
    codeLvl: number,
    codeCd: string,
  ): Promise<StdCodeEntity> {
    const code = await this.repo.findOne({
      where: { codeGrpId, codeLvl, codeCd },
    });
    if (!code) throw new NotFoundException('표준코드를 찾을 수 없습니다.');
    return code;
  }

  private key(codeLvl: number, codeCd: string): string {
    return `${codeLvl} ${codeCd}`;
  }

  private entityId(c: StdCodeEntity): string {
    return `${c.codeGrpId}/${c.codeLvl}/${c.codeCd}`;
  }
}

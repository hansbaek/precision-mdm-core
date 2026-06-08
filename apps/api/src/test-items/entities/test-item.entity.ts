import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'TMP_TEST_ITEMS' })
export class TestItemEntity {
  @PrimaryColumn({ name: 'ID', type: 'varchar', length: 20 })
  id: string;

  @Column({ name: 'CATEGORY', type: 'varchar', length: 100 })
  category: string;

  @Column({ name: 'NAME_KR', type: 'varchar', length: 200 })
  nameKr: string;

  @Column({ name: 'NAME_EN', type: 'varchar', length: 200 })
  nameEn: string;

  @Column({ name: 'SPECIFICATION', type: 'varchar', length: 200, nullable: true })
  specification: string;

  @Column({ name: 'UNIT', type: 'varchar', length: 50, nullable: true })
  unit: string;

  /** REQUIRED | OPTIONAL */
  @Column({ name: 'MANDATORY', type: 'varchar', length: 20 })
  mandatory: string;

  @Column({ name: 'LAST_UPDATED', type: 'varchar', length: 20, nullable: true })
  lastUpdated: string;

  /** Active | Pending | Inactive */
  @Column({ name: 'STATUS', type: 'varchar', length: 20 })
  status: string;

  /** Comma-separated: 'PCR,LTR,EV' */
  @Column({ name: 'PRODUCT_LINES', type: 'varchar', length: 200, nullable: true })
  productLines: string;

  @Column({ name: 'DESCRIPTION', type: 'varchar', length: 2000, nullable: true })
  description: string;

  @Column({ name: 'CREATED_BY', type: 'varchar', length: 100, nullable: true })
  createdBy: string;
}

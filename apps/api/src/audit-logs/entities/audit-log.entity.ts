import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'TMP_AUDIT_LOGS' })
export class AuditLogEntity {
  @PrimaryColumn({ name: 'ID', type: 'varchar', length: 20 })
  id: string;

  @Column({ name: 'ITEM_ID', type: 'varchar', length: 20, nullable: true })
  itemId: string;

  @Column({ name: 'ITEM_NAME', type: 'varchar', length: 300, nullable: true })
  itemName: string;

  /** CREATE | UPDATE | DELETE | STATUS_CHANGE | BULK_IMPORT */
  @Column({ name: 'ACTION', type: 'varchar', length: 30 })
  action: string;

  @Column({ name: 'DETAILS', type: 'varchar', length: 1000, nullable: true })
  details: string;

  @Column({ name: 'LOGGED_AT', type: 'varchar', length: 30, nullable: true })
  timestamp: string;

  @Column({ name: 'OPERATED_BY', type: 'varchar', length: 100, nullable: true })
  user: string;
}

import { Column, Entity, PrimaryColumn } from 'typeorm';

export type MenuType = 'MODULE' | 'TAB';

/**
 * 게이팅 가능한 메뉴(리소스) 카탈로그. 프런트의 사이드바 모듈/헤더 탭과 1:1.
 * MENU_ID 규칙: 모듈 = `<module>`, 탭 = `<module>.<tab>`.
 */
@Entity({ name: 'TMDM_MENU' })
export class MenuEntity {
  @PrimaryColumn({ name: 'MENU_ID', type: 'varchar', length: 100 })
  menuId: string;

  /** 모듈이면 null, 탭이면 소속 모듈 MENU_ID. */
  @Column({ name: 'PARENT_ID', type: 'varchar', length: 100, nullable: true })
  parentId: string | null;

  @Column({ name: 'MENU_TYPE', type: 'varchar', length: 10 })
  menuType: MenuType;

  @Column({ name: 'MENU_NM', type: 'varchar', length: 100, nullable: true })
  menuNm: string;

  /** 프런트 i18n 키(예: app.nav.testMaster). */
  @Column({ name: 'I18N_KEY', type: 'varchar', length: 100, nullable: true })
  i18nKey: string;

  @Column({ name: 'SORT_ORDER', type: 'number', nullable: true })
  sortOrder: number;

  @Column({ name: 'USE_YN', type: 'varchar', length: 1, default: 'Y' })
  useYn: string;
}

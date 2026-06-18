/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  Tractor,
  Database,
  FileSpreadsheet,
  ShieldCheck,
  HelpCircle,
  Compass,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logoSymbol from '@/assets/HKT_Symbol.svg';
import { useCan } from '@/hooks/use-permissions-store';
import { useHealth, type HealthStatus } from '@/hooks/use-health';

/** 상태별 표시: 점 색상 / 펄스 여부 / 배지 색상 / 라벨 i18n 키. */
const HEALTH_PRESENTATION: Record<
  HealthStatus,
  { dot: string; pulse: boolean; badge: string; labelKey: string }
> = {
  checking: {
    dot: 'bg-slate-400',
    pulse: true,
    badge: 'text-slate-400',
    labelKey: 'app.nav.statusChecking',
  },
  online: {
    dot: 'bg-emerald-400',
    pulse: true,
    badge: 'text-emerald-400',
    labelKey: 'app.nav.online',
  },
  degraded: {
    dot: 'bg-amber-400',
    pulse: true,
    badge: 'text-amber-400',
    labelKey: 'app.nav.statusDegraded',
  },
  offline: {
    dot: 'bg-red-500',
    pulse: false,
    badge: 'text-red-400',
    labelKey: 'app.nav.statusOffline',
  },
};

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  itemsCount: number;
}

export default function Sidebar({ activeModule, setActiveModule, itemsCount }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();
  const can = useCan();
  const health = useHealth();
  const healthUi = HEALTH_PRESENTATION[health];

  // 권한(view)이 있는 모듈만 노출. admin 모듈은 권한 보유자에게만 보인다.
  const menuItems = [
    { id: 'test-master', label: t('app.nav.testMaster'), icon: Database, badge: itemsCount },
    { id: 'testing-protocols', label: t('app.nav.classificationMaster'), icon: Compass },
    { id: 'material-specs', label: t('app.nav.materialSpecs'), icon: FileSpreadsheet },
    { id: 'vehicle-config', label: t('app.nav.vehicleConfig'), icon: Tractor },
    { id: 'data-audit', label: t('app.nav.dataAudit'), icon: ShieldCheck },
    { id: 'admin', label: t('app.nav.admin'), icon: Users },
  ].filter((item) => can(item.id, 'view'));

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-64'} bg-sidebar text-sidebar-foreground flex flex-col justify-between shrink-0 select-none border-r border-sidebar-border transition-[width] duration-300 ease-in-out overflow-hidden`}
    >
      {/* Top Brand + Toggle */}
      <div>
        <div className={`border-b border-sidebar-border h-[73px] flex ${collapsed
          ? 'flex-col items-center justify-center gap-1.5 py-2'
          : 'flex-row items-center gap-3 p-4'
          }`}>
          <div
            className="w-9 h-9 bg-transparent rounded-md flex items-center justify-center shrink-0 overflow-hidden"
            id="brand-logo-icon"
          >
            <img src={logoSymbol} alt="Hankook Tire Logo" className="w-9 h-9 object-contain" />
          </div>

          <div className={`flex-1 overflow-hidden transition-all duration-300 ${collapsed ? 'hidden' : 'block'}`}>
            <h1 className="text-white font-extrabold text-[18px] leading-tight tracking-wider uppercase whitespace-nowrap">
              T:MDM
            </h1>
            <p className="text-2xs text-on-primary-container font-mono font-bold tracking-widest mt-0.5 uppercase whitespace-nowrap">
              R&D DATA MNGMT SYS
            </p>
          </div>

          {/* Toggle button */}
          <button
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="shrink-0 w-6 h-6 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center text-sidebar-foreground hover:text-white hover:bg-accent transition-colors shadow-md cursor-pointer"
          >
            {collapsed
              ? <ChevronRight className="h-3.5 w-3.5" />
              : <ChevronLeft className="h-3.5 w-3.5" />
            }
          </button>
        </div>

        {/* Modules List */}
        <nav className="p-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-mod-${item.id}`}
                onClick={() => setActiveModule(item.id)}
                title={collapsed ? item.label : undefined}
                className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-150 text-left cursor-pointer ${collapsed ? 'justify-center' : 'justify-between'
                  } ${isActive
                    ? 'bg-sidebar-accent text-white font-semibold'
                    : 'hover:bg-sidebar-accent/40 hover:text-white text-sidebar-foreground'
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-accent rounded-l-md" />
                )}

                <span className="flex items-center gap-3 text-[13px] min-w-0">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-accent' : 'text-sidebar-foreground/70'}`} />
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'
                      } ${isActive ? 'opacity-100' : 'opacity-90'}`}
                  >
                    {item.label}
                  </span>
                </span>

                {item.badge !== undefined && !collapsed && (
                  <span className="shrink-0 bg-accent text-white text-2xs font-bold px-2 py-1 rounded-md font-mono leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className={`border-t border-sidebar-border transition-all duration-300 ${collapsed ? 'p-2' : 'p-5'} space-y-4`}>
        {/* Support & Status — hidden when collapsed */}
        <div
          className={`space-y-2.5 pt-1 text-2xs text-sidebar-foreground/70 overflow-hidden transition-all duration-300 ${collapsed ? 'max-h-0 opacity-0 pt-0' : 'max-h-40 opacity-100'
            }`}
        >
          <a
            href="https://helpdesk.hankooktech.com/index.jsp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-white transition-colors py-0.5 font-bold"
          >
            <HelpCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{t('app.nav.support')}</span>
          </a>

          <div className="flex items-center justify-between py-1.5 border-t border-sidebar-border pt-3">
            <span className="flex items-center gap-2 font-bold">
              {/* 색상은 실제 헬스체크 상태를 반영. 사이드바는 두 테마 모두 navy 유지 */}
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${healthUi.dot} ${healthUi.pulse ? 'animate-pulse' : ''}`}
              />
              <span>{t('app.nav.systemStatus')}</span>
            </span>
            <span
              className={`text-2xs bg-sidebar-accent font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${healthUi.badge}`}
            >
              {t(healthUi.labelKey)}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

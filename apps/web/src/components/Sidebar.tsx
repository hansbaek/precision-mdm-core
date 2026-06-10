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
} from 'lucide-react';
import logoSymbol from '@/assets/HKT_Symbol.svg';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  itemsCount: number;
}

export default function Sidebar({ activeModule, setActiveModule, itemsCount }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'test-master', label: 'Test Item Master', icon: Database, badge: itemsCount },
    { id: 'material-specs', label: 'Material Specs', icon: FileSpreadsheet },
    { id: 'vehicle-config', label: 'Vehicle Config', icon: Tractor },
    { id: 'testing-protocols', label: 'Testing Protocols', icon: Compass },
    { id: 'data-audit', label: 'Data Audit', icon: ShieldCheck },
  ];

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-64'} bg-primary text-slate-300 flex flex-col justify-between shrink-0 select-none border-r border-primary-container transition-[width] duration-300 ease-in-out overflow-hidden`}
    >
      {/* Top Brand + Toggle */}
      <div>
        <div className={`border-b border-primary-container bg-primary/40 h-[73px] flex ${collapsed
          ? 'flex-col items-center justify-center gap-1.5 py-2'
          : 'flex-row items-center gap-3 p-4'
          }`}>
          <div
            className="w-9 h-9 bg-transparent rounded-sm flex items-center justify-center shrink-0 overflow-hidden"
            id="brand-logo-icon"
          >
            <img src={logoSymbol} alt="Hankook Tire Logo" className="w-9 h-9 object-contain" />
          </div>

          <div className={`flex-1 overflow-hidden transition-all duration-300 ${collapsed ? 'hidden' : 'block'}`}>
            <h1 className="text-white font-extrabold text-[18px] leading-tight tracking-wider uppercase whitespace-nowrap">
              T:MDM
            </h1>
            <p className="text-[10px] text-[#799dd6] font-mono font-bold tracking-widest mt-0.5 uppercase whitespace-nowrap">
              R&D DATA MNGMT SYS
            </p>
          </div>

          {/* Toggle button */}
          <button
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="shrink-0 w-6 h-6 rounded-full bg-primary-container border border-[#004a94]/40 flex items-center justify-center text-slate-300 hover:text-white hover:bg-accent transition-colors shadow-md"
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
                className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-sm transition-all duration-150 text-left ${collapsed ? 'justify-center' : 'justify-between'
                  } ${isActive
                    ? 'bg-primary-container text-white font-semibold'
                    : 'hover:bg-primary-container/40 hover:text-white text-slate-300'
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-accent rounded-l-sm" />
                )}

                <span className="flex items-center gap-3 text-[13px] min-w-0">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-accent' : 'text-slate-400'}`} />
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'
                      } ${isActive ? 'opacity-100' : 'opacity-90'}`}
                  >
                    {item.label}
                  </span>
                </span>

                {item.badge !== undefined && !collapsed && (
                  <span className="shrink-0 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-sm font-mono leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className={`border-t border-primary-container bg-primary/20 transition-all duration-300 ${collapsed ? 'p-2' : 'p-5'} space-y-4`}>
        {/* Support & Status — hidden when collapsed */}
        <div
          className={`space-y-2.5 pt-1 text-[11px] text-slate-400 overflow-hidden transition-all duration-300 ${collapsed ? 'max-h-0 opacity-0 pt-0' : 'max-h-40 opacity-100'
            }`}
        >
          <a href="#support" className="flex items-center gap-2 hover:text-slate-200 transition-colors py-0.5 font-bold">
            <HelpCircle className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>Support & Helpdesk</span>
          </a>

          <div className="flex items-center justify-between py-1.5 border-t border-primary-container pt-3">
            <span className="flex items-center gap-2 text-slate-500 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>System Status</span>
            </span>
            <span className="text-[9px] bg-primary-container text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide border border-[#004a94]/20">
              ONLINE
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Search, Bell, Settings, HelpCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  globalSearch: string;
  setGlobalSearch: (term: string) => void;
}

export default function Header({ activeTab, setActiveTab, globalSearch, setGlobalSearch }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'reports', label: 'Reports' },
  ];

  const recentAlerts = [
    { id: 1, text: 'T-10045 status shifted to Pending.', time: '10m ago' },
    { id: 2, text: 'New Excel Upload performed by system administrator.', time: '1h ago' },
    { id: 3, text: 'ASTM D412 tensile strength limits globally approved.', time: '2h ago' }
  ];

  return (
    <header className="h-20 bg-white border-b border-border-subtle px-8 flex items-center justify-between shrink-0 select-none relative z-10">
      {/* Brand & Functional Tabs */}
      <div className="flex items-center gap-8">
        <div className="flex flex-col pr-4 border-r border-border-subtle">
          <h1 className="font-hanken font-extrabold text-primary text-sm tracking-widest leading-none select-none">
            HANKOOK TIRE
          </h1>
          <p className="text-[9px] text-accent font-mono tracking-widest mt-1 uppercase font-bold">
            R&D ENG.MDM
          </p>
        </div>

        <nav className="flex items-center space-x-6 h-20">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`header-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`h-full border-b-[3px] font-noto tracking-wider text-xs uppercase px-1.5 transition-all outline-none cursor-pointer flex items-center pt-0.5 ${isActive
                  ? 'border-accent text-primary font-extrabold'
                  : 'border-transparent text-secondary hover:text-primary'
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Global Utilities Search & User Panel */}
      <div className="flex items-center gap-5">
        {/* Search Field (Input fields: Flat design, 4px corner radius) */}
        <div className="relative w-64">
          <input
            id="global-search-input"
            type="text"
            placeholder="Search MDM Index..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full bg-surface-base hover:bg-slate-100 focus:bg-white text-[11px] text-slate-800 placeholder-slate-400 pl-9 pr-3.5 py-2 rounded-sm border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all outline-none font-bold"
          />
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-3.5 text-secondary">
          {/* Notification Center */}
          <div className="relative">
            <button
              id="header-btn-bell"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-surface-base hover:text-primary border border-slate-100 rounded-sm transition-all relative cursor-pointer"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-accent rounded-full border border-white" />
            </button>

            {showNotifications && (
              <div
                id="notification-dropdown"
                className="absolute right-0 mt-3 w-80 bg-white rounded-lg border border-border-subtle shadow-xl py-3 text-xs text-slate-700 animate-fade-in z-50 overflow-hidden"
              >
                <div className="px-4 py-2 border-b border-border-subtle font-extrabold text-slate-900 flex justify-between items-center font-noto tracking-tight">
                  <span>알림 (System Notifications)</span>
                  <span className="text-[10px] bg-surface-base text-accent px-2 py-0.5 rounded-sm font-mono font-bold">3 NEW</span>
                </div>
                <div className="divide-y divide-slate-50 max-h-60 overflow-y-auto">
                  {recentAlerts.map(alert => (
                    <div key={alert.id} className="p-3.5 hover:bg-surface-base font-noto">
                      <p className="text-slate-700 leading-normal font-medium">{alert.text}</p>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 w-full block">{alert.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button id="header-btn-settings" className="p-2 hover:bg-surface-base hover:text-primary border border-slate-100 rounded-sm transition-all cursor-pointer">
            <Settings className="h-4.5 w-4.5" />
          </button>

          <button id="header-btn-help" className="p-2 hover:bg-surface-base hover:text-primary border border-slate-100 rounded-sm transition-all cursor-pointer">
            <HelpCircle className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* User Badge Profile */}
        <div className="flex items-center gap-3.5 border-l border-border-subtle pl-4 h-8 select-none font-noto">
          <div className="h-8 w-8 rounded-sm bg-primary text-white font-extrabold font-hanken text-xs flex items-center justify-center border border-primary-container shadow-sm">
            HB
          </div>
          <div className="hidden xl:flex flex-col text-left justify-center">
            <span className="text-xs font-extrabold text-slate-900 leading-none">Hans Baek</span>
            <span className="text-[10px] text-secondary font-mono mt-0.5">hans.baek@gmail.com</span>
          </div>
        </div>
      </div>
    </header>
  );
}

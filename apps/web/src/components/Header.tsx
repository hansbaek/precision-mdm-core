/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bell, HelpCircle, Languages, LogOut, Moon, Search, Settings, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/components/theme/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { clearSession } from '@/hooks/use-session';

interface HeaderProps {
  /** 활성 모듈의 종속 탭 목록 (빈 배열이면 탭 바 숨김). */
  tabs: { id: string; labelKey: string }[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenPalette: () => void;
}

export default function Header({ tabs, activeTab, setActiveTab, onOpenPalette }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const profile = useUserProfile((s) => s.userProfile);

  const isEnLang = (i18n.language || 'kr').startsWith('en');
  const displayName = (isEnLang ? profile.userNameEng : profile.userName) || profile.userId || '-';
  const initials = (displayName || '?').trim().slice(0, 2).toUpperCase();

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  const isEn = (i18n.language || 'kr').startsWith('en');
  const toggleLang = () => i18n.changeLanguage(isEn ? 'kr' : 'en');

  const recentAlerts = [
    { id: 1, text: 'T-10045 status shifted to Pending.', time: '10m ago' },
    { id: 2, text: 'New Excel Upload performed by system administrator.', time: '1h ago' },
    { id: 3, text: 'ASTM D412 tensile strength limits globally approved.', time: '2h ago' }
  ];

  return (
    <header className="h-20 bg-card/80 backdrop-blur-md border-b border-border px-8 flex items-center justify-between shrink-0 select-none relative z-10">
      {/* Brand & Functional Tabs */}
      <div className="flex items-center gap-8">
        <div className="flex flex-col pr-4 border-r border-border">
          <h1 className="font-hanken font-extrabold text-primary text-sm tracking-widest leading-none select-none">
            HANKOOK TIRE
          </h1>
          <p className="text-2xs text-accent font-mono tracking-widest mt-1 uppercase font-bold">
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
                className={`relative h-full tracking-wider text-xs uppercase px-1.5 transition-colors outline-none cursor-pointer flex items-center pt-0.5 ${isActive
                  ? 'text-primary font-extrabold'
                  : 'text-secondary hover:text-primary'
                  }`}
              >
                {t(tab.labelKey)}
                {isActive && (
                  <motion.span
                    layoutId="header-tab-underline"
                    className="absolute inset-x-0 bottom-0 h-[3px] bg-accent"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Global Utilities Search & User Panel */}
      <div className="flex items-center gap-5">
        {/* Command palette trigger */}
        <button
          id="global-search-input"
          onClick={onOpenPalette}
          className="w-64 flex items-center gap-2 bg-muted hover:bg-muted/70 text-xs text-muted-foreground pl-3.5 pr-2 py-2 rounded-lg border border-border transition-all outline-none font-bold cursor-pointer focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Search MDM Index...</span>
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </button>

        {/* Action Icons */}
        <div className="flex items-center gap-2 text-secondary">
          {/* Notification Center */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    id="header-btn-bell"
                    variant="ghost"
                    size="icon"
                    aria-label="알림 (System Notifications)"
                    className="relative text-secondary"
                  >
                    <Bell className="h-4.5 w-4.5" />
                    <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-accent rounded-full border border-card" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>알림</TooltipContent>
            </Tooltip>
            <PopoverContent
              id="notification-dropdown"
              align="end"
              className="w-80 p-0 text-xs overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border font-extrabold text-foreground flex justify-between items-center tracking-tight">
                <span>알림 (System Notifications)</span>
                <span className="text-2xs bg-muted text-accent px-2 py-0.5 rounded-md font-mono font-bold">3 NEW</span>
              </div>
              <div className="divide-y divide-border max-h-60 overflow-y-auto">
                {recentAlerts.map(alert => (
                  <div key={alert.id} className="p-3.5 hover:bg-muted/50">
                    <p className="text-foreground leading-normal font-medium">{alert.text}</p>
                    <span className="text-2xs text-muted-foreground font-mono mt-1 w-full block">{alert.time}</span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Language toggle (KO/EN) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="header-btn-lang"
                variant="ghost"
                size="sm"
                aria-label={isEn ? '한국어로 전환' : 'Switch to English'}
                className="text-secondary gap-1.5 font-bold text-2xs"
                onClick={toggleLang}
              >
                <Languages className="h-4 w-4" />
                {isEn ? '한국어' : 'EN'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('navbar.profile.language')}</TooltipContent>
          </Tooltip>

          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="header-btn-theme"
                variant="ghost"
                size="icon"
                aria-label={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
                className="text-secondary"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                {theme === 'light'
                  ? <Moon className="h-4.5 w-4.5" />
                  : <Sun className="h-4.5 w-4.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{theme === 'light' ? '다크 모드' : '라이트 모드'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="header-btn-settings"
                variant="ghost"
                size="icon"
                aria-label="설정 (Settings)"
                className="text-secondary"
              >
                <Settings className="h-4.5 w-4.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>설정</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="header-btn-help"
                variant="ghost"
                size="icon"
                aria-label={t('navbar.help')}
                className="text-secondary"
                onClick={() =>
                  window.open('/help/manual.html', '_blank', 'noopener,noreferrer')
                }
              >
                <HelpCircle className="h-4.5 w-4.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('navbar.help')}</TooltipContent>
          </Tooltip>
        </div>

        {/* User Badge Profile + Logout */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-3.5 border-l border-border pl-4 h-8 select-none cursor-pointer outline-none">
              <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground font-extrabold font-hanken text-xs flex items-center justify-center shadow-sm">
                {initials}
              </div>
              <div className="hidden xl:flex flex-col text-left justify-center">
                <span className="text-xs font-extrabold text-foreground leading-none">
                  {displayName}
                </span>
                <span className="text-2xs text-muted-foreground font-mono mt-0.5">
                  {profile.teamName || profile.role || profile.userId}
                </span>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-0 text-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="font-extrabold text-foreground">{displayName}</p>
              <p className="text-2xs text-muted-foreground font-mono mt-0.5">
                {profile.userId} · {profile.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted text-foreground font-bold transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t('logout')}
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}

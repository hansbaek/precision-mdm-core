/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bell, HelpCircle, KeyRound, Languages, LogOut, Moon, Search, Settings, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import ChangePasswordModal from '@/components/ChangePasswordModal';
import SettingsModal from '@/components/SettingsModal';
import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/components/theme/use-theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { signOut } from '@/hooks/use-session';

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
  const [pwOpen, setPwOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isEnLang = (i18n.language || 'kr').startsWith('en');
  const displayName = (isEnLang ? profile.userNameEng : profile.userName) || profile.userId || '-';
  const initials = (displayName || '?').trim().slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const isEn = (i18n.language || 'kr').startsWith('en');
  const toggleLang = () => i18n.changeLanguage(isEn ? 'kr' : 'en');

  const { items: notifications, unread, markRead, markAllRead } = useNotifications();

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString(isEnLang ? 'en-US' : 'ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // 알림 클릭: 읽음 처리 + 변경요청 링크면 승인 관리 탭으로 이동.
  const handleNotificationClick = (notiId: number, link: string | null) => {
    void markRead(notiId);
    if (link?.startsWith('change-request:')) setActiveTab('approvals');
  };

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
                    {unread > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-accent rounded-full border border-card" />
                    )}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>{t('navbar.notifications')}</TooltipContent>
            </Tooltip>
            <PopoverContent
              id="notification-dropdown"
              align="end"
              className="w-80 p-0 text-xs overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border font-extrabold text-foreground flex justify-between items-center tracking-tight gap-2">
                <span>{t('navbar.notifications')}</span>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <span className="text-2xs bg-muted text-accent px-2 py-0.5 rounded-md font-mono font-bold">
                      {unread} NEW
                    </span>
                  )}
                  {unread > 0 && (
                    <button
                      onClick={() => void markAllRead()}
                      className="text-2xs text-muted-foreground hover:text-foreground font-bold"
                    >
                      {t('navbar.markAllRead')}
                    </button>
                  )}
                </div>
              </div>
              <div className="divide-y divide-border max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-6 text-center text-muted-foreground">{t('navbar.noNotifications')}</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.notiId}
                      onClick={() => handleNotificationClick(n.notiId, n.link)}
                      className={`block w-full text-left p-3.5 hover:bg-muted/50 transition-colors ${n.isRead ? '' : 'bg-accent/5'}`}
                    >
                      <p className="text-foreground leading-normal font-medium flex items-start gap-2">
                        {!n.isRead && (
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        )}
                        <span>{n.message}</span>
                      </p>
                      <span className="text-2xs text-muted-foreground font-mono mt-1 w-full block">
                        {fmtTime(n.createdAt)}
                      </span>
                    </button>
                  ))
                )}
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
                onClick={() => setSettingsOpen(true)}
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
              onClick={() => setPwOpen(true)}
              className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted text-foreground font-bold transition-colors border-b border-border"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {t('navbar.profile.changePassword.title')}
            </button>
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

      <ChangePasswordModal open={pwOpen} onOpenChange={setPwOpen} />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}

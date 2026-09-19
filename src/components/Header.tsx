import React from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import {
  Bell,
  MessageCircle,
  PlusSquare,
  ArrowLeft,
  Settings,
  ShieldCheck,
  Search
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeScreen,
    navigateTo,
    goBack,
    canGoBack,
    unreadNotifsCount,
    totalUnreadMessages,
    activeChat,
    viewingUser,
    currentUser,
    openReportModal,
  } = useApp();

  // Determine title for sub-screens
  const getSubScreenTitle = () => {
    switch (activeScreen) {
      case 'notifications':
        return 'Notifications';
      case 'chat':
        return activeChat ? activeChat.participant.name : 'Messages';
      case 'edit_profile':
        return 'Edit Profile';
      case 'settings':
        return 'Settings & Privacy';
      case 'create':
        return 'New Post';
      case 'search':
        return 'Explore & Search';
      case 'reels':
        return 'LOKSY Reels';
      case 'profile':
        return viewingUser.id === currentUser.id ? `@${currentUser.username}` : `@${viewingUser.username}`;
      default:
        return '';
    }
  };

  const isSubScreen = ['notifications', 'chat', 'edit_profile', 'settings', 'create'].includes(activeScreen);

  return (
    <header
      id="loksy-app-header"
      className="sticky top-0 z-30 w-full bg-[#070A12]/95 backdrop-blur-md border-b border-white/5 transition-all duration-200"
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left Side: Logo or Back Button */}
        <div className="flex items-center gap-3">
          {isSubScreen ? (
            <button
              id="header-back-btn"
              onClick={goBack}
              className="p-2 -ml-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 active:scale-95 transition-all"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : null}

          {!isSubScreen ? (
            <Logo
              size="md"
              onClick={() => navigateTo('home')}
            />
          ) : (
            <div className="flex items-center gap-2.5">
              {activeScreen === 'chat' && activeChat && (
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                  <img
                    src={activeChat.participant.avatar}
                    alt={activeChat.participant.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {activeChat.participant.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#070A12]" />
                  )}
                </div>
              )}
              <h1 className="text-base font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-xs">
                {getSubScreenTitle()}
              </h1>
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Search Shortcut (Desktop/Tablet) */}
          <button
            id="header-search-btn"
            onClick={() => navigateTo('search')}
            className={`p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all ${
              activeScreen === 'search' ? 'text-[#FF4668] bg-[#FF4668]/10' : ''
            }`}
            title="Search LOKSY"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Quick Create Post (Desktop) */}
          <button
            id="header-create-post-btn"
            onClick={() => navigateTo('create')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white text-xs font-semibold shadow-md shadow-[#FF4668]/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <PlusSquare className="w-4 h-4" />
            <span>Post</span>
          </button>

          {/* Notifications button with badge */}
          <button
            id="header-notifs-btn"
            onClick={() => navigateTo('notifications')}
            className={`relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all ${
              activeScreen === 'notifications' ? 'text-[#FF4668] bg-[#FF4668]/10' : ''
            }`}
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF4668] text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-[#070A12] animate-pulse">
                {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Messages / Chat button with badge */}
          <button
            id="header-messages-btn"
            onClick={() => navigateTo('chat')}
            className={`relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all ${
              activeScreen === 'chat' ? 'text-[#FF4668] bg-[#FF4668]/10' : ''
            }`}
            title="Messages"
          >
            <MessageCircle className="w-5 h-5" />
            {totalUnreadMessages > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#00E5FF] text-[10px] font-bold text-[#070A12] flex items-center justify-center ring-2 ring-[#070A12]">
                {totalUnreadMessages}
              </span>
            )}
          </button>

          {/* Safety / Report button */}
          <button
            id="header-safety-btn"
            onClick={() =>
              openReportModal({
                targetId: 'general_safety',
                targetType: 'user',
                nameOrTitle: 'LOKSY Community Safety & Support',
              })
            }
            className="p-2 rounded-xl text-gray-400 hover:text-emerald-400 hover:bg-white/5 transition-all"
            title="Safety & Report Center"
          >
            <ShieldCheck className="w-5 h-5" />
          </button>

          {/* Settings button */}
          <button
            id="header-settings-btn"
            onClick={() => navigateTo('settings')}
            className={`p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all ${
              activeScreen === 'settings' ? 'text-[#FF4668] bg-[#FF4668]/10' : ''
            }`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

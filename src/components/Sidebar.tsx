import React from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import {
  Home,
  Search,
  PlusSquare,
  Film,
  Bell,
  MessageCircle,
  User as UserIcon,
  Settings,
  ShieldCheck,
  LogOut,
  Sparkles,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeScreen,
    navigateTo,
    setViewingUserId,
    currentUser,
    unreadNotifsCount,
    totalUnreadMessages,
    openReportModal,
    openCreateModal,
    logout,
  } = useApp();

  const links = [
    {
      id: 'home',
      label: 'Home Feed',
      icon: Home,
      screen: 'home' as const,
    },
    {
      id: 'search',
      label: 'Search & Explore',
      icon: Search,
      screen: 'search' as const,
    },
    {
      id: 'reels',
      label: 'LOKSY Reels',
      icon: Film,
      screen: 'reels' as const,
    },
    {
      id: 'chat',
      label: 'Messages',
      icon: MessageCircle,
      screen: 'chat' as const,
      badge: totalUnreadMessages,
      badgeColor: 'bg-[#00E5FF] text-[#070A12]',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      screen: 'notifications' as const,
      badge: unreadNotifsCount,
      badgeColor: 'bg-[#FF4668] text-white',
    },
    {
      id: 'create',
      label: 'Create Post',
      icon: PlusSquare,
      screen: 'create' as const,
      highlight: true,
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: UserIcon,
      screen: 'profile' as const,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      screen: 'settings' as const,
    },
  ];

  return (
    <aside
      id="loksy-desktop-sidebar"
      aria-label="Desktop Sidebar"
      className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen sticky top-0 bg-[#0B0F19] border-r border-white/5 p-5 shrink-0 z-20"
    >
      <div>
        {/* Brand Header with Tagline */}
        <div className="mb-8 pl-1">
          <Logo
            size="md"
            showTagline={true}
            onClick={() => navigateTo('home')}
          />
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {links.map((item) => {
            const isActive =
              item.screen === activeScreen ||
              (item.screen === 'profile' && activeScreen === 'edit_profile');
            const Icon = item.icon;

            if (item.highlight) {
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => openCreateModal('post')}
                  className="w-full flex items-center gap-3.5 px-4 py-3 my-2 rounded-2xl bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white font-semibold shadow-lg shadow-[#FF4668]/20 hover:brightness-110 active:scale-95 transition-all text-sm"
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => {
                  if (item.id === 'profile') {
                    setViewingUserId(null);
                  } else {
                    navigateTo(item.screen);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-white font-semibold border border-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#FF4668]' : ''}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Safety & Profile Section at bottom */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <button
          id="sidebar-safety-btn"
          onClick={() =>
            openReportModal({
              targetId: 'safety_hub',
              targetType: 'user',
              nameOrTitle: 'LOKSY Safety & Community Guidelines',
            })
          }
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Safety & Report Center</span>
        </button>

        {/* User Card */}
        <div
          id="sidebar-user-card"
          className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
          onClick={() => setViewingUserId(null)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#FF4668]/40 shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-white truncate group-hover:text-[#FF4668] transition-colors">
                  {currentUser.name}
                </span>
                {currentUser.isVerified && (
                  <Sparkles className="w-3 h-3 text-[#FFA000] shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-gray-400 truncate">@{currentUser.username}</p>
            </div>
          </div>

          <button
            id="sidebar-logout-btn"
            onClick={(e) => {
              e.stopPropagation();
              logout();
            }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

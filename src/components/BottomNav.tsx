import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Search, PlusCircle, Film, User as UserIcon } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeScreen, navigateTo, setViewingUserId, currentUser, openCreateModal } = useApp();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      screen: 'home' as const,
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      screen: 'search' as const,
    },
    {
      id: 'create',
      label: 'Create',
      icon: PlusCircle,
      screen: 'create' as const,
      isSpecial: true,
    },
    {
      id: 'reels',
      label: 'Reels',
      icon: Film,
      screen: 'reels' as const,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserIcon,
      screen: 'profile' as const,
      hasAvatar: true,
    },
  ];

  return (
    <nav
      id="loksy-mobile-bottom-nav"
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070A12]/95 backdrop-blur-xl border-t border-white/5 pb-[env(safe-area-inset-bottom,4px)] shadow-2xl transition-all"
    >
      <div className="flex items-center justify-around h-15 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive =
            item.screen === activeScreen ||
            (item.screen === 'profile' && activeScreen === 'edit_profile');
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                id={`bottom-nav-${item.id}`}
                onClick={() => openCreateModal('post')}
                className="relative -top-2 flex flex-col items-center justify-center p-1 group active:scale-90 transition-transform"
                aria-label="Create Post or Reel"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF4668] via-[#FF8A00] to-[#E040FB] p-[2px] shadow-lg shadow-[#FF4668]/30 group-hover:shadow-[#FF8A00]/50 transition-all">
                  <div className="w-full h-full rounded-[14px] bg-[#070A12] flex items-center justify-center text-white">
                    <PlusCircle className="w-7 h-7 text-[#FF8A00] group-hover:rotate-90 transition-transform duration-300" />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-gray-400 mt-1">Create</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => {
                if (item.screen === 'profile') {
                  setViewingUserId(null);
                } else {
                  navigateTo(item.screen);
                }
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 transition-colors ${
                isActive ? 'text-[#FF4668]' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {item.hasAvatar ? (
                <div
                  className={`w-6 h-6 rounded-full overflow-hidden transition-all ${
                    isActive ? 'ring-2 ring-[#FF4668] scale-105' : 'border border-white/20'
                  }`}
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="relative">
                  <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF4668]" />
                  )}
                </div>
              )}
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-white font-semibold' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  CheckCheck,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { NotificationType } from '../types';

export const NotificationsScreen: React.FC = () => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    setViewingUserId,
    navigateTo,
    toggleFollowUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'likes' | 'comments' | 'follows'>('all');

  const filtered = notifications.filter((item) => {
    if (activeTab === 'likes') return item.type === 'like';
    if (activeTab === 'comments') return item.type === 'comment';
    if (activeTab === 'follows') return item.type === 'follow';
    return true;
  });

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'like':
        return <Heart className="w-3.5 h-3.5 text-[#FF4668] fill-[#FF4668]" />;
      case 'comment':
        return <MessageCircle className="w-3.5 h-3.5 text-[#00E5FF] fill-[#00E5FF]" />;
      case 'follow':
        return <UserPlus className="w-3.5 h-3.5 text-[#FFA000]" />;
      case 'message':
        return <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  return (
    <div id="loksy-notifications-screen" className="w-full max-w-xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#FF8A00]" />
          <h2 className="text-base font-bold text-white">Activity & Alerts</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllNotificationsAsRead}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
            title="Mark all as read"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark Read</span>
          </button>
          <button
            onClick={clearAllNotifications}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 transition-colors"
            title="Clear all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-[#0B0F19] p-1 rounded-2xl border border-white/5">
        {(['all', 'likes', 'comments', 'follows'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="p-10 rounded-3xl bg-[#0B0F19] border border-white/5 text-center text-gray-400">
            <Bell className="w-10 h-10 text-gray-600 mx-auto mb-2 stroke-[1.5]" />
            <h4 className="text-sm font-bold text-white">No notifications in this filter</h4>
            <p className="text-xs text-gray-500 mt-0.5">You're all caught up with your circle!</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                markNotificationAsRead(item.id);
                if (item.type === 'message') navigateTo('chat');
                else if (item.type === 'follow') setViewingUserId(item.actor.id);
              }}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                item.isRead
                  ? 'bg-[#0B0F19] border-white/5 hover:border-white/10'
                  : 'bg-[#FF4668]/5 border-[#FF4668]/20 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Actor Avatar with Type Badge */}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10">
                    <img
                      src={item.actor.avatar}
                      alt={item.actor.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#070A12] border border-white/10 shadow-sm">
                    {getIcon(item.type)}
                  </div>
                </div>

                <div className="min-w-0 text-xs">
                  <p className="text-gray-200 leading-snug">
                    <span className="font-bold text-white hover:underline mr-1">
                      {item.actor.name}
                    </span>
                    {item.text}
                  </p>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    {item.createdAt}
                  </span>
                </div>
              </div>

              {/* Right side preview thumbnail or follow-back button */}
              <div className="shrink-0 ml-3">
                {item.type === 'follow' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollowUser(item.actor.id);
                    }}
                    className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
                  >
                    Follow
                  </button>
                ) : item.previewMediaUrl ? (
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                    <img
                      src={item.previewMediaUrl}
                      alt="Post preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  !item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#FF4668] block animate-pulse" />
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

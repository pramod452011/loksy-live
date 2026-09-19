import React from 'react';
import { useApp } from '../context/AppContext';
import { StoryBar } from '../components/StoryBar';
import { PostCard } from '../components/PostCard';
import {
  PlusSquare,
  Image as ImageIcon,
  Sparkles,
  UserPlus,
  Flame,
  CheckCircle,
} from 'lucide-react';
import { TRENDING_TAGS } from '../data/mockData';

export const HomeScreen: React.FC = () => {
  const {
    posts,
    currentUser,
    users,
    toggleFollowUser,
    setViewingUserId,
    navigateTo,
    openCreateModal,
  } = useApp();

  const suggestedUsers = users.filter((u) => u.id !== currentUser.id).slice(0, 4);

  return (
    <div id="loksy-home-screen" className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-3">
      <div className="flex gap-6 items-start justify-center">
        {/* Main Feed Column */}
        <div className="w-full max-w-xl shrink-0">
          {/* Stories Bar */}
          <StoryBar />

          {/* Quick Create Post Input Trigger */}
          <div
            id="home-quick-create-card"
            onClick={() => openCreateModal('post')}
            className="w-full bg-[#0B0F19] border border-white/5 hover:border-white/15 rounded-2xl p-3.5 mb-4 flex items-center gap-3 cursor-pointer shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 bg-white/[0.04] group-hover:bg-white/[0.07] border border-white/5 rounded-full px-4 py-2.5 text-xs text-gray-400 flex items-center justify-between transition-colors">
              <span>What's inspiring you today, {currentUser.name.split(' ')[0]}? ✨</span>
              <div className="flex items-center gap-2 text-gray-400">
                <ImageIcon className="w-4 h-4 text-[#FF8A00]" />
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openCreateModal('post');
              }}
              className="p-2 rounded-xl bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white shadow-md hover:brightness-110 active:scale-95 transition-transform"
              title="Create Post"
            >
              <PlusSquare className="w-4 h-4" />
            </button>
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-[#0B0F19] border border-white/5 rounded-3xl p-8 text-center text-gray-400">
                <Sparkles className="w-10 h-10 text-[#FFA000] mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No posts yet. Be the first to share!</h3>
                <p className="text-xs text-gray-400 mb-4">
                  Share your moments, photos, and videos with the community.
                </p>
                <button
                  onClick={() => openCreateModal('post')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
                >
                  Create Your First Post
                </button>
              </div>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        </div>

        {/* Right Rail: Desktop Suggested Creators & Trending */}
        <aside className="hidden lg:block w-80 shrink-0 space-y-4 sticky top-20">
          {/* User Profile Summary */}
          <div className="p-4 rounded-2xl bg-[#0B0F19] border border-white/5 flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigateTo('profile')}
            >
              <div className="w-11 h-11 rounded-full overflow-hidden border border-[#FF4668]/30">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-bold text-sm text-white block group-hover:text-[#FF4668] transition-colors">
                  {currentUser.name}
                </span>
                <span className="text-xs text-gray-400 block">@{currentUser.username}</span>
              </div>
            </div>
            <button
              onClick={() => navigateTo('profile')}
              className="text-xs font-semibold text-[#FF8A00] hover:underline"
            >
              Switch
            </button>
          </div>

          {/* Suggested Creators */}
          <div className="p-4 rounded-2xl bg-[#0B0F19] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300">Suggested For You</span>
              <button
                onClick={() => navigateTo('search')}
                className="text-[11px] font-semibold text-gray-400 hover:text-white"
              >
                See All
              </button>
            </div>

            <div className="space-y-3">
              {suggestedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div
                    className="flex items-center gap-2.5 cursor-pointer min-w-0"
                    onClick={() => setViewingUserId(user.id)}
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white truncate">
                          {user.name}
                        </span>
                        {user.isVerified && (
                          <Sparkles className="w-3 h-3 text-[#FFA000] shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 truncate block">
                        @{user.username}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFollowUser(user.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                      user.isFollowing
                        ? 'bg-white/10 text-gray-300 hover:bg-rose-500/20 hover:text-rose-400'
                        : 'bg-[#FF4668]/15 text-[#FF4668] hover:bg-[#FF4668] hover:text-white'
                    }`}
                  >
                    {user.isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Topics in India */}
          <div className="p-4 rounded-2xl bg-[#0B0F19] border border-white/5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Flame className="w-4 h-4 text-[#FF4668]" />
              <span>Trending in India</span>
            </div>
            <div className="space-y-2 pt-1">
              {TRENDING_TAGS.slice(0, 5).map((item) => (
                <div
                  key={item.tag}
                  onClick={() => navigateTo('search')}
                  className="flex items-center justify-between text-xs cursor-pointer group"
                >
                  <span className="text-gray-300 group-hover:text-[#FF8A00] font-medium transition-colors">
                    {item.tag}
                  </span>
                  <span className="text-[10px] text-gray-500">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-[11px] text-gray-500 leading-relaxed px-2">
            <p>LOKSY • "Apni Duniya, Apne Log"</p>
            <p>© 2026 LOKSY Platform India. All rights reserved.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

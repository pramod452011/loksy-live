import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Search, UserCheck, UserMinus, UserPlus, Sparkles } from 'lucide-react';

export const FollowListModal: React.FC = () => {
  const {
    followModalData,
    closeFollowModal,
    users,
    currentUser,
    toggleFollowUser,
    removeFollower,
    setViewingUserId,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(
    followModalData?.type || 'followers'
  );
  const [searchQuery, setSearchQuery] = useState('');

  if (!followModalData) return null;

  const isMe = followModalData.userId === currentUser.id;

  // Filter list
  const displayList = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'following') return u.isFollowing;
    return true; // For demo, followers shows community creators
  });

  return (
    <div
      id="loksy-follow-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={closeFollowModal}
    >
      <div
        className="w-full max-w-md bg-[#0F1423] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl h-[75vh] sm:h-[600px] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('followers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'followers'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Followers
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'following'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Following
            </button>
          </div>

          <button
            onClick={closeFollowModal}
            className="p-1 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search within list */}
        <div className="p-3 border-b border-white/5 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${activeTab}...`}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF4668]"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {displayList.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center text-xs text-gray-500">
              No users found matching your search.
            </div>
          ) : (
            displayList.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => {
                  setViewingUserId(user.id);
                  closeFollowModal();
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs text-white truncate">
                        {user.name}
                      </span>
                      {user.isVerified && (
                        <Sparkles className="w-3 h-3 text-[#FFA000] shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 block truncate">
                      @{user.username}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {activeTab === 'followers' && isMe ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFollower(user.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 text-xs font-medium transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFollowUser(user.id);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        user.isFollowing
                          ? 'bg-white/10 text-gray-300 hover:bg-rose-500/20 hover:text-rose-400'
                          : 'bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white shadow-md'
                      }`}
                    >
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

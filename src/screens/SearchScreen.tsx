import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  X,
  Sparkles,
  TrendingUp,
  Clock,
  UserPlus,
  Compass,
  Heart,
  MessageCircle,
} from 'lucide-react';
import { TRENDING_TAGS } from '../data/mockData';

export const SearchScreen: React.FC = () => {
  const {
    users,
    posts,
    currentUser,
    toggleFollowUser,
    setViewingUserId,
    showToast,
  } = useApp();

  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const handleClearQuery = () => setQuery('');

  const handleRemoveRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => prev.filter(t => t !== term));
  };

  const handleSelectTerm = (term: string) => {
    setQuery(term);
  };

  // Filter users based on query
  const filteredUsers = query.trim()
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.username.toLowerCase().includes(query.toLowerCase()) ||
          u.bio.toLowerCase().includes(query.toLowerCase()) ||
          (u.location && u.location.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  return (
    <div id="loksy-search-screen" className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-5">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search creators, @usernames, #hashtags, cities..."
          className="w-full pl-11 pr-10 py-3 rounded-2xl bg-[#0B0F19] border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FF4668] transition-colors"
        />
        {query && (
          <button
            onClick={handleClearQuery}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* When actively searching */}
      {query.trim() ? (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Search Results for "{query}"
          </h3>

          {filteredUsers.length === 0 ? (
            /* No results screen */
            <div className="p-10 rounded-3xl bg-[#0B0F19] border border-white/5 text-center space-y-2">
              <Compass className="w-12 h-12 text-gray-600 mx-auto stroke-[1.5]" />
              <h4 className="text-base font-bold text-white">No results found</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                We couldn't find anyone matching "{query}". Try checking the spelling or searching for a different keyword or city.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#0B0F19] border border-white/5 hover:border-white/10 transition-colors cursor-pointer group"
                  onClick={() => setViewingUserId(user.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-[#FF4668]/30 shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-sm text-white group-hover:text-[#FF4668] transition-colors truncate">
                          {user.name}
                        </span>
                        {user.isVerified && (
                          <Sparkles className="w-3.5 h-3.5 text-[#FFA000] shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-gray-400 truncate block">
                        @{user.username}
                      </span>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                        {user.bio}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollowUser(user.id);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                      user.isFollowing
                        ? 'bg-white/10 text-gray-300'
                        : 'bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white shadow-md'
                    }`}
                  >
                    {user.isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Default Search Page: Recent Searches, Suggested Creators & Trending Grid */
        <div className="space-y-6">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Recent Searches
                </span>
                <button
                  onClick={() => setRecentSearches([])}
                  className="text-xs text-[#FF8A00] hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <div
                    key={term}
                    onClick={() => handleSelectTerm(term)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 cursor-pointer transition-colors"
                  >
                    <span>{term}</span>
                    <button
                      onClick={(e) => handleRemoveRecent(term, e)}
                      className="text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Indian Creators */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Suggested Creators in India
            </span>

            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#0B0F19] border border-white/5 hover:border-white/10 transition-colors cursor-pointer group"
                  onClick={() => setViewingUserId(user.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-sm text-white group-hover:text-[#FF4668] transition-colors truncate">
                          {user.name}
                        </span>
                        {user.isVerified && (
                          <Sparkles className="w-3.5 h-3.5 text-[#FFA000] shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-gray-400 block truncate">
                        @{user.username} {user.location && `• ${user.location}`}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollowUser(user.id);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                      user.isFollowing
                        ? 'bg-white/10 text-gray-300'
                        : 'bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white shadow-md'
                    }`}
                  >
                    {user.isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Explore Media Grid */}
          {posts.length > 0 ? (
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Explore Community Moments
              </span>
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl overflow-hidden">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setViewingUserId(post.userId)}
                    className="relative aspect-square overflow-hidden group cursor-pointer bg-[#0F1423]"
                  >
                    {post.mediaType === 'video' ? (
                      <video
                        src={post.mediaUrl}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 fill-white" /> {post.likesCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 fill-white" /> {post.commentsCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#0B0F19] border border-white/5 text-center text-gray-400 space-y-2">
              <p className="text-xs">No posts yet. Be the first to share!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

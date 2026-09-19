import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Post, Reel } from '../types';
import { formatViewCount } from '../data/mockData';
import {
  LayoutGrid,
  Film,
  Bookmark,
  Sparkles,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Settings,
  LogOut,
  UserCheck,
  UserPlus,
  MessageCircle,
  Share2,
  Heart,
  Eye,
  ShieldAlert,
  UserX,
  Camera,
  Check,
  X,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  Lock,
  Shield,
  Scale,
} from 'lucide-react';
import { CopyrightGuidelinesModal } from '../components/CopyrightGuidelinesModal';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
];

const COVER_PRESETS = [
  'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
];

export const ProfileScreen: React.FC = () => {
  const {
    viewingUser,
    currentUser,
    posts,
    reels,
    toggleFollowUser,
    blockUser,
    openFollowModal,
    openReportModal,
    openShareModal,
    openCreateModal,
    startOrOpenChatWithUser,
    toggleLikePost,
    toggleSavePost,
    incrementPostViews,
    updateProfile,
    logout,
    navigateTo,
    showToast,
  } = useApp();

  // Tab state: 'posts' (Posts Grid), 'reels' (Reels), 'saved' (Saved)
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved'>('posts');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Edit Profile Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editUsername, setEditUsername] = useState(currentUser.username);
  const [editBio, setEditBio] = useState(currentUser.bio || '');
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar);
  const [editCover, setEditCover] = useState(currentUser.coverImage || '');
  const [editLocation, setEditLocation] = useState(currentUser.location || '');
  const [editWebsite, setEditWebsite] = useState(currentUser.website || '');

  // Settings Menu / Action Sheet state
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const isMe = viewingUser.id === currentUser.id;

  // Filter content
  const userPosts = posts.filter(
    (p) => p.userId === viewingUser.id || (isMe && p.user.username === currentUser.username)
  );
  const userReels = reels.filter(
    (r) => r.userId === viewingUser.id || (isMe && r.user.username === currentUser.username)
  );
  const savedPosts = posts.filter((p) => p.isSaved);

  // Reset edit form fields whenever opening modal
  const handleOpenEditModal = () => {
    setEditName(currentUser.name);
    setEditUsername(currentUser.username);
    setEditBio(currentUser.bio || '');
    setEditAvatar(currentUser.avatar);
    setEditCover(currentUser.coverImage || '');
    setEditLocation(currentUser.location || '');
    setEditWebsite(currentUser.website || '');
    setIsEditModalOpen(true);
    setIsSettingsMenuOpen(false);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setEditAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setEditCover(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = editName.trim() || currentUser.name;
    const cleanUsername = editUsername.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '') || currentUser.username;
    
    updateProfile({
      name: cleanName,
      username: cleanUsername,
      bio: editBio.trim(),
      avatar: editAvatar,
      coverImage: editCover,
      location: editLocation.trim(),
      website: editWebsite.trim(),
    });

    setIsEditModalOpen(false);
    showToast('Profile updated successfully! ✨');
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    setIsSettingsMenuOpen(false);
    logout();
  };

  return (
    <div id="loksy-profile-screen" className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-3 space-y-4">
      {/* Top Header Bar with Username & Settings */}
      <div className="flex items-center justify-between px-2 pb-1 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
            @{viewingUser.username}
            {viewingUser.isVerified && (
              <CheckCircle2 className="w-4 h-4 text-[#FF4668] fill-[#FF4668]/20" />
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isMe ? (
            <>
              <button
                id="profile-create-quick-btn"
                onClick={() => openCreateModal('post')}
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                title="Create Post or Reel"
                aria-label="Create Post"
              >
                <PlusCircle className="w-5 h-5 text-[#FF8A00]" />
              </button>
              <button
                id="profile-settings-btn"
                onClick={() => setIsSettingsMenuOpen(true)}
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors relative"
                title="Account Settings & Log Out"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  openReportModal({
                    targetId: viewingUser.id,
                    targetType: 'user',
                    nameOrTitle: `@${viewingUser.username}`,
                  })
                }
                className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                title="Report User"
              >
                <ShieldAlert className="w-5 h-5" />
              </button>
              <button
                onClick={() => blockUser(viewingUser.id)}
                className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                title="Block User"
              >
                <UserX className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Card with Cover Banner & Avatar */}
      <div className="bg-[#0B0F19] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        {/* Cover Banner */}
        <div className="relative h-32 sm:h-44 w-full bg-gradient-to-r from-[#FF4668]/30 via-[#FF8A00]/20 to-[#6366F1]/30 overflow-hidden group">
          {viewingUser.coverImage ? (
            <img
              src={viewingUser.coverImage}
              alt={`${viewingUser.name}'s cover`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-[#0F1423] via-[#1E293B] to-[#FF4668]/20" />
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

          {/* Quick edit cover button for own profile */}
          {isMe && (
            <button
              onClick={handleOpenEditModal}
              className="absolute top-3 right-3 px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white/80 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-all"
              title="Edit Cover Banner"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Change Banner</span>
            </button>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="px-4 sm:px-6 pb-6 relative pt-0">
          {/* Avatar floating over Cover */}
          <div className="flex items-end justify-between -mt-12 sm:-mt-16 mb-4">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[3px] bg-gradient-to-tr from-[#FF4668] via-[#FF8A00] to-[#E040FB] shadow-2xl">
                <img
                  src={viewingUser.avatar}
                  alt={viewingUser.name}
                  className="w-full h-full rounded-full object-cover border-4 border-[#0B0F19]"
                  referrerPolicy="no-referrer"
                />
              </div>
              {isMe && (
                <button
                  onClick={handleOpenEditModal}
                  className="absolute bottom-1 right-1 p-2 rounded-full bg-[#FF4668] text-white shadow-lg hover:scale-110 active:scale-95 transition-transform border-2 border-[#0B0F19]"
                  title="Change Avatar"
                  aria-label="Edit Avatar"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2">
              {isMe ? (
                <>
                  <button
                    id="profile-edit-btn"
                    onClick={handleOpenEditModal}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition-all active:scale-95 shadow-sm"
                  >
                    Edit Profile
                  </button>
                  <button
                    id="profile-share-btn"
                    onClick={() =>
                      openShareModal({
                        title: `LOKSY Profile of ${viewingUser.name} (@${viewingUser.username})`,
                        url: window.location.origin + `/#@${viewingUser.username}`,
                      })
                    }
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors"
                    title="Share Profile"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => toggleFollowUser(viewingUser.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 ${
                      viewingUser.isFollowing
                        ? 'bg-white/10 text-gray-200 border border-white/10 hover:bg-white/15'
                        : 'bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white hover:brightness-110'
                    }`}
                  >
                    {viewingUser.isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => startOrOpenChatWithUser(viewingUser)}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Message</span>
                  </button>
                  <button
                    onClick={() =>
                      openShareModal({
                        title: `Check out ${viewingUser.name} on LOKSY`,
                        url: window.location.origin + `/#@${viewingUser.username}`,
                      })
                    }
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors"
                    title="Share Profile"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Details: Display Name, Handle, Bio */}
          <div className="space-y-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {viewingUser.name}
                </h1>
                {viewingUser.isVerified && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FF4668]/15 text-[#FF4668] border border-[#FF4668]/30"
                    title="Verified Indian Creator"
                  >
                    <Sparkles className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-400">
                @{viewingUser.username}
              </p>
            </div>

            {/* Bio */}
            {viewingUser.bio && (
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed max-w-xl whitespace-pre-line font-normal">
                {viewingUser.bio}
              </p>
            )}

            {/* Metadata (Location, Website, Joined) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-gray-400">
              {viewingUser.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#FF8A00]" />
                  <span>{viewingUser.location}</span>
                </div>
              )}
              {viewingUser.website && (
                <a
                  href={viewingUser.website.startsWith('http') ? viewingUser.website : `https://${viewingUser.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#00E5FF] hover:underline"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{viewingUser.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              )}
              {viewingUser.joinedDate && (
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {viewingUser.joinedDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Instagram-style Counters: Posts, Followers, Following */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/5 text-center">
            <button
              onClick={() => setActiveTab('posts')}
              className="p-2 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <div className="text-lg sm:text-xl font-black text-white group-hover:text-[#FF4668] transition-colors">
                {userPosts.length}
              </div>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Posts
              </div>
            </button>

            <button
              onClick={() => openFollowModal('followers', viewingUser.id)}
              className="p-2 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <div className="text-lg sm:text-xl font-black text-white group-hover:text-[#FF8A00] transition-colors">
                {viewingUser.followersCount.toLocaleString()}
              </div>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Followers
              </div>
            </button>

            <button
              onClick={() => openFollowModal('following', viewingUser.id)}
              className="p-2 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <div className="text-lg sm:text-xl font-black text-white group-hover:text-[#E040FB] transition-colors">
                {viewingUser.followingCount.toLocaleString()}
              </div>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Following
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation: 'Posts Grid', 'Reels', and 'Saved' */}
      <div className="flex items-center justify-around border-b border-white/5 bg-[#0B0F19]/70 backdrop-blur-md rounded-2xl p-1 shadow-sm">
        <button
          id="tab-posts-grid"
          onClick={() => setActiveTab('posts')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'posts'
              ? 'bg-white/10 text-white shadow-sm border border-white/10'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutGrid className={`w-4 h-4 ${activeTab === 'posts' ? 'text-[#FF4668]' : ''}`} />
          <span>Posts Grid</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-gray-300">
            {userPosts.length}
          </span>
        </button>

        <button
          id="tab-reels"
          onClick={() => setActiveTab('reels')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'reels'
              ? 'bg-white/10 text-white shadow-sm border border-white/10'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Film className={`w-4 h-4 ${activeTab === 'reels' ? 'text-[#FF8A00]' : ''}`} />
          <span>Reels</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-gray-300">
            {userReels.length}
          </span>
        </button>

        <button
          id="tab-saved"
          onClick={() => setActiveTab('saved')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'saved'
              ? 'bg-white/10 text-white shadow-sm border border-white/10'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${activeTab === 'saved' ? 'text-[#E040FB]' : ''}`} />
          <span>Saved</span>
          {isMe && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-gray-300">
              {savedPosts.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Posts Grid */}
      {activeTab === 'posts' && (
        <div id="posts-grid-content">
          {userPosts.length === 0 ? (
            <div id="empty-posts-state" className="p-10 rounded-3xl bg-[#0B0F19] border border-white/5 text-center text-gray-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-gray-500">
                <LayoutGrid className="w-7 h-7 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">No posts yet. Be the first to share!</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  {isMe
                    ? 'Capture photos, reels, and stories to populate your feed.'
                    : `@${viewingUser.username} has not posted anything yet.`}
                </p>
              </div>
              {isMe && (
                <button
                  onClick={() => openCreateModal('post')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white text-xs font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create First Post</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:gap-2 rounded-2xl overflow-hidden">
              {userPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="relative aspect-square overflow-hidden bg-[#0F1423] cursor-pointer group rounded-lg"
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
                      alt={post.caption || 'Post image'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  )}

                  {/* Video indicator & view count below thumbnail for video posts */}
                  {post.mediaType === 'video' && (
                    <>
                      <div className="absolute top-2 right-2 p-1 rounded-full bg-black/60 backdrop-blur-md text-[#00E5FF]">
                        <Film className="w-3.5 h-3.5" />
                      </div>
                      <div className="absolute bottom-1.5 left-1.5 z-10 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-full text-white text-[10px] font-bold drop-shadow border border-white/10">
                        <Eye className="w-3 h-3 text-[#00E5FF]" />
                        <span>{formatViewCount(post.viewsCount)}</span>
                      </div>
                    </>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold z-20">
                    <span className="flex items-center gap-1 drop-shadow">
                      <Heart className="w-3.5 h-3.5 fill-white text-white" />
                      {post.likesCount}
                    </span>
                    <span className="flex items-center gap-1 drop-shadow">
                      <MessageCircle className="w-3.5 h-3.5 fill-white text-white" />
                      {post.commentsCount}
                    </span>
                    {post.mediaType === 'video' && (
                      <span className="flex items-center gap-1 drop-shadow text-[#00E5FF]">
                        <Eye className="w-3.5 h-3.5" />
                        {formatViewCount(post.viewsCount)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Reels */}
      {activeTab === 'reels' && (
        <div id="reels-content">
          {userReels.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[#0B0F19] border border-white/5 text-center text-gray-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-gray-500">
                <Film className="w-7 h-7 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">No reels yet</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  {isMe
                    ? 'Create short vertical video moments with trending music.'
                    : `@${viewingUser.username} has not uploaded any reels.`}
                </p>
              </div>
              {isMe && (
                <button
                  onClick={() => openCreateModal('reel')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E040FB] text-white text-xs font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-1.5"
                >
                  <Film className="w-4 h-4" />
                  <span>Create Reel</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:gap-2 rounded-2xl overflow-hidden">
              {userReels.map((reel) => (
                <div
                  key={reel.id}
                  onClick={() => navigateTo('reels')}
                  className="relative aspect-[9/16] overflow-hidden bg-[#0F1423] cursor-pointer group rounded-lg"
                >
                  <img
                    src={reel.thumbnailUrl}
                    alt={reel.caption || 'Reel thumbnail'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-80 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Play count / View count badge */}
                  <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-white text-[11px] font-bold drop-shadow border border-white/10">
                    <Eye className="w-3.5 h-3.5 text-[#00E5FF]" />
                    <span>{formatViewCount(reel.viewsCount)}</span>
                  </div>

                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white">
                      <Film className="w-5 h-5 text-[#FF8A00]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Saved */}
      {activeTab === 'saved' && (
        <div id="saved-content">
          {!isMe ? (
            <div className="p-10 rounded-3xl bg-[#0B0F19] border border-white/5 text-center text-gray-400 space-y-2">
              <Lock className="w-10 h-10 text-gray-600 mx-auto stroke-[1.5]" />
              <h4 className="text-sm font-bold text-white">Saved posts are private</h4>
              <p className="text-xs text-gray-500">Only @{viewingUser.username} can view their saved collection.</p>
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[#0B0F19] border border-white/5 text-center text-gray-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-gray-500">
                <Bookmark className="w-7 h-7 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">No saved posts yet</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Save your favorite photos, travel inspiration, and tunes by tapping the bookmark icon in the feed.
                </p>
              </div>
              <button
                onClick={() => navigateTo('home')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/10 transition-all inline-flex items-center gap-1.5"
              >
                <span>Explore Home Feed</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:gap-2 rounded-2xl overflow-hidden">
              {savedPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="relative aspect-square overflow-hidden bg-[#0F1423] cursor-pointer group rounded-lg"
                >
                  <img
                    src={post.mediaUrl}
                    alt={post.caption || 'Saved post'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 p-1 rounded-full bg-black/60 backdrop-blur-md text-[#FF4668]">
                    <Bookmark className="w-3.5 h-3.5 fill-[#FF4668]" />
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                    <span className="flex items-center gap-1 drop-shadow">
                      <Heart className="w-3.5 h-3.5 fill-white text-white" />
                      {post.likesCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* EDIT PROFILE MODAL                                           */}
      {/* ============================================================ */}
      {isEditModalOpen && (
        <div
          id="loksy-edit-profile-modal"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#0B0F19] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Edit Profile</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form */}
            <form onSubmit={handleSaveProfile} className="p-5 space-y-5 overflow-y-auto flex-1">
              {/* Avatar Section */}
              <div className="flex flex-col items-center justify-center text-center space-y-3 pb-3 border-b border-white/5">
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <div className="w-24 h-24 rounded-full p-[2.5px] bg-gradient-to-tr from-[#FF4668] via-[#FF8A00] to-[#E040FB] shadow-xl">
                    <img
                      src={editAvatar}
                      alt="Avatar preview"
                      className="w-full h-full rounded-full object-cover border-2 border-[#0B0F19]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold gap-1">
                    <Camera className="w-6 h-6" />
                    <span>Change</span>
                  </div>
                </div>

                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="text-xs font-bold text-[#FF4668] hover:text-[#FF8A00] transition-colors"
                  >
                    Change Profile Photo
                  </button>
                  <p className="text-[11px] text-gray-400">Click avatar to upload or choose a preset below</p>
                </div>

                {/* Avatar Presets */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setEditAvatar(preset)}
                      className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${
                        editAvatar === preset ? 'border-[#FF4668] scale-110' : 'border-white/20 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Display Name</label>
                <input
                  id="edit-profile-name-input"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  maxLength={50}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF4668] transition-colors"
                  required
                />
              </div>

              {/* Username / Handle Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Username (@handle)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">@</span>
                  <input
                    id="edit-profile-username-input"
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                    placeholder="aarav_sharma"
                    maxLength={30}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF4668] transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Bio Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300">Bio</label>
                  <span className="text-[11px] text-gray-400">{editBio.length} / 150</span>
                </div>
                <textarea
                  id="edit-profile-bio-input"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value.slice(0, 150))}
                  placeholder="Tell your story... (e.g. Visual Storyteller & Indie Musician 🇮🇳 | Exploring Bharat 📸)"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF4668] transition-colors resize-none"
                />
              </div>

              {/* Cover Banner Selection */}
              <div className="space-y-2 pb-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300">Cover Banner</label>
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="text-[11px] text-[#00E5FF] hover:underline"
                  >
                    Upload Custom
                  </button>
                </div>
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="h-16 w-full rounded-xl overflow-hidden border border-white/10 relative">
                  {editCover ? (
                    <img src={editCover} alt="Cover preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-[#FF4668]/30 via-[#FF8A00]/20 to-[#6366F1]/30" />
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {COVER_PRESETS.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setEditCover(preset)}
                      className={`flex-1 h-8 rounded-lg overflow-hidden border transition-all ${
                        editCover === preset ? 'border-[#FF4668] ring-1 ring-[#FF4668]' : 'border-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Location & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#FF8A00]" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="New Delhi, India"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF4668]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3 text-[#00E5FF]" />
                    Website
                  </label>
                  <input
                    type="text"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="https://loksy.app/@aarav"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF4668]"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="edit-profile-submit-btn"
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white text-xs font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SETTINGS MENU / LOG OUT ACTION SHEET                         */}
      {/* ============================================================ */}
      {isSettingsMenuOpen && (
        <div
          id="loksy-settings-menu-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsSettingsMenuOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-[#0B0F19] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-4 space-y-2 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 px-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#FF4668]" />
                Account & Settings
              </h3>
              <button
                onClick={() => setIsSettingsMenuOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 pt-1">
              <button
                id="profile-settings-edit-profile-btn"
                onClick={handleOpenEditModal}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-200 hover:bg-white/5 transition-colors"
              >
                <Camera className="w-4 h-4 text-[#FF8A00]" />
                <span>Edit Profile Details</span>
              </button>

              <button
                id="profile-settings-saved-btn"
                onClick={() => {
                  setActiveTab('saved');
                  setIsSettingsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-200 hover:bg-white/5 transition-colors"
              >
                <Bookmark className="w-4 h-4 text-[#E040FB]" />
                <span>Saved Posts Collection</span>
              </button>

              <button
                id="profile-settings-full-settings-btn"
                onClick={() => {
                  setIsSettingsMenuOpen(false);
                  navigateTo('settings');
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-200 hover:bg-white/5 transition-colors"
              >
                <Settings className="w-4 h-4 text-[#00E5FF]" />
                <span>Settings & Preferences</span>
              </button>

              <button
                id="profile-settings-guidelines-btn"
                onClick={() => {
                  setIsSettingsMenuOpen(false);
                  setShowGuidelinesModal(true);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-200 hover:bg-white/5 transition-colors"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Copyright & Community Guidelines</span>
              </button>

              <div className="h-px bg-white/10 my-2" />

              {/* Log Out Button */}
              <button
                id="profile-logout-btn"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Log Out of @{viewingUser.username}</span>
              </button>
            </div>

            <button
              onClick={() => setIsSettingsMenuOpen(false)}
              className="w-full mt-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-400 hover:text-white transition-colors text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* LOG OUT CONFIRMATION DIALOG                                  */}
      {/* ============================================================ */}
      {showLogoutConfirm && (
        <div
          id="loksy-logout-confirm-dialog"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-[#0B0F19] border border-rose-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <LogOut className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">Log out of LOKSY?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                You will be logged out of @{currentUser.username} and returned to the Auth screen. You can sign back in anytime.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                id="confirm-logout-action-btn"
                onClick={handleConfirmLogout}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg transition-all active:scale-95"
              >
                Log Out
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SELECTED POST DETAIL MODAL                                   */}
      {/* ============================================================ */}
      {selectedPost && (
        <div
          id="loksy-post-detail-modal"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="w-full max-w-lg bg-[#0F1423] border border-white/10 rounded-3xl overflow-hidden shadow-2xl space-y-3 p-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Post Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <img
                  src={selectedPost.user.avatar}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-white/10"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    {selectedPost.user.name}
                    {selectedPost.user.isVerified && (
                      <CheckCircle2 className="w-3 h-3 text-[#FF4668]" />
                    )}
                  </div>
                  {selectedPost.location && (
                    <div className="text-[10px] text-gray-400">{selectedPost.location}</div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Post Media */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-black flex items-center justify-center relative">
              {selectedPost.mediaType === 'video' ? (
                <video
                  src={selectedPost.mediaUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  onPlay={() => incrementPostViews(selectedPost.id)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={selectedPost.mediaUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Video view count if video */}
            {selectedPost.mediaType === 'video' && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#00E5FF] px-1">
                <Eye className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>{formatViewCount(selectedPost.viewsCount)}</span>
              </div>
            )}

            {/* Interactive Post Actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleLikePost(selectedPost.id)}
                  className="flex items-center gap-1 text-xs font-bold transition-transform active:scale-125"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      selectedPost.isLiked ? 'fill-[#FF4668] text-[#FF4668]' : 'text-gray-300'
                    }`}
                  />
                  <span className={selectedPost.isLiked ? 'text-[#FF4668]' : 'text-gray-300'}>
                    {selectedPost.likesCount}
                  </span>
                </button>
                <button
                  onClick={() =>
                    openShareModal({
                      title: `Post by ${selectedPost.user.name}`,
                      url: window.location.origin + `/#post-${selectedPost.id}`,
                      image: selectedPost.mediaUrl,
                    })
                  }
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => toggleSavePost(selectedPost.id)}
                className="text-gray-300 hover:text-[#FF8A00] transition-colors"
                title={selectedPost.isSaved ? 'Unsave post' : 'Save post'}
              >
                <Bookmark
                  className={`w-5 h-5 ${
                    selectedPost.isSaved ? 'fill-[#FF8A00] text-[#FF8A00]' : 'text-gray-300'
                  }`}
                />
              </button>
            </div>

            {/* Caption & Metadata */}
            <div className="space-y-1 text-xs overflow-y-auto max-h-24">
              <p className="text-gray-200 leading-relaxed">{selectedPost.caption}</p>
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedPost.tags.map((tag) => (
                    <span key={tag} className="text-[#00E5FF] text-[11px]">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-white/5">
              <span>{selectedPost.createdAt}</span>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copyright & Community Guidelines Modal */}
      <CopyrightGuidelinesModal
        isOpen={showGuidelinesModal}
        onClose={() => setShowGuidelinesModal(false)}
      />
    </div>
  );
};

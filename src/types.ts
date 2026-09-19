/**
 * LOKSY - Data Architecture Types
 * Structured for direct compatibility with Firebase Firestore collections
 */

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  website?: string;
  location?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified?: boolean;
  isFollowing?: boolean;
  joinedDate?: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  text: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl: string;
  audioUrl: string;
  duration?: number;
  genre?: string;
  audioStartTime?: number; // In seconds (e.g. 15.0)
  clipDuration?: number;   // 15 or 30 seconds
  originalVolume?: number; // 0 - 100%
  musicVolume?: number;    // 0 - 100%
}

export interface Post {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isVerified?: boolean;
  };
  caption: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string;
  localMediaKey?: string;
  location?: string;
  tags?: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  isAiGenerated?: boolean;
  copyrightClaim?: CopyrightClaim;
  music?: MusicTrack;
  musicTitle?: string;
  musicArtist?: string;
  musicCover?: string;
  audioStartTime?: number;
  clipDuration?: number;
  originalVolume?: number;
  musicVolume?: number;
}

export interface StoryItem {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string;
  localMediaKey?: string;
  caption?: string;
  createdAt: string;
  duration?: number; // in seconds
  music?: MusicTrack;
  audioStartTime?: number;
  clipDuration?: number;
  originalVolume?: number;
  musicVolume?: number;
}

export interface StoryGroup {
  userId: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  hasUnseenStories: boolean;
  stories: StoryItem[];
}

export type CopyrightScanStatus = 'scanning' | 'clean' | 'flagged' | 'disputed' | 'resolved' | 'replaced';

export interface CopyrightClaim {
  id: string;
  type: 'audio' | 'visual' | 'both';
  status: CopyrightScanStatus;
  // Audio match info
  audioTrack?: string;
  audioArtist?: string;
  audioClaimant?: string;
  audioPolicy?: string;
  isAudioMuted?: boolean;
  // Visual match info
  visualClaimant?: string;
  visualDetails?: string;
  hasVisualWarning?: boolean;
  // Dispute info
  disputeStatus?: 'submitted' | 'approved' | 'rejected';
  disputeReason?: string;
  disputeNotes?: string;
  disputedAt?: string;
  detectedAt?: string;
}

export interface Reel {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isVerified?: boolean;
  };
  videoUrl: string;
  thumbnailUrl: string;
  localMediaKey?: string;
  caption: string;
  musicTitle: string;
  musicArtist: string;
  musicCover?: string;
  music?: MusicTrack;
  audioStartTime?: number;
  clipDuration?: number;
  originalVolume?: number;
  musicVolume?: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: string;
  isAiGenerated?: boolean;
  copyrightClaim?: CopyrightClaim;
}

export type NotificationType = 'like' | 'comment' | 'follow' | 'message' | 'mention';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  actor: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  targetId?: string; // postId, reelId, or chatId
  previewMediaUrl?: string;
  text: string;
  createdAt: string;
  isRead: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participant: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isOnline: boolean;
    lastSeen?: string;
  };
  lastMessage: {
    text: string;
    createdAt: string;
    isSenderMe: boolean;
  };
  unreadCount: number;
  messages: ChatMessage[];
}

export interface ReportItem {
  id: string;
  targetId: string;
  targetType: 'post' | 'user' | 'reel' | 'comment';
  reason: string;
  reportedBy: string;
  createdAt: string;
  notes?: string;
}

export type ScreenType =
  | 'landing'
  | 'login'
  | 'signup'
  | 'home'
  | 'search'
  | 'create'
  | 'reels'
  | 'notifications'
  | 'profile'
  | 'edit_profile'
  | 'chat'
  | 'settings';

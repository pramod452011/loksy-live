import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  Post,
  StoryGroup,
  Reel,
  NotificationItem,
  ChatConversation,
  Comment,
  ScreenType,
  ReportItem,
  CopyrightClaim,
  MusicTrack,
} from '../types';
import {
  auditMediaContent,
  RoyaltyFreeAudioTrack,
} from '../utils/copyrightAuditor';
import { INITIAL_POSTS, INITIAL_STORIES } from '../data/mockData';
import {
  isMediaCorrupted,
  getStoredMedia,
  getStoredMediaRecord,
  saveMediaRecord,
  deleteStoredMedia,
  sanitizeUrlForFirestore,
  DEFAULT_FALLBACK_IMAGE,
  DEFAULT_FALLBACK_VIDEO,
  DEFAULT_FALLBACK_THUMB,
} from '../utils/mediaStorage';
import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

export const DEFAULT_CREATOR: User = {
  id: 'user_me',
  name: 'LOKSY Creator',
  username: 'creator',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
  bio: 'Indian creator on LOKSY 🇮🇳 | Apni Duniya, Apne Log',
  website: '',
  location: 'India',
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  isVerified: false,
  joinedDate: 'Joined recently',
};

export type ThemeAccent = 'saffron' | 'magenta' | 'cyan' | 'emerald';
export type Language = 'en' | 'hi';

interface AppContextType {
  currentUser: User;
  isAuthenticated: boolean;
  activeScreen: ScreenType;
  currentScreen: ScreenType;
  navigateTo: (screen: ScreenType, options?: { replace?: boolean; userId?: string; chatId?: string }) => void;
  goBack: () => void;
  canGoBack: boolean;

  // Users & Relationships
  users: User[];
  viewingUser: User;
  setViewingUserId: (userId: string | null) => void;
  toggleFollowUser: (userId: string) => void;
  removeFollower: (followerId: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  blockedUsers: User[];
  blockedUserIds: string[];
  isUserBlocked: (userId: string) => boolean;

  // Posts
  posts: Post[];
  toggleLikePost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  hidePost: (postId: string) => void;
  incrementPostViews: (postId: string) => void;
  createPost: (newPost: Omit<Post, 'id' | 'createdAt' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'isLiked' | 'isSaved' | 'user'>) => void;
  deletePost: (postId: string) => void;

  // Comments
  comments: Record<string, Comment[]>;
  addComment: (postId: string, text: string) => void;
  toggleLikeComment: (postId: string, commentId: string) => void;
  activeCommentPostId: string | null;
  setActiveCommentPostId: (postId: string | null) => void;

  // Stories
  stories: StoryGroup[];
  addStory: (
    mediaUrl: string,
    caption?: string,
    music?: MusicTrack,
    audioOptions?: {
      audioStartTime?: number;
      clipDuration?: number;
      originalVolume?: number;
      musicVolume?: number;
      mediaType?: 'image' | 'video';
    }
  ) => void;
  activeStoryGroup: StoryGroup | null;
  activeStoryIndex: number;
  openStoryViewer: (userId: string, storyIndex?: number) => void;
  closeStoryViewer: () => void;
  nextStory: () => void;
  prevStory: () => void;

  // Reels
  reels: Reel[];
  activeReelIndex: number;
  setActiveReelIndex: (index: number) => void;
  toggleLikeReel: (reelId: string) => void;
  toggleSaveReel: (reelId: string) => void;
  incrementReelViews: (reelId: string) => void;
  createReel: (newReel: Omit<Reel, 'id' | 'createdAt' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'isLiked' | 'isSaved' | 'user'>) => void;
  deleteReel: (reelId: string) => Promise<void>;
  editReelCaption: (reelId: string, newCaption: string) => Promise<void>;

  // Modals & Safety
  isCreateModalOpen: boolean;
  openCreateModal: (defaultTab?: 'post' | 'reel', initialMusicTrack?: MusicTrack | null) => void;
  closeCreateModal: () => void;
  createModalInitialTab: 'post' | 'reel';
  initialCreateMusicTrack: MusicTrack | null;

  // Audio Track Screen / Modal
  audioTrackModalTrack: MusicTrack | null;
  openAudioTrackModal: (track: MusicTrack) => void;
  closeAudioTrackModal: () => void;

  // Notifications
  notifications: NotificationItem[];
  unreadNotifsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;

  // Chat
  chats: ChatConversation[];
  activeChat: ChatConversation | null;
  activeChatId: string | null;
  setActiveChatId: (chatId: string | null) => void;
  sendMessage: (chatId: string, text: string, imageUrl?: string) => void;
  startOrOpenChatWithUser: (user: User) => void;
  totalUnreadMessages: number;

  // Modals & Safety
  shareModalItem: { title: string; url: string; image?: string } | null;
  openShareModal: (item: { title: string; url: string; image?: string }) => void;
  closeShareModal: () => void;

  reportModalData: { targetId: string; targetType: 'post' | 'user' | 'reel' | 'comment'; nameOrTitle: string } | null;
  openReportModal: (data: { targetId: string; targetType: 'post' | 'user' | 'reel' | 'comment'; nameOrTitle: string }) => void;
  closeReportModal: () => void;
  submitReport: (reason: string, notes?: string) => void;

  followModalData: { type: 'followers' | 'following'; userId: string } | null;
  openFollowModal: (type: 'followers' | 'following', userId: string) => void;
  closeFollowModal: () => void;

  // Preferences & Profile Editing
  updateProfile: (updated: Partial<User>) => void;
  themeAccent: ThemeAccent;
  setThemeAccent: (accent: ThemeAccent) => void;
  language: Language;
  setLanguage: (lang: Language) => void;

  // Auth actions
  login: (identifier: string, name?: string) => void;
  signup: (
    nameOrData: string | { name: string; username: string; emailOrPhone: string; bio?: string; avatar?: string; password?: string },
    username?: string,
    email?: string,
    extra?: { bio?: string; avatar?: string; password?: string }
  ) => void;
  isEmailRegistered: (email: string) => boolean;
  logout: () => void;

  // Toast notifications
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Copyright & Content ID
  copyrightModalClaim: CopyrightClaim | null;
  copyrightModalTarget: {
    type: 'post' | 'reel';
    id: string;
    title?: string;
    artist?: string;
  } | null;
  openCopyrightModal: (
    claim: CopyrightClaim,
    target: { type: 'post' | 'reel'; id: string; title?: string; artist?: string }
  ) => void;
  closeCopyrightModal: () => void;
  disputeCopyrightClaim: (
    targetId: string,
    targetType: 'post' | 'reel',
    reason: string,
    notes?: string
  ) => Promise<void>;
  replacePostAudio: (
    targetId: string,
    targetType: 'post' | 'reel',
    track: RoyaltyFreeAudioTrack
  ) => Promise<void>;
  runContentIdAudit: (
    targetId: string,
    targetType: 'post' | 'reel',
    options: {
      caption?: string;
      tags?: string[];
      musicTitle?: string;
      musicArtist?: string;
      mediaType?: 'image' | 'video';
      isCommercialAudio?: boolean;
      simulateTrigger?: 'audio' | 'visual' | 'both' | 'clean';
    }
  ) => Promise<void>;

  isGuidelinesModalOpen: boolean;
  openGuidelinesModal: () => void;
  closeGuidelinesModal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage if available, or clean default creator
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('loksy_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.username === 'aarav_sharma') {
          return DEFAULT_CREATOR;
        }
        return parsed;
      }
      return DEFAULT_CREATOR;
    } catch {
      return DEFAULT_CREATOR;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('loksy_auth') === 'true' || sessionStorage.getItem('loksy_auth') === 'true';
  });

  const [activeScreen, setActiveScreen] = useState<ScreenType>(() => {
    const isAuth = localStorage.getItem('loksy_auth') === 'true' || sessionStorage.getItem('loksy_auth') === 'true';
    return isAuth ? 'home' : 'signup';
  });
  const [screenHistory, setScreenHistory] = useState<ScreenType[]>(() => {
    const isAuth = localStorage.getItem('loksy_auth') === 'true' || sessionStorage.getItem('loksy_auth') === 'true';
    return [isAuth ? 'home' : 'signup'];
  });

  // Live Firestore collections state (initialized empty, synced via onSnapshot)
  const [users, setUsers] = useState<User[]>([]);
  const [viewingUserId, setViewingUserIdState] = useState<string | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [hiddenPostIds, setHiddenPostIds] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [activeStoryUserId, setActiveStoryUserId] = useState<string | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);

  const [reels, setReels] = useState<Reel[]>([]);
  const [activeReelIndex, setActiveReelIndex] = useState<number>(0);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [reportedItems, setReportedItems] = useState<ReportItem[]>([]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createModalInitialTab, setCreateModalInitialTab] = useState<'post' | 'reel'>('post');
  const [initialCreateMusicTrack, setInitialCreateMusicTrack] = useState<MusicTrack | null>(null);
  const [audioTrackModalTrack, setAudioTrackModalTrack] = useState<MusicTrack | null>(null);
  const [shareModalItem, setShareModalItem] = useState<{ title: string; url: string; image?: string } | null>(null);
  const [reportModalData, setReportModalData] = useState<{ targetId: string; targetType: 'post' | 'user' | 'reel' | 'comment'; nameOrTitle: string } | null>(null);
  const [followModalData, setFollowModalData] = useState<{ type: 'followers' | 'following'; userId: string } | null>(null);

  // Copyright & Content ID Modals state
  const [copyrightModalClaim, setCopyrightModalClaim] = useState<CopyrightClaim | null>(null);
  const [copyrightModalTarget, setCopyrightModalTarget] = useState<{
    type: 'post' | 'reel';
    id: string;
    title?: string;
    artist?: string;
  } | null>(null);
  const [isGuidelinesModalOpen, setIsGuidelinesModalOpen] = useState<boolean>(false);

  const [themeAccent, setThemeAccent] = useState<ThemeAccent>('saffron');
  const [language, setLanguage] = useState<Language>('en');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync current user to local storage and Firestore
  useEffect(() => {
    try {
      localStorage.setItem('loksy_user', JSON.stringify(currentUser));
    } catch {
      // ignore
    }

    if (db && currentUser?.id && isAuthenticated) {
      try {
        const userRef = doc(db, 'users', currentUser.id);
        setDoc(
          userRef,
          {
            id: currentUser.id,
            name: currentUser.name,
            username: currentUser.username,
            avatar: currentUser.avatar,
            coverImage: currentUser.coverImage || '',
            bio: currentUser.bio || '',
            website: currentUser.website || '',
            location: currentUser.location || '',
            followersCount: currentUser.followersCount ?? 0,
            followingCount: currentUser.followingCount ?? 0,
            postsCount: currentUser.postsCount ?? 0,
            isVerified: currentUser.isVerified ?? false,
            joinedDate: currentUser.joinedDate || 'Recently',
            updatedAt: Date.now(),
          },
          { merge: true }
        ).catch((err) => console.warn('[Firestore] User sync error:', err));
      } catch (err) {
        console.warn('[Firestore] User sync init error:', err);
      }
    }
  }, [currentUser, isAuthenticated]);

  // 1. Live Firestore Posts Subscription
  useEffect(() => {
    if (!db) return;

    let unsub: (() => void) | undefined;
    try {
      const postsCol = collection(db, 'posts');
      unsub = onSnapshot(
        postsCol,
        async (snapshot) => {
          const livePosts: Post[] = [];

          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();

            // Clear any corrupted or broken post entries from Firestore immediately
            if (isMediaCorrupted(data.mediaUrl)) {
              console.info('[LOKSY] Clearing corrupted post entry from database:', docSnap.id);
              deleteDoc(doc(db, 'posts', docSnap.id)).catch(() => {});
              continue;
            }

            let effectiveMediaUrl = data.mediaUrl || '';
            let effectiveThumbnailUrl = data.thumbnailUrl;
            const lookupKey = data.localMediaKey || docSnap.id;
            if (lookupKey) {
              try {
                const storedRecord = await getStoredMediaRecord(lookupKey);
                if (storedRecord?.dataUrl) {
                  effectiveMediaUrl = storedRecord.dataUrl;
                  if (storedRecord.thumbnailUrl) {
                    effectiveThumbnailUrl = storedRecord.thumbnailUrl;
                  }
                } else {
                  const stored = await getStoredMedia(lookupKey);
                  if (stored) {
                    effectiveMediaUrl = stored;
                  }
                }
              } catch {
                // fall through
              }
            }

            livePosts.push({
              id: docSnap.id,
              userId: data.userId || data.user?.id || '',
              user: data.user || {
                id: data.userId || 'user_unknown',
                name: data.userName || 'Creator',
                username: data.userUsername || 'creator',
                avatar: data.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
                isVerified: data.userIsVerified || false,
              },
              caption: data.caption || '',
              mediaUrl: effectiveMediaUrl,
              mediaType: data.mediaType || 'image',
              thumbnailUrl: effectiveThumbnailUrl,
              localMediaKey: data.localMediaKey,
              location: data.location,
              tags: data.tags || [],
              likesCount: data.likesCount ?? 0,
              commentsCount: data.commentsCount ?? 0,
              sharesCount: data.sharesCount ?? 0,
              viewsCount: data.viewsCount ?? 0,
              isLiked: Array.isArray(data.likedBy) ? data.likedBy.includes(currentUser.id) : false,
              isSaved: false,
              createdAt: data.createdAt || 'Just now',
              createdAtTimestamp: data.createdAtTimestamp || 0,
              aspectRatio: data.aspectRatio || 'square',
              isAiGenerated: data.isAiGenerated || false,
              copyrightClaim: data.copyrightClaim || undefined,
              music: data.music || undefined,
              musicTitle: data.musicTitle || data.music?.title,
              musicArtist: data.musicArtist || data.music?.artist,
              musicCover: data.musicCover || data.music?.coverUrl,
              audioStartTime: data.audioStartTime ?? data.music?.audioStartTime,
              clipDuration: data.clipDuration ?? data.music?.clipDuration,
              originalVolume: data.originalVolume ?? data.music?.originalVolume,
              musicVolume: data.musicVolume ?? data.music?.musicVolume,
            } as Post);
          }

          // Sort by creation time (newest first)
          livePosts.sort((a, b) => {
            const timeA = (a as any).createdAtTimestamp || 0;
            const timeB = (b as any).createdAtTimestamp || 0;
            return timeB - timeA;
          });

          if (livePosts.length === 0) {
            setPosts(INITIAL_POSTS);
          } else {
            setPosts(livePosts);
          }
        },
        (error) => {
          console.warn('[Firestore] Posts listener error:', error);
          setPosts(INITIAL_POSTS);
        }
      );
    } catch (err) {
      console.warn('[Firestore] Failed to attach posts listener:', err);
      setPosts(INITIAL_POSTS);
    }

    return () => {
      if (unsub) unsub();
    };
  }, [currentUser.id]);

  // 2. Live Firestore Reels Subscription
  useEffect(() => {
    if (!db) return;

    let unsub: (() => void) | undefined;
    try {
      const reelsCol = collection(db, 'reels');
      unsub = onSnapshot(
        reelsCol,
        async (snapshot) => {
          const liveReels: Reel[] = [];
          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();

            let effectiveVideoUrl = data.videoUrl || data.mediaUrl || '';
            let effectiveThumbnailUrl = data.thumbnailUrl || data.mediaUrl || '';
            const lookupKey = data.localMediaKey || docSnap.id;
            if (lookupKey) {
              try {
                const storedRecord = await getStoredMediaRecord(lookupKey);
                if (storedRecord?.dataUrl) {
                  effectiveVideoUrl = storedRecord.dataUrl;
                  if (storedRecord.thumbnailUrl) {
                    effectiveThumbnailUrl = storedRecord.thumbnailUrl;
                  }
                } else {
                  const stored = await getStoredMedia(lookupKey);
                  if (stored) {
                    effectiveVideoUrl = stored;
                  }
                }
              } catch {
                // fall through
              }
            }

            liveReels.push({
              id: docSnap.id,
              userId: data.userId || data.user?.id || '',
              user: data.user || {
                id: data.userId || 'user_unknown',
                name: data.userName || 'Creator',
                username: data.userUsername || 'creator',
                avatar: data.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
                isVerified: data.userIsVerified || false,
              },
              caption: data.caption || '',
              videoUrl: effectiveVideoUrl,
              thumbnailUrl: effectiveThumbnailUrl,
              localMediaKey: data.localMediaKey,
              musicTitle: data.musicTitle || data.music?.title || 'Original Audio',
              musicArtist: data.musicArtist || data.music?.artist || 'LOKSY Artist',
              musicCover: data.musicCover || data.music?.coverUrl,
              music: data.music || undefined,
              audioStartTime: data.audioStartTime ?? data.music?.audioStartTime,
              clipDuration: data.clipDuration ?? data.music?.clipDuration,
              originalVolume: data.originalVolume ?? data.music?.originalVolume,
              musicVolume: data.musicVolume ?? data.music?.musicVolume,
              likesCount: data.likesCount ?? 0,
              commentsCount: data.commentsCount ?? 0,
              sharesCount: data.sharesCount ?? 0,
              viewsCount: data.viewsCount ?? 0,
              isLiked: Array.isArray(data.likedBy) ? data.likedBy.includes(currentUser.id) : false,
              isSaved: false,
              createdAt: data.createdAt || 'Just now',
              createdAtTimestamp: data.createdAtTimestamp || 0,
              isAiGenerated: data.isAiGenerated || false,
              copyrightClaim: data.copyrightClaim || undefined,
            } as Reel);
          }

          liveReels.sort((a, b) => {
            const timeA = (a as any).createdAtTimestamp || 0;
            const timeB = (b as any).createdAtTimestamp || 0;
            return timeB - timeA;
          });

          setReels(liveReels);
        },
        (error) => {
          console.warn('[Firestore] Reels listener error:', error);
        }
      );
    } catch (err) {
      console.warn('[Firestore] Failed to attach reels listener:', err);
    }

    return () => {
      if (unsub) unsub();
    };
  }, [currentUser.id]);

  // 3. Live Firestore Stories Subscription
  useEffect(() => {
    if (!db) return;

    let unsub: (() => void) | undefined;
    try {
      const storiesCol = collection(db, 'stories');
      unsub = onSnapshot(
        storiesCol,
        async (snapshot) => {
          if (snapshot.empty) {
            setStories(INITIAL_STORIES);
            return;
          }

          const groupMap = new Map<string, StoryGroup>();
          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            // Filter only active stories posted within the last 24 hours
            const isWithin24h = !data.createdAtTimestamp || (Date.now() - data.createdAtTimestamp < 24 * 60 * 60 * 1000);
            if (!isWithin24h) continue;

            const uId = data.userId || 'user_unknown';
            if (!groupMap.has(uId)) {
              groupMap.set(uId, {
                userId: uId,
                user: data.user || {
                  id: uId,
                  name: data.userName || data.username || 'Creator',
                  username: data.userUsername || data.username || 'creator',
                  avatar: data.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
                },
                hasUnseenStories: true,
                stories: [],
              });
            }

            let effectiveMediaUrl = data.mediaUrl || '';
            const lookupKey = data.localMediaKey || docSnap.id;
            if (lookupKey) {
              try {
                const storedRecord = await getStoredMediaRecord(lookupKey);
                if (storedRecord?.dataUrl) {
                  effectiveMediaUrl = storedRecord.dataUrl;
                }
              } catch {
                // fall through
              }
            }

            groupMap.get(uId)!.stories.push({
              id: docSnap.id,
              mediaUrl: effectiveMediaUrl,
              localMediaKey: data.localMediaKey,
              mediaType: data.mediaType || 'image',
              caption: data.caption || '',
              createdAt: data.createdAt || 'Just now',
              duration: data.duration || data.clipDuration || 5,
              music: data.music || undefined,
              audioStartTime: data.audioStartTime ?? data.music?.audioStartTime,
              clipDuration: data.clipDuration ?? data.music?.clipDuration,
              originalVolume: data.originalVolume ?? data.music?.originalVolume,
              musicVolume: data.musicVolume ?? data.music?.musicVolume,
            });
          }

          const liveStories = Array.from(groupMap.values());
          if (liveStories.length === 0) {
            setStories(INITIAL_STORIES);
          } else {
            // Sort so current user's story group is first if present
            liveStories.sort((a, b) => {
              if (a.userId === currentUser.id) return -1;
              if (b.userId === currentUser.id) return 1;
              return 0;
            });
            setStories(liveStories);
          }
        },
        (error) => {
          console.warn('[Firestore] Stories listener error:', error);
        }
      );
    } catch (err) {
      console.warn('[Firestore] Failed to attach stories listener:', err);
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // 4. Live Firestore Users Subscription
  useEffect(() => {
    if (!db) return;

    let unsub: (() => void) | undefined;
    try {
      const usersCol = collection(db, 'users');
      unsub = onSnapshot(
        usersCol,
        (snapshot) => {
          const liveUsers: User[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            liveUsers.push({
              id: docSnap.id,
              name: data.name || 'Creator',
              username: data.username || 'creator',
              avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
              coverImage: data.coverImage || '',
              bio: data.bio || '',
              website: data.website || '',
              location: data.location || '',
              followersCount: data.followersCount ?? 0,
              followingCount: data.followingCount ?? 0,
              postsCount: data.postsCount ?? 0,
              isVerified: data.isVerified ?? false,
              isFollowing: Array.isArray(data.followers) ? data.followers.includes(currentUser.id) : false,
              joinedDate: data.joinedDate || 'Recently',
            } as User);
          });
          setUsers(liveUsers);
        },
        (error) => {
          console.warn('[Firestore] Users listener error:', error);
        }
      );
    } catch (err) {
      console.warn('[Firestore] Failed to attach users listener:', err);
    }

    return () => {
      if (unsub) unsub();
    };
  }, [currentUser.id]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(current => (current === msg ? null : current));
    }, 2800);
  }, []);

  // Navigation handlers
  const navigateTo = useCallback((screen: ScreenType, options?: { replace?: boolean; userId?: string; chatId?: string }) => {
    if (options?.userId) {
      setViewingUserIdState(options.userId);
    } else if (screen === 'profile' && !options?.userId) {
      setViewingUserIdState(null); // Own profile
    }

    if (options?.chatId) {
      setActiveChatId(options.chatId);
    }

    if (options?.replace) {
      setScreenHistory(prev => [...prev.slice(0, -1), screen]);
    } else {
      setScreenHistory(prev => (prev[prev.length - 1] === screen ? prev : [...prev, screen]));
    }
    setActiveScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBack = useCallback(() => {
    if (screenHistory.length > 1) {
      const nextHistory = [...screenHistory];
      nextHistory.pop();
      const prevScreen = nextHistory[nextHistory.length - 1];
      setScreenHistory(nextHistory);
      setActiveScreen(prevScreen);
    } else {
      setActiveScreen('home');
    }
  }, [screenHistory]);

  const canGoBack = screenHistory.length > 1;

  // Active viewing user
  const viewingUser = viewingUserId
    ? users.find(u => u.id === viewingUserId) || {
        ...DEFAULT_CREATOR,
        id: viewingUserId,
        name: 'LOKSY Creator',
        username: 'creator',
      }
    : currentUser;

  const setViewingUserId = useCallback((userId: string | null) => {
    setViewingUserIdState(userId);
    navigateTo('profile', { userId: userId || undefined });
  }, [navigateTo]);

  // Follow / Unfollow
  const toggleFollowUser = useCallback(async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    const isNowFollowing = !targetUser?.isFollowing;

    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            isFollowing: isNowFollowing,
            followersCount: isNowFollowing ? u.followersCount + 1 : Math.max(0, u.followersCount - 1),
          };
        }
        return u;
      })
    );

    setCurrentUser(prev => ({
      ...prev,
      followingCount: isNowFollowing ? prev.followingCount + 1 : Math.max(0, prev.followingCount - 1),
    }));

    if (db) {
      try {
        const targetRef = doc(db, 'users', userId);
        const myRef = doc(db, 'users', currentUser.id);
        await updateDoc(targetRef, {
          followersCount: increment(isNowFollowing ? 1 : -1),
          followers: isNowFollowing ? arrayUnion(currentUser.id) : arrayRemove(currentUser.id),
        });
        await updateDoc(myRef, {
          followingCount: increment(isNowFollowing ? 1 : -1),
          following: isNowFollowing ? arrayUnion(userId) : arrayRemove(userId),
        });
      } catch (err) {
        console.warn('[Firestore] toggleFollowUser error:', err);
      }
    }

    const name = targetUser?.username || 'user';
    showToast(isNowFollowing ? `Following @${name}` : `Unfollowed @${name}`);
  }, [users, currentUser.id, showToast]);

  const removeFollower = useCallback((followerId: string) => {
    setCurrentUser(prev => ({
      ...prev,
      followersCount: Math.max(0, prev.followersCount - 1),
    }));
    showToast('Follower removed from your list');
  }, [showToast]);

  // Block / Unblock
  const blockUser = useCallback((userId: string) => {
    setBlockedUserIds(prev => [...prev, userId]);
    showToast('User has been blocked');
    if (activeScreen === 'profile' && viewingUserId === userId) {
      navigateTo('home');
    }
  }, [activeScreen, viewingUserId, navigateTo, showToast]);

  const unblockUser = useCallback((userId: string) => {
    setBlockedUserIds(prev => prev.filter(id => id !== userId));
    showToast('User has been unblocked');
  }, [showToast]);

  const isUserBlocked = useCallback((userId: string) => {
    return blockedUserIds.includes(userId);
  }, [blockedUserIds]);

  // Posts handlers
  const toggleLikePost = useCallback(async (postId: string) => {
    let willBeLiked = false;
    let newLikes = 0;

    setPosts(prev =>
      prev.map(post => {
        if (post.id === postId) {
          willBeLiked = !post.isLiked;
          newLikes = willBeLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);
          return {
            ...post,
            isLiked: willBeLiked,
            likesCount: newLikes,
          };
        }
        return post;
      })
    );

    if (db) {
      try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
          likesCount: increment(willBeLiked ? 1 : -1),
          likedBy: willBeLiked ? arrayUnion(currentUser.id) : arrayRemove(currentUser.id),
        });
      } catch (err) {
        console.warn('[Firestore] toggleLikePost error:', err);
      }
    }
  }, [currentUser.id]);

  const toggleSavePost = useCallback((postId: string) => {
    setPosts(prev =>
      prev.map(post => {
        if (post.id === postId) {
          const isSaved = !post.isSaved;
          showToast(isSaved ? 'Post saved to your collection' : 'Post removed from saved');
          return { ...post, isSaved };
        }
        return post;
      })
    );
  }, [showToast]);

  const hidePost = useCallback((postId: string) => {
    setHiddenPostIds(prev => [...prev, postId]);
    showToast('Post hidden from your feed');
  }, [showToast]);

  const incrementPostViews = useCallback(async (postId: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            viewsCount: (p.viewsCount ?? 0) + 1,
          };
        }
        return p;
      })
    );

    if (db) {
      try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
          viewsCount: increment(1),
        });
      } catch (err) {
        // quiet fallback
      }
    }
  }, []);

  // Copyright & Content ID Actions
  const openCopyrightModal = useCallback(
    (
      claim: CopyrightClaim,
      target: { type: 'post' | 'reel'; id: string; title?: string; artist?: string }
    ) => {
      setCopyrightModalClaim(claim);
      setCopyrightModalTarget(target);
    },
    []
  );

  const closeCopyrightModal = useCallback(() => {
    setCopyrightModalClaim(null);
    setCopyrightModalTarget(null);
  }, []);

  const openGuidelinesModal = useCallback(() => {
    setIsGuidelinesModalOpen(true);
  }, []);

  const closeGuidelinesModal = useCallback(() => {
    setIsGuidelinesModalOpen(false);
  }, []);

  const runContentIdAudit = useCallback(
    async (
      targetId: string,
      targetType: 'post' | 'reel',
      options: {
        caption?: string;
        tags?: string[];
        musicTitle?: string;
        musicArtist?: string;
        mediaType?: 'image' | 'video';
        isCommercialAudio?: boolean;
        simulateTrigger?: 'audio' | 'visual' | 'both' | 'clean';
      }
    ) => {
      // Simulate asynchronous background Content ID scanning (1.8s)
      setTimeout(async () => {
        const claim = auditMediaContent({
          mediaType: options.mediaType || (targetType === 'reel' ? 'video' : 'image'),
          musicTitle: options.musicTitle,
          musicArtist: options.musicArtist,
          caption: options.caption,
          tags: options.tags,
          isCommercialAudio: options.isCommercialAudio,
          simulateTrigger: options.simulateTrigger,
        });

        // Update local React state
        if (targetType === 'post') {
          setPosts(prev =>
            prev.map(p => (p.id === targetId ? { ...p, copyrightClaim: claim } : p))
          );
        } else {
          setReels(prev =>
            prev.map(r => (r.id === targetId ? { ...r, copyrightClaim: claim } : r))
          );
        }

        // Persist to Firestore if available
        if (db) {
          try {
            const collectionName = targetType === 'post' ? 'posts' : 'reels';
            await updateDoc(doc(db, collectionName, targetId), {
              copyrightClaim: claim,
            });
          } catch (err) {
            console.warn('[Firestore] update copyrightClaim note:', err);
          }
        }

        // Notify user if visual notice
        if (claim.hasVisualWarning) {
          showToast(`⚠️ Copyright notice: Visual content match detected on ${targetType}.`);
        }
      }, 1800);
    },
    [showToast]
  );

  const disputeCopyrightClaim = useCallback(
    async (targetId: string, targetType: 'post' | 'reel', reason: string, notes?: string) => {
      const updateClaim: Partial<CopyrightClaim> = {
        disputeStatus: 'submitted',
        disputeReason: reason,
        disputeNotes: notes,
      };

      if (targetType === 'post') {
        setPosts(prev =>
          prev.map(p =>
            p.id === targetId && p.copyrightClaim
              ? { ...p, copyrightClaim: { ...p.copyrightClaim, ...updateClaim } }
              : p
          )
        );
      } else {
        setReels(prev =>
          prev.map(r =>
            r.id === targetId && r.copyrightClaim
              ? { ...r, copyrightClaim: { ...r.copyrightClaim, ...updateClaim } }
              : r
          )
        );
      }

      if (db) {
        try {
          const collectionName = targetType === 'post' ? 'posts' : 'reels';
          await updateDoc(doc(db, collectionName, targetId), {
            'copyrightClaim.disputeStatus': 'submitted',
            'copyrightClaim.disputeReason': reason,
            'copyrightClaim.disputeNotes': notes || '',
          });
        } catch (err) {
          console.warn('[Firestore] dispute update error:', err);
        }
      }

      showToast('Dispute submitted! Rights holder has 30 days to review.');
      setCopyrightModalClaim(null);
    },
    [showToast]
  );

  const replacePostAudio = useCallback(
    async (targetId: string, targetType: 'post' | 'reel', track: RoyaltyFreeAudioTrack) => {
      const resolvedClaim: CopyrightClaim = {
        id: `claim_cleared_${targetId}`,
        type: 'audio',
        status: 'replaced',
        audioTrack: track.title,
        audioArtist: track.artist,
        isAudioMuted: false,
        audioPolicy: 'Cleared with royalty-free catalog',
        detectedAt: 'Just now',
      };

      if (targetType === 'post') {
        setPosts(prev =>
          prev.map(p =>
            p.id === targetId
              ? {
                  ...p,
                  musicTitle: track.title,
                  musicArtist: track.artist,
                  copyrightClaim: resolvedClaim,
                }
              : p
          )
        );
      } else {
        setReels(prev =>
          prev.map(r =>
            r.id === targetId
              ? {
                  ...r,
                  musicTitle: track.title,
                  musicArtist: track.artist,
                  copyrightClaim: resolvedClaim,
                }
              : r
          )
        );
      }

      if (db) {
        try {
          const collectionName = targetType === 'post' ? 'posts' : 'reels';
          await updateDoc(doc(db, collectionName, targetId), {
            musicTitle: track.title,
            musicArtist: track.artist,
            copyrightClaim: resolvedClaim,
          });
        } catch (err) {
          console.warn('[Firestore] replace audio error:', err);
        }
      }

      showToast(`🎵 Audio replaced with "${track.title}"! Sound unmuted.`);
      setCopyrightModalClaim(null);
    },
    [showToast]
  );

  const createPost = useCallback(async (newPostData: Omit<Post, 'id' | 'createdAt' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'isLiked' | 'isSaved' | 'user'>) => {
    const postId = `post_${Date.now()}`;
    const timestamp = Date.now();
    const mediaKey = newPostData.localMediaKey || postId;

    // Initial simulated scanning claim
    const initialClaim: CopyrightClaim = {
      id: `claim_${postId}`,
      type: newPostData.mediaType === 'video' ? 'audio' : 'visual',
      status: 'scanning',
    };

    // 1. Save full-fidelity media into IndexedDB permanently so user's uploaded videos/photos never expire or break
    if (newPostData.mediaUrl && (newPostData.mediaUrl.startsWith('data:') || newPostData.mediaUrl.startsWith('blob:'))) {
      try {
        await saveMediaRecord(
          mediaKey,
          newPostData.mediaUrl,
          newPostData.thumbnailUrl,
          newPostData.mediaType === 'video' ? 'video/mp4' : 'image/jpeg'
        );
        if (mediaKey !== postId) {
          await saveMediaRecord(
            postId,
            newPostData.mediaUrl,
            newPostData.thumbnailUrl,
            newPostData.mediaType === 'video' ? 'video/mp4' : 'image/jpeg'
          );
        }
      } catch (err) {
        console.warn('[AppContext] IndexedDB media save note:', err);
      }
    }

    const newPost: Post & { createdAtTimestamp: number; likedBy: string[] } = {
      ...newPostData,
      id: postId,
      userId: currentUser.id,
      localMediaKey: mediaKey,
      createdAt: 'Just now',
      createdAtTimestamp: timestamp,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: newPostData.mediaType === 'video' ? 0 : (newPostData.viewsCount ?? 0),
      isLiked: false,
      isSaved: false,
      likedBy: [],
      copyrightClaim: initialClaim,
      user: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
        isVerified: currentUser.isVerified,
      },
    };

    // Client-side local state keeps full-res media for instant crisp display
    setPosts(prev => [newPost, ...prev.filter(p => p.id !== postId)]);
    setCurrentUser(prev => ({
      ...prev,
      postsCount: prev.postsCount + 1,
    }));

    if (db) {
      try {
        // ALWAYS sanitize Firestore document to avoid 1MB document limit:
        // Strip data URLs, blob URLs, and large strings from all media fields
        const firestorePost = {
          ...newPost,
          mediaUrl: sanitizeUrlForFirestore(
            newPost.mediaUrl,
            newPost.mediaType === 'video' ? DEFAULT_FALLBACK_VIDEO : DEFAULT_FALLBACK_IMAGE
          ),
          thumbnailUrl: sanitizeUrlForFirestore(newPost.thumbnailUrl, DEFAULT_FALLBACK_THUMB),
          localMediaKey: mediaKey,
          copyrightClaim: initialClaim,
        };

        await setDoc(doc(db, 'posts', postId), firestorePost);
        await setDoc(
          doc(db, 'users', currentUser.id),
          {
            ...currentUser,
            postsCount: increment(1),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('[Firestore] createPost error:', err);
      }
    }

    // Trigger simulated background Content ID / copyright audit immediately post-upload
    runContentIdAudit(postId, 'post', {
      caption: newPostData.caption,
      tags: newPostData.tags,
      musicTitle: (newPostData as any).musicTitle,
      musicArtist: (newPostData as any).musicArtist,
      mediaType: newPostData.mediaType,
      isCommercialAudio: (newPostData as any).isCommercialAudio,
      simulateTrigger: (newPostData as any).simulateTrigger,
    });

    showToast('Post shared to LOKSY community!');
    navigateTo('home');
  }, [currentUser, showToast, navigateTo, runContentIdAudit]);

  const deletePost = useCallback(async (postId: string) => {
    setPosts(prev => {
      const target = prev.find(p => p.id === postId);
      const mediaKey = target?.localMediaKey || postId;
      deleteStoredMedia(mediaKey).catch(() => {});
      if (mediaKey !== postId) {
        deleteStoredMedia(postId).catch(() => {});
      }
      return prev.filter(p => p.id !== postId);
    });
    setCurrentUser(prev => ({ ...prev, postsCount: Math.max(0, prev.postsCount - 1) }));

    if (db) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
        await updateDoc(doc(db, 'users', currentUser.id), {
          postsCount: increment(-1),
        });
      } catch (err) {
        console.error('[Firestore] deletePost error:', err);
      }
    }

    showToast('Post deleted');
  }, [currentUser.id, showToast]);

  // Comments handlers
  const addComment = useCallback(async (postId: string, text: string) => {
    if (!text.trim()) return;
    const commentId = `c_${Date.now()}`;
    const newComment: Comment = {
      id: commentId,
      postId,
      userId: currentUser.id,
      user: {
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      text: text.trim(),
      createdAt: 'Just now',
      likesCount: 0,
      isLiked: false,
    };

    setComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));

    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
    );

    if (db) {
      try {
        await updateDoc(doc(db, 'posts', postId), {
          commentsCount: increment(1),
        });
        await setDoc(doc(db, `posts/${postId}/comments`, commentId), newComment);
      } catch (err) {
        console.warn('[Firestore] addComment error:', err);
      }
    }

    showToast('Comment posted!');
  }, [currentUser, showToast]);

  const toggleLikeComment = useCallback((postId: string, commentId: string) => {
    setComments(prev => {
      const list = prev[postId] || [];
      return {
        ...prev,
        [postId]: list.map(c => {
          if (c.id === commentId) {
            const isLiked = !c.isLiked;
            return {
              ...c,
              isLiked,
              likesCount: isLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
            };
          }
          return c;
        }),
      };
    });
  }, []);

  // Story handlers
  const addStory = useCallback(async (
    mediaUrl: string,
    caption?: string,
    music?: MusicTrack,
    audioOptions?: {
      audioStartTime?: number;
      clipDuration?: number;
      originalVolume?: number;
      musicVolume?: number;
      mediaType?: 'image' | 'video';
    }
  ) => {
    const storyId = `story_${Date.now()}`;
    const timestamp = Date.now();
    const isVideo = audioOptions?.mediaType === 'video' || Boolean(mediaUrl && mediaUrl.match(/\.(mp4|webm|mov)$/i));
    const audioStartTime = audioOptions?.audioStartTime ?? music?.audioStartTime ?? 0;
    const clipDuration = audioOptions?.clipDuration ?? music?.clipDuration ?? 15;
    const originalVolume = audioOptions?.originalVolume ?? music?.originalVolume ?? 100;
    const musicVolume = audioOptions?.musicVolume ?? music?.musicVolume ?? 90;

    if (mediaUrl && (mediaUrl.startsWith('data:') || mediaUrl.startsWith('blob:'))) {
      try {
        await saveMediaRecord(storyId, mediaUrl, mediaUrl, isVideo ? 'video/mp4' : 'image/jpeg');
      } catch (err) {
        console.warn('[AppContext] Story media save note:', err);
      }
    }

    const storyMusic: MusicTrack | undefined = music ? {
      ...music,
      audioStartTime,
      clipDuration,
      originalVolume,
      musicVolume,
    } : undefined;

    const newStoryDoc = {
      id: storyId,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      user: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      mediaUrl: sanitizeUrlForFirestore(mediaUrl, isVideo ? DEFAULT_FALLBACK_VIDEO : DEFAULT_FALLBACK_IMAGE),
      localMediaKey: storyId,
      mediaType: isVideo ? ('video' as const) : ('image' as const),
      caption: caption || '',
      createdAt: 'Just now',
      createdAtTimestamp: timestamp,
      duration: clipDuration || 15,
      music: storyMusic,
      audioStartTime,
      clipDuration,
      originalVolume,
      musicVolume,
    };

    const newStory = {
      id: storyId,
      mediaUrl,
      localMediaKey: storyId,
      mediaType: isVideo ? ('video' as const) : ('image' as const),
      caption: caption || '',
      createdAt: 'Just now',
      duration: clipDuration || 15,
      music: storyMusic,
      audioStartTime,
      clipDuration,
      originalVolume,
      musicVolume,
    };

    setStories(prev => {
      const meGroupIndex = prev.findIndex(g => g.userId === currentUser.id);
      if (meGroupIndex >= 0) {
        const updated = [...prev];
        updated[meGroupIndex] = {
          ...updated[meGroupIndex],
          hasUnseenStories: true,
          stories: [newStory, ...updated[meGroupIndex].stories],
        };
        return updated;
      } else {
        return [
          {
            userId: currentUser.id,
            user: {
              id: currentUser.id,
              name: 'Your Story',
              username: currentUser.username,
              avatar: currentUser.avatar,
            },
            hasUnseenStories: false,
            stories: [newStory],
          },
          ...prev,
        ];
      }
    });

    if (db) {
      try {
        await setDoc(doc(db, 'stories', storyId), newStoryDoc);
      } catch (err) {
        console.error('[Firestore] addStory error:', err);
      }
    }

    showToast('Story added successfully!');
  }, [currentUser, showToast]);

  const openStoryViewer = useCallback((userId: string, storyIndex = 0) => {
    setActiveStoryUserId(userId);
    setActiveStoryIndex(storyIndex);
  }, []);

  const closeStoryViewer = useCallback(() => {
    setActiveStoryUserId(null);
    setActiveStoryIndex(0);
  }, []);

  const activeStoryGroup = activeStoryUserId
    ? stories.find(s => s.userId === activeStoryUserId) || null
    : null;

  const nextStory = useCallback(() => {
    if (!activeStoryGroup || !activeStoryGroup.stories) return;
    if (activeStoryIndex < (activeStoryGroup.stories.length || 0) - 1) {
      setActiveStoryIndex(prev => prev + 1);
    } else {
      // Next user's story
      const currentGroupIndex = stories.findIndex(s => s.userId === activeStoryUserId);
      if (currentGroupIndex >= 0 && currentGroupIndex < (stories.length || 0) - 1) {
        setActiveStoryUserId(stories[currentGroupIndex + 1].userId);
        setActiveStoryIndex(0);
      } else {
        closeStoryViewer();
      }
    }
  }, [activeStoryGroup, activeStoryIndex, stories, activeStoryUserId, closeStoryViewer]);

  const prevStory = useCallback(() => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
    } else {
      const currentGroupIndex = stories.findIndex(s => s.userId === activeStoryUserId);
      if (currentGroupIndex > 0) {
        const prevGroup = stories[currentGroupIndex - 1];
        if (prevGroup && prevGroup.stories) {
          setActiveStoryUserId(prevGroup.userId);
          setActiveStoryIndex(Math.max(0, (prevGroup.stories.length || 1) - 1));
        }
      }
    }
  }, [activeStoryIndex, stories, activeStoryUserId]);

  // Reels handlers
  const toggleLikeReel = useCallback(async (reelId: string) => {
    let willBeLiked = false;

    setReels(prev =>
      prev.map(r => {
        if (r.id === reelId) {
          willBeLiked = !r.isLiked;
          return {
            ...r,
            isLiked: willBeLiked,
            likesCount: willBeLiked ? r.likesCount + 1 : Math.max(0, r.likesCount - 1),
          };
        }
        return r;
      })
    );

    if (db) {
      try {
        const reelRef = doc(db, 'reels', reelId);
        await updateDoc(reelRef, {
          likesCount: increment(willBeLiked ? 1 : -1),
          likedBy: willBeLiked ? arrayUnion(currentUser.id) : arrayRemove(currentUser.id),
        });
      } catch (err) {
        console.warn('[Firestore] toggleLikeReel error:', err);
      }
    }
  }, [currentUser.id]);

  const toggleSaveReel = useCallback((reelId: string) => {
    setReels(prev =>
      prev.map(r => {
        if (r.id === reelId) {
          const isSaved = !r.isSaved;
          showToast(isSaved ? 'Reel saved' : 'Reel removed from saved');
          return { ...r, isSaved };
        }
        return r;
      })
    );
  }, [showToast]);

  const incrementReelViews = useCallback(async (reelId: string) => {
    setReels(prev =>
      prev.map(r => {
        if (r.id === reelId) {
          return {
            ...r,
            viewsCount: (r.viewsCount ?? 0) + 1,
          };
        }
        return r;
      })
    );

    if (db) {
      try {
        const reelRef = doc(db, 'reels', reelId);
        await updateDoc(reelRef, {
          viewsCount: increment(1),
        });
      } catch (err) {
        // quiet fallback
      }
    }
  }, []);

  const createReel = useCallback(async (newReelData: Omit<Reel, 'id' | 'createdAt' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'isLiked' | 'isSaved' | 'user'>) => {
    const reelId = `reel_${Date.now()}`;
    const timestamp = Date.now();
    const mediaKey = newReelData.localMediaKey || reelId;

    if (newReelData.videoUrl && (newReelData.videoUrl.startsWith('data:') || newReelData.videoUrl.startsWith('blob:'))) {
      try {
        await saveMediaRecord(
          mediaKey,
          newReelData.videoUrl,
          newReelData.thumbnailUrl,
          'video/mp4'
        );
        if (mediaKey !== reelId) {
          await saveMediaRecord(
            reelId,
            newReelData.videoUrl,
            newReelData.thumbnailUrl,
            'video/mp4'
          );
        }
      } catch (err) {
        console.warn('[AppContext] IndexedDB reel media save note:', err);
      }
    }

    const initialClaim: CopyrightClaim = {
      id: `claim_${reelId}`,
      type: 'audio',
      status: 'scanning',
    };

    const newReel: Reel & { createdAtTimestamp: number; likedBy: string[] } = {
      ...newReelData,
      id: reelId,
      userId: currentUser.id,
      localMediaKey: mediaKey,
      createdAt: 'Just now',
      createdAtTimestamp: timestamp,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      isLiked: false,
      isSaved: false,
      likedBy: [],
      copyrightClaim: initialClaim,
      user: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
        isVerified: currentUser.isVerified,
      },
    };

    setReels(prev => [newReel, ...prev.filter(r => r.id !== reelId)]);
    setActiveReelIndex(0);
    setCurrentUser(prev => ({
      ...prev,
      postsCount: prev.postsCount + 1,
    }));

    if (db) {
      try {
        const firestoreReel = {
          ...newReel,
          videoUrl: sanitizeUrlForFirestore(newReel.videoUrl, DEFAULT_FALLBACK_VIDEO),
          thumbnailUrl: sanitizeUrlForFirestore(newReel.thumbnailUrl, DEFAULT_FALLBACK_THUMB),
          localMediaKey: mediaKey,
          copyrightClaim: initialClaim,
        };

        await setDoc(doc(db, 'reels', reelId), firestoreReel);
        await setDoc(
          doc(db, 'users', currentUser.id),
          {
            ...currentUser,
            postsCount: increment(1),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('[Firestore] createReel error:', err);
      }
    }

    // Trigger simulated background Content ID audit post-upload
    runContentIdAudit(reelId, 'reel', {
      caption: newReelData.caption,
      musicTitle: newReelData.musicTitle,
      musicArtist: newReelData.musicArtist,
      mediaType: 'video',
      isCommercialAudio: (newReelData as any).isCommercialAudio,
      simulateTrigger: (newReelData as any).simulateTrigger,
    });

    showToast('Reel published to LOKSY Reels! 🎬');
  }, [currentUser, showToast, runContentIdAudit]);

  const deleteReel = useCallback(async (reelId: string) => {
    setReels(prev => {
      const target = prev.find(r => r.id === reelId);
      const mediaKey = target?.localMediaKey || reelId;
      deleteStoredMedia(mediaKey).catch(() => {});
      if (mediaKey !== reelId) {
        deleteStoredMedia(reelId).catch(() => {});
      }
      return prev.filter(r => r.id !== reelId);
    });
    setCurrentUser(prev => ({ ...prev, postsCount: Math.max(0, prev.postsCount - 1) }));

    if (db) {
      try {
        await deleteDoc(doc(db, 'reels', reelId));
        await updateDoc(doc(db, 'users', currentUser.id), {
          postsCount: increment(-1),
        });
      } catch (err) {
        console.error('[Firestore] deleteReel error:', err);
      }
    }

    showToast('Reel deleted 🗑️');
  }, [currentUser.id, showToast]);

  const editReelCaption = useCallback(async (reelId: string, newCaption: string) => {
    setReels(prev =>
      prev.map(r => (r.id === reelId ? { ...r, caption: newCaption } : r))
    );

    if (db) {
      try {
        await updateDoc(doc(db, 'reels', reelId), {
          caption: newCaption,
        });
      } catch (err) {
        console.error('[Firestore] editReelCaption error:', err);
      }
    }

    showToast('Reel caption updated! ✨');
  }, [showToast]);

  // Notifications
  const unreadNotifsCount = notifications.filter(n => !n.isRead).length;

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    showToast('All notifications marked as read');
  }, [showToast]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    showToast('Notifications cleared');
  }, [showToast]);

  // Chats
  const totalUnreadMessages = chats.reduce((acc, c) => acc + c.unreadCount, 0);

  const activeChat = activeChatId ? chats.find(c => c.id === activeChatId) || null : null;

  const sendMessage = useCallback((chatId: string, text: string, imageUrl?: string) => {
    if (!text.trim() && !imageUrl) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      text: text.trim(),
      imageUrl,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    };

    setChats(prev =>
      prev.map(c => {
        if (c.id === chatId) {
          return {
            ...c,
            lastMessage: {
              text: text.trim() || '📷 Photo',
              createdAt: 'Just now',
              isSenderMe: true,
            },
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    // Realistic auto-reply simulation after 1.5s
    setTimeout(() => {
      setChats(prevChats =>
        prevChats.map(c => {
          if (c.id === chatId) {
            const replies = [
              "Bilkul! That's awesome brother! 🔥",
              "Thanks for sharing, loving the LOKSY vibe! ✨",
              "Arey waah! Let's definitely catch up soon 🙌",
              "Haanji, totally agree with you on this!",
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            const replyMsg = {
              id: `msg_reply_${Date.now()}`,
              senderId: c.participant.id,
              text: randomReply,
              createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isRead: true,
            };
            return {
              ...c,
              lastMessage: {
                text: randomReply,
                createdAt: 'Just now',
                isSenderMe: false,
              },
              messages: [...c.messages, replyMsg],
            };
          }
          return c;
        })
      );
    }, 1500);
  }, [currentUser]);

  const startOrOpenChatWithUser = useCallback((user: User) => {
    let existing = chats.find(c => c.participant.id === user.id);
    if (!existing) {
      const newChat: ChatConversation = {
        id: `chat_${user.id}`,
        participant: {
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          isOnline: true,
          lastSeen: 'Active now',
        },
        lastMessage: {
          text: 'Say Namaste! 👋',
          createdAt: 'Just now',
          isSenderMe: false,
        },
        unreadCount: 0,
        messages: [],
      };
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
    } else {
      setActiveChatId(existing.id);
    }
    navigateTo('chat', { chatId: existing ? existing.id : `chat_${user.id}` });
  }, [chats, navigateTo]);

  // Modals
  const openCreateModal = useCallback((defaultTab: 'post' | 'reel' = 'post', initialMusicTrack: MusicTrack | null = null) => {
    setCreateModalInitialTab(defaultTab);
    setInitialCreateMusicTrack(initialMusicTrack);
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setInitialCreateMusicTrack(null);
  }, []);

  const openAudioTrackModal = useCallback((track: MusicTrack) => {
    setAudioTrackModalTrack(track);
  }, []);

  const closeAudioTrackModal = useCallback(() => {
    setAudioTrackModalTrack(null);
  }, []);

  const openShareModal = useCallback((item: { title: string; url: string; image?: string }) => {
    setShareModalItem(item);
  }, []);

  const closeShareModal = useCallback(() => {
    setShareModalItem(null);
  }, []);

  const openReportModal = useCallback((data: { targetId: string; targetType: 'post' | 'user' | 'reel' | 'comment'; nameOrTitle: string }) => {
    setReportModalData(data);
  }, []);

  const closeReportModal = useCallback(() => {
    setReportModalData(null);
  }, []);

  const submitReport = useCallback((reason: string, notes?: string) => {
    if (!reportModalData) return;
    const newReport: ReportItem = {
      id: `rep_${Date.now()}`,
      targetId: reportModalData.targetId,
      targetType: reportModalData.targetType,
      reason,
      notes,
      reportedBy: currentUser.id,
      createdAt: new Date().toISOString(),
    };
    setReportedItems(prev => [...prev, newReport]);
    showToast('Report submitted. Thank you for keeping LOKSY safe!');
    setReportModalData(null);
  }, [reportModalData, currentUser, showToast]);

  const openFollowModal = useCallback((type: 'followers' | 'following', userId: string) => {
    setFollowModalData({ type, userId });
  }, []);

  const closeFollowModal = useCallback(() => {
    setFollowModalData(null);
  }, []);

  // Profile update
  const updateProfile = useCallback((updated: Partial<User>) => {
    setCurrentUser(prev => {
      const nextUser = { ...prev, ...updated };
      try {
        localStorage.setItem('loksy_user', JSON.stringify(nextUser));
        const rawAccounts = localStorage.getItem('loksy_registered_accounts');
        if (rawAccounts) {
          const accounts = JSON.parse(rawAccounts);
          const updatedAccounts = accounts.map((a: any) => {
            if (a.user?.id === prev.id || a.username === prev.username) {
              return { ...a, username: nextUser.username, user: nextUser };
            }
            return a;
          });
          localStorage.setItem('loksy_registered_accounts', JSON.stringify(updatedAccounts));
        }
      } catch (e) {
        console.warn('Failed to persist profile update to localStorage', e);
      }

      if (db && nextUser.id) {
        try {
          setDoc(doc(db, 'users', nextUser.id), nextUser, { merge: true }).catch((err) =>
            console.warn('[Firestore] updateProfile error:', err)
          );
        } catch (e) {
          console.warn('[Firestore] updateProfile init error:', e);
        }
      }

      return nextUser;
    });
    showToast('Profile updated successfully!');
    navigateTo('profile');
  }, [navigateTo, showToast]);

  // Auth functions
  const login = useCallback((identifier: string, nameOrPassword?: string) => {
    setIsAuthenticated(true);
    sessionStorage.setItem('loksy_auth', 'true');
    localStorage.setItem('loksy_auth', 'true');

    // Check registered accounts in localStorage
    try {
      const rawAccounts = localStorage.getItem('loksy_registered_accounts');
      if (rawAccounts) {
        const accounts = JSON.parse(rawAccounts);
        const cleanId = identifier.trim().toLowerCase();
        const match = accounts.find((a: any) =>
          a.identifier?.toLowerCase() === cleanId ||
          a.username?.toLowerCase() === cleanId.replace(/^@/, '') ||
          a.user?.username?.toLowerCase() === cleanId.replace(/^@/, '')
        );

        if (match && match.user) {
          setCurrentUser(match.user);
          localStorage.setItem('loksy_user', JSON.stringify(match.user));
          showToast(`Welcome back, ${match.user.name}! 🇮🇳`);
          navigateTo('home');
          return;
        }
      }
    } catch (e) {
      console.warn('[AppContext] Login account lookup error:', e);
    }

    if (nameOrPassword && nameOrPassword !== 'demo1234') {
      setCurrentUser(prev => ({ ...prev, name: nameOrPassword }));
    }
    showToast(`Welcome back to LOKSY! 🇮🇳`);
    navigateTo('home');
  }, [navigateTo, showToast]);

  // Check if an email is already registered across local storage, registered accounts, and demo creators
  const isEmailRegistered = useCallback((emailToCheck: string): boolean => {
    const clean = emailToCheck.trim().toLowerCase();
    if (!clean) return false;
    // Built-in demo accounts
    if (clean === 'aarav@loksy.app' || clean === 'priya@loksy.app') return true;

    try {
      const rawAccounts = localStorage.getItem('loksy_registered_accounts');
      if (rawAccounts) {
        const accounts = JSON.parse(rawAccounts);
        const found = accounts.some((a: any) =>
          a.identifier?.trim().toLowerCase() === clean ||
          a.email?.trim().toLowerCase() === clean ||
          a.user?.email?.trim().toLowerCase() === clean
        );
        if (found) return true;
      }
    } catch (e) {
      console.warn('[AppContext] Error checking registered accounts', e);
    }
    return false;
  }, []);

  const signup = useCallback((
    nameOrData: string | { name: string; username: string; emailOrPhone: string; bio?: string; avatar?: string; password?: string },
    usernameArg?: string,
    emailArg?: string,
    extraArg?: { bio?: string; avatar?: string; password?: string }
  ) => {
    let name = '';
    let rawUsername = '';
    let emailOrPhone = '';
    let bio = '';
    let avatar = '';
    let password = '';

    if (typeof nameOrData === 'object') {
      name = nameOrData.name.trim();
      rawUsername = nameOrData.username.trim();
      emailOrPhone = nameOrData.emailOrPhone.trim();
      bio = nameOrData.bio?.trim() || '';
      avatar = nameOrData.avatar?.trim() || '';
      password = nameOrData.password?.trim() || '';
    } else {
      name = nameOrData.trim();
      rawUsername = (usernameArg || '').trim();
      emailOrPhone = (emailArg || '').trim();
      bio = extraArg?.bio?.trim() || '';
      avatar = extraArg?.avatar?.trim() || '';
      password = extraArg?.password?.trim() || '';
    }

    // Strictly prevent duplicate email registrations: auth/email-already-in-use
    if (isEmailRegistered(emailOrPhone)) {
      const err = new Error('auth/email-already-in-use');
      (err as any).code = 'auth/email-already-in-use';
      throw err;
    }

    const cleanUsername = rawUsername
      .toLowerCase()
      .replace(/^@/, '')
      .replace(/[^a-z0-9_]/g, '_') || `user_${Date.now().toString().slice(-4)}`;

    const chosenAvatar = avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';
    const uniqueUserId = `user_${Date.now()}`;
    const cleanJoined = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Clean Initial State for New Users: 0 posts, 0 followers, 0 following, exact photo & handle
    const newUser: User = {
      id: uniqueUserId,
      name: name || 'LOKSY Creator',
      username: cleanUsername,
      avatar: chosenAvatar,
      coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
      bio: bio || 'Indian creator on LOKSY 🇮🇳 | Apni Duniya, Apne Log',
      website: '',
      location: 'India',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isVerified: false,
      joinedDate: cleanJoined,
    };

    // 1. Save registered account to localStorage
    try {
      const rawAccounts = localStorage.getItem('loksy_registered_accounts');
      const accounts = rawAccounts ? JSON.parse(rawAccounts) : [];
      const updatedAccounts = [
        ...accounts,
        {
          identifier: emailOrPhone,
          username: cleanUsername,
          password,
          user: newUser,
        },
      ];
      localStorage.setItem('loksy_registered_accounts', JSON.stringify(updatedAccounts));
    } catch (e) {
      console.warn('[AppContext] Failed to save registered account to localStorage', e);
    }

    // 2. Session Persistence in localStorage
    try {
      localStorage.setItem('loksy_user', JSON.stringify(newUser));
      localStorage.setItem('loksy_auth', 'true');
      sessionStorage.setItem('loksy_auth', 'true');
    } catch (e) {
      console.warn('[AppContext] Failed to save auth state to localStorage', e);
    }

    // 3. Clear pre-loaded dummy data for their account
    setPosts(prev => prev.map(p => ({ ...p, isSaved: false, isLiked: false })));
    setUsers(prev => [newUser, ...prev.filter(u => u.id !== newUser.id)]);
    setChats([]);
    setNotifications([
      {
        id: `notif_${Date.now()}`,
        type: 'system',
        userId: newUser.id,
        user: {
          id: 'loksy_official',
          name: 'LOKSY Community',
          username: 'loksy_official',
          avatar: '/loksy-logo.png',
          isVerified: true,
        },
        text: `Welcome to LOKSY, ${name}! Your clean profile is ready. Share your first moment! ✨`,
        timeAgo: 'Just now',
        isRead: false,
      },
    ]);

    if (db) {
      try {
        setDoc(doc(db, 'users', newUser.id), newUser, { merge: true }).catch((err) =>
          console.warn('[Firestore] signup user write error:', err)
        );
      } catch (e) {
        console.warn('[Firestore] signup user write init error:', e);
      }
    }

    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setViewingUserIdState(null); // Ensure viewing own profile
    showToast(`Welcome to LOKSY, ${name}! Explore stories and posts ✨`);
    navigateTo('home');
  }, [navigateTo, showToast]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('loksy_auth');
    localStorage.removeItem('loksy_auth');
    showToast('Logged out of LOKSY');
    navigateTo('signup');
  }, [navigateTo, showToast]);

  // Blocked users list
  const blockedUsers = useMemo(() => {
    return users.filter(u => blockedUserIds.includes(u.id));
  }, [users, blockedUserIds]);

  // Visible posts filtered by blocked and hidden
  const visiblePosts = posts.filter(p => !hiddenPostIds.includes(p.id) && !blockedUserIds.includes(p.userId));

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        activeScreen,
        currentScreen: activeScreen,
        navigateTo,
        goBack,
        canGoBack,

        users,
        viewingUser,
        setViewingUserId,
        toggleFollowUser,
        removeFollower,
        blockUser,
        unblockUser,
        blockedUsers,
        blockedUserIds,
        isUserBlocked,

        posts: visiblePosts,
        toggleLikePost,
        toggleSavePost,
        hidePost,
        incrementPostViews,
        createPost,
        deletePost,

        comments,
        addComment,
        toggleLikeComment,
        activeCommentPostId,
        setActiveCommentPostId,

        stories,
        addStory,
        activeStoryGroup,
        activeStoryIndex,
        openStoryViewer,
        closeStoryViewer,
        nextStory,
        prevStory,

        reels,
        activeReelIndex,
        setActiveReelIndex,
        toggleLikeReel,
        toggleSaveReel,
        incrementReelViews,
        createReel,
        deleteReel,
        editReelCaption,

        // Create Modal
        isCreateModalOpen,
        openCreateModal,
        closeCreateModal,
        createModalInitialTab,
        initialCreateMusicTrack,

        // Audio Track Screen / Modal
        audioTrackModalTrack,
        openAudioTrackModal,
        closeAudioTrackModal,

        notifications,
        unreadNotifsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,

        chats,
        activeChat,
        activeChatId,
        setActiveChatId,
        sendMessage,
        startOrOpenChatWithUser,
        totalUnreadMessages,

        shareModalItem,
        openShareModal,
        closeShareModal,

        reportModalData,
        openReportModal,
        closeReportModal,
        submitReport,

        followModalData,
        openFollowModal,
        closeFollowModal,

        updateProfile,
        themeAccent,
        setThemeAccent,
        language,
        setLanguage,

        login,
        signup,
        isEmailRegistered,
        logout,

        toastMessage,
        showToast,

        // Copyright & Content ID
        copyrightModalClaim,
        copyrightModalTarget,
        openCopyrightModal,
        closeCopyrightModal,
        disputeCopyrightClaim,
        replacePostAudio,
        runContentIdAudit,
        isGuidelinesModalOpen,
        openGuidelinesModal,
        closeGuidelinesModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MusicTrack } from '../types';
import { useApp } from '../context/AppContext';
import { formatViewCount } from '../data/mockData';
import { soundManager } from '../utils/audioEngine';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Music,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  UserPlus,
  Check,
  Camera,
  Eye,
  RotateCw,
  MoreHorizontal,
  Trash2,
  Edit3,
  Copy,
  AlertCircle,
  X,
  EyeOff,
} from 'lucide-react';

interface ReelCardProps {
  reel: ReturnType<typeof useApp>['reels'][0];
  index: number;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: (forcedState?: boolean) => void;
  onDoubleTapLike: (reelId: string) => void;
}

const ReelCard: React.FC<ReelCardProps> = ({
  reel,
  index,
  isActive,
  isMuted,
  onToggleMute,
  onDoubleTapLike,
}) => {
  const {
    currentUser,
    toggleLikeReel,
    toggleSaveReel,
    toggleFollowUser,
    incrementReelViews,
    deleteReel,
    editReelCaption,
    users,
    setViewingUserId,
    setActiveCommentPostId,
    openShareModal,
    openReportModal,
    showToast,
    openAudioTrackModal,
  } = useApp();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [heartAnimKey, setHeartAnimKey] = useState<number>(0);
  const [showAudioBadge, setShowAudioBadge] = useState<boolean>(false);
  const [hasVideoError, setHasVideoError] = useState<boolean>(false);
  const lastTapTimeRef = useRef<number>(0);
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);
  const hasIncrementedViewRef = useRef(false);

  // Reel action sheet, edit, delete & expand states
  const isOwner = currentUser?.id === reel.userId || currentUser?.id === reel.user?.id;
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCaptionText, setEditCaptionText] = useState(reel.caption);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingCaption, setIsSavingCaption] = useState(false);
  const [isHiddenByViewer, setIsHiddenByViewer] = useState(false);

  // Keep local editCaptionText synced if reel caption changes
  useEffect(() => {
    setEditCaptionText(reel.caption);
  }, [reel.caption]);

  const handleDeleteReel = async () => {
    try {
      setIsDeleting(true);
      await deleteReel(reel.id);
      setShowDeleteConfirm(false);
      setShowActionSheet(false);
    } catch (err) {
      console.error('Failed to delete reel:', err);
      showToast('Could not delete reel');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveCaption = async () => {
    try {
      setIsSavingCaption(true);
      await editReelCaption(reel.id, editCaptionText);
      setShowEditModal(false);
      setShowActionSheet(false);
    } catch (err) {
      console.error('Failed to update caption:', err);
      showToast('Could not update caption');
    } finally {
      setIsSavingCaption(false);
    }
  };

  // Music loop & seek boundaries
  const handleMusicTimeUpdate = () => {
    const musicAudio = musicAudioRef.current;
    if (!musicAudio) return;
    const startSec = reel.audioStartTime ?? reel.music?.audioStartTime ?? 0;
    const clipDur = reel.clipDuration ?? reel.music?.clipDuration ?? 15;
    if (clipDur > 0 && musicAudio.currentTime >= startSec + clipDur) {
      musicAudio.currentTime = startSec;
    }
  };

  const handleMusicLoaded = () => {
    const musicAudio = musicAudioRef.current;
    if (!musicAudio) return;
    const startSec = reel.audioStartTime ?? reel.music?.audioStartTime ?? 0;
    musicAudio.currentTime = startSec;
  };

  // Check if creator is followed
  const creator = users.find(u => u.id === reel.userId);
  const isFollowingCreator = creator?.isFollowing ?? false;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
      }
      soundManager.stopSoundtrack();
    };
  }, []);

  // Increment view count when reel starts playing (debounced by 1s to verify true engagement)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isActive && isPlaying) {
      if (!hasIncrementedViewRef.current) {
        hasIncrementedViewRef.current = true;
        timer = setTimeout(() => {
          incrementReelViews(reel.id);
        }, 1000);
      }
    } else if (!isActive) {
      hasIncrementedViewRef.current = false;
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isActive, isPlaying, reel.id, incrementReelViews]);

  // Handle play / pause and sound state when card becomes active or mute toggles
  useEffect(() => {
    const video = videoRef.current;
    const musicAudio = musicAudioRef.current;
    if (!video) return;

    if (isActive) {
      setHasVideoError(false);
      video.currentTime = 0;
      video.muted = isMuted;

      if (!isMuted) {
        const origVol = ((reel.originalVolume ?? reel.music?.originalVolume ?? 100) / 100);
        const musVol = ((reel.musicVolume ?? reel.music?.musicVolume ?? 85) / 100);
        const startSec = reel.audioStartTime ?? reel.music?.audioStartTime ?? 0;
        video.volume = Math.max(0, Math.min(1, origVol));
        if (musicAudio) {
          musicAudio.currentTime = startSec;
          musicAudio.muted = false;
          musicAudio.volume = Math.max(0, Math.min(1, musVol));
          musicAudio.play().catch(() => {});
        } else {
          soundManager.playSoundtrack(reel.musicTitle || 'LOKSY Reel Groove', 'dance');
          soundManager.setMuted(false);
        }
      } else {
        if (musicAudio) {
          musicAudio.muted = true;
          musicAudio.pause();
        }
        soundManager.setMuted(true);
      }

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Playback with audio blocked by browser policy, retrying muted:', err);
            video.muted = true;
            video.play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          });
      }
    } else {
      video.pause();
      if (musicAudio) {
        musicAudio.pause();
      }
      setIsPlaying(false);
      setProgress(0);
      soundManager.stopSoundtrack();
    }
  }, [isActive, isMuted, reel.musicTitle, reel.music?.audioUrl, reel.originalVolume, reel.musicVolume, reel.audioStartTime]);

  // Sync mute state and volume directly to video element whenever isMuted changes
  useEffect(() => {
    const video = videoRef.current;
    const musicAudio = musicAudioRef.current;

    if (video) {
      video.muted = isMuted;
      if (musicAudio) {
        musicAudio.muted = isMuted;
      }

      if (!isMuted) {
        const origVol = ((reel.originalVolume ?? reel.music?.originalVolume ?? 100) / 100);
        video.volume = Math.max(0, Math.min(1, origVol));
        if (isActive) {
          if (musicAudio) {
            const musVol = ((reel.musicVolume ?? reel.music?.musicVolume ?? 85) / 100);
            musicAudio.volume = Math.max(0, Math.min(1, musVol));
            musicAudio.play().catch(() => {});
          } else {
            soundManager.playSoundtrack(reel.musicTitle || 'LOKSY Reel Groove', 'dance');
            soundManager.setMuted(false);
          }
          if (video.paused) {
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        }
      } else {
        if (musicAudio) {
          musicAudio.pause();
        }
        soundManager.setMuted(true);
      }
    }
  }, [isMuted, isActive, reel.musicTitle, reel.music?.audioUrl, reel.originalVolume, reel.musicVolume]);

  // When video data is ready (especially for newly uploaded video blob URLs), ensure proper playback
  const handleCanPlay = () => {
    const video = videoRef.current;
    if (video && isActive) {
      video.muted = isMuted;
      if (!isMuted) {
        const origVol = ((reel.originalVolume ?? reel.music?.originalVolume ?? 100) / 100);
        video.volume = Math.max(0, Math.min(1, origVol));
        soundManager.playSoundtrack(reel.musicTitle || 'LOKSY Reel Groove', 'dance');
        soundManager.setMuted(false);
      }
      if (video.paused) {
        video.play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.warn('CanPlay video autoplay error:', err));
      }
    }
  };

  // Immediate synchronous unmute / mute handler on user tap
  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const video = videoRef.current;
    const nextMuted = !isMuted;

    if (video) {
      // Immediately unmute/mute directly in the trusted user tap callstack
      video.muted = nextMuted;
      if (!nextMuted) {
        video.volume = 1.0;
        soundManager.playSoundtrack(reel.musicTitle || 'LOKSY Reel Groove', 'dance');
        soundManager.setMuted(false);
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch((err) => console.warn('Play on unmute failed:', err));
        }
      } else {
        soundManager.setMuted(true);
      }
    }

    onToggleMute(nextMuted);
    setShowAudioBadge(true);
    setTimeout(() => setShowAudioBadge(false), 1200);
    showToast(nextMuted ? 'Muted 🔇' : 'Sound turned on 🔊');
  };

  // Track playback progress
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      setProgress((current / duration) * 100);
    }
  };

  // Handle single-tap (play/pause) vs double-tap (like) with strict 300ms window
  const handleContainerTap = (e: React.MouseEvent | React.TouchEvent) => {
    // Avoid triggering when tapping interactive buttons, links, or creator pills
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('.no-reel-tap')) {
      return;
    }

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap > 0 && timeSinceLastTap < DOUBLE_TAP_DELAY) {
      // --- DOUBLE TAP DETECTED ---
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      lastTapTimeRef.current = 0;

      setHeartAnimKey(now);
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 950);

      onDoubleTapLike(reel.id);
    } else {
      // --- FIRST TAP DETECTED ---
      lastTapTimeRef.current = now;

      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }

      singleTapTimeoutRef.current = setTimeout(() => {
        if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.muted = isMuted;
            if (!isMuted) {
              videoRef.current.volume = 1.0;
            }
            videoRef.current.play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
        singleTapTimeoutRef.current = null;
        lastTapTimeRef.current = 0;
      }, DOUBLE_TAP_DELAY);
    }
  };

  return (
    <div
      id={`reel-card-${reel.id}`}
      data-reel-index={index}
      className="reel-item relative w-full h-full snap-start snap-always shrink-0 overflow-hidden bg-black flex items-center justify-center select-none touch-manipulation cursor-pointer"
      onClick={handleContainerTap}
      style={{ touchAction: 'manipulation', WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      {/* 9:16 Video Canvas / Media Container */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden pointer-events-none select-none">
        {hasVideoError ? (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-auto">
            <p className="text-sm text-gray-300 mb-3">Reel video temporarily unavailable</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setHasVideoError(false);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                }
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <RotateCw className="w-4 h-4" /> Retry Video
            </button>
          </div>
        ) : (
          /* Video Element */
          <>
            <video
              ref={videoRef}
              src={reel.videoUrl}
              poster={reel.thumbnailUrl}
              loop
              playsInline
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              onCanPlay={handleCanPlay}
              onError={() => setHasVideoError(true)}
              className="w-full h-full object-cover pointer-events-none"
            />
            {reel.music?.audioUrl && (
              <audio
                ref={musicAudioRef}
                src={reel.music.audioUrl}
                loop
                preload="auto"
                crossOrigin="anonymous"
                playsInline
                onTimeUpdate={handleMusicTimeUpdate}
                onLoadedMetadata={handleMusicLoaded}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (reel.music?.audioUrl && !target.src.includes('allorigins')) {
                    target.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(reel.music.audioUrl)}`;
                    target.load();
                    target.play().catch(() => {});
                  }
                }}
              />
            )}
          </>
        )}

        {/* Ambient Top & Bottom Contrast Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90 pointer-events-none" />

        {/* Progress Bar along bottom of video */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-20">
          <div
            className="h-full bg-gradient-to-r from-[#FF4668] to-[#FF8A00] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Play/Pause state overlay indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 animate-fade-in">
            <div className="p-5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-2xl scale-110">
              <Play className="w-12 h-12 fill-white text-white translate-x-0.5" />
            </div>
          </div>
        )}

        {/* Center Audio Status Pop Badge (briefly pops when sound is toggled) */}
        {showAudioBadge && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 animate-fade-in">
            <div className="px-5 py-3 rounded-2xl bg-black/80 backdrop-blur-md text-white border border-white/20 shadow-2xl flex items-center gap-3 scale-110 transition-transform">
              {isMuted ? (
                <>
                  <VolumeX className="w-7 h-7 text-[#FF4668]" />
                  <span className="text-sm font-bold text-white">Audio Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-7 h-7 text-[#00E5FF] animate-pulse" />
                  <span className="text-sm font-bold text-[#00E5FF]">Sound Unmuted</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Double-tap prominent floating glowing heart burst animation */}
        {showHeartAnimation && (
          <div
            key={heartAnimKey}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40 flex items-center justify-center animate-heart-burst"
          >
            <div className="relative flex items-center justify-center">
              {/* Radiant backglow aura */}
              <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-[#FF4668] via-[#FF8A00] to-[#E040FB] blur-2xl opacity-75 animate-pulse" />

              {/* Glowing Heart Icon */}
              <Heart className="w-32 h-32 text-[#FF4668] fill-[#FF4668] drop-shadow-[0_0_40px_rgba(255,70,104,1)] relative z-10 filter" />

              {/* Miniature sparkle burst stars */}
              <Sparkles className="w-10 h-10 text-[#FFD700] absolute -top-4 -right-4 z-20 animate-bounce drop-shadow-[0_0_15px_rgba(255,215,0,1)]" />
              <Sparkles className="w-8 h-8 text-[#00E5FF] absolute -bottom-3 -left-3 z-20 animate-spin drop-shadow-[0_0_12px_rgba(0,229,255,1)]" style={{ animationDuration: '3s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Visible Floating AI Info / Generated with AI badge */}
      {reel.isAiGenerated && (
        <div className="absolute top-16 left-4 z-30 pointer-events-auto no-reel-tap">
          <div
            id={`reel-ai-badge-${reel.id}`}
            onClick={(e) => {
              e.stopPropagation();
              showToast('AI Info: Creator labeled this reel as generated or altered with AI.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black backdrop-blur-md border border-cyan-400/50 text-[#00E5FF] text-xs font-bold shadow-xl shadow-black/70 cursor-pointer active:scale-95 transition-all select-none"
            title="AI Info: Generated with AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00E5FF] animate-pulse" />
            <span>AI Info • Generated with AI</span>
          </div>
        </div>
      )}

      {/* Visible Floating Speaker / Mute Button on top of each reel */}
      <div className="absolute top-14 right-4 z-30 pointer-events-auto no-reel-tap">
        <button
          id={`reel-mute-btn-${reel.id}`}
          type="button"
          onClick={handleToggleMute}
          className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all select-none shadow-lg"
          title={isMuted ? 'Sound Off (tap to unmute)' : 'Sound On (tap to mute)'}
          aria-label={isMuted ? 'Unmute reel sound' : 'Mute reel sound'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-white/90" />
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
        </button>
      </div>

      {/* If hidden by viewer */}
      {isHiddenByViewer ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
          <EyeOff className="w-12 h-12 text-gray-500 mb-3" />
          <h4 className="text-white font-bold text-sm mb-1">Reel Hidden</h4>
          <p className="text-xs text-gray-400 mb-4 max-w-xs">
            We will show fewer reels like this in your feed.
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsHiddenByViewer(false);
            }}
            className="px-4 py-1.5 rounded-full border border-white/30 text-white text-xs font-semibold hover:bg-white/10 transition-colors"
          >
            Undo
          </button>
        </div>
      ) : null}

      {/* Bottom Content Area: Exact Instagram Layout (Bottom info & Right compact buttons) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3.5 pb-20 md:pb-6 flex items-end justify-between gap-3 pointer-events-none">
        {/* Left Bottom Information Stack: Creator Info, Caption & Audio Ticker */}
        <div className="flex-1 space-y-2 max-w-[calc(100%-4.25rem)] pointer-events-auto no-reel-tap pr-1">
          {/* Creator Pill with Follow button */}
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-[#FF4668] via-[#FF8A00] to-[#E040FB] cursor-pointer shrink-0 hover:scale-105 transition-transform"
              onClick={() => setViewingUserId(reel.userId)}
            >
              <img
                src={reel.user.avatar}
                alt={reel.user.name}
                className="w-full h-full rounded-full object-cover border-2 border-black"
                referrerPolicy="no-referrer"
              />
            </div>

            <div
              className="cursor-pointer min-w-0"
              onClick={() => setViewingUserId(reel.userId)}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm truncate hover:underline drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {reel.user.username}
                </span>
                {reel.user.isVerified && (
                  <Sparkles className="w-3.5 h-3.5 text-[#FFA000] shrink-0 drop-shadow-md" />
                )}
              </div>
            </div>

            {/* Creator Follow Button (if not own reel) */}
            {!isOwner && (
              <button
                id={`reel-follow-btn-${reel.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollowUser(reel.userId);
                }}
                className={`ml-1 px-3 py-1 rounded-lg text-xs font-semibold backdrop-blur-md active:scale-95 transition-all flex items-center gap-1 border ${
                  isFollowingCreator
                    ? 'bg-white/15 text-white border-white/20 hover:bg-white/25'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/40 shadow-sm'
                }`}
              >
                {isFollowingCreator ? (
                  <>
                    <Check className="w-3 h-3 text-[#00E5FF]" />
                    <span>Following</span>
                  </>
                ) : (
                  <span>Follow</span>
                )}
              </button>
            )}

            {reel.isAiGenerated && (
              <span
                id={`reel-creator-ai-chip-${reel.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  showToast('AI Info: Content created or modified using AI tools');
                }}
                className="ml-1 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-[#00E5FF] border border-cyan-500/40 shrink-0 cursor-pointer hover:bg-cyan-500/30 transition-colors"
                title="AI Info / Generated with AI"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI Info</span>
              </span>
            )}
          </div>

          {/* Instagram Caption with inline more / less toggle */}
          <div className="text-xs md:text-sm text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-relaxed font-normal">
            <span
              className="font-bold mr-1.5 cursor-pointer hover:underline inline"
              onClick={() => setViewingUserId(reel.userId)}
            >
              {reel.user.username}
            </span>
            <span className="inline">
              {isCaptionExpanded
                ? reel.caption
                : reel.caption.length > 70
                ? `${reel.caption.slice(0, 70)}...`
                : reel.caption}
            </span>
            {reel.caption.length > 70 && (
              <button
                id={`reel-caption-expand-btn-${reel.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCaptionExpanded(!isCaptionExpanded);
                }}
                className="ml-1.5 text-gray-300 font-semibold hover:text-white transition-colors"
              >
                {isCaptionExpanded ? 'less' : 'more'}
              </button>
            )}
            <span className="text-[11px] text-gray-300/90 ml-2 font-medium">
              • {formatViewCount(reel.viewsCount)}
            </span>
          </div>

          {/* Audio Ticker: Instagram-style Music Marquee */}
          <div
            id={`reel-audio-ticker-${reel.id}`}
            onClick={(e) => {
              e.stopPropagation();
              const trackToOpen: MusicTrack = reel.music || {
                id: `track_reel_${reel.id}`,
                title: reel.musicTitle || 'Original Audio',
                artist: reel.musicArtist || reel.user.name,
                album: 'LOKSY Reels',
                audioUrl: reel.music?.audioUrl || '',
                coverUrl: reel.thumbnailUrl || reel.user.avatar,
                duration: 30,
                category: 'Trending',
              };
              openAudioTrackModal(trackToOpen);
            }}
            className="flex items-center gap-1.5 text-xs text-white/95 hover:text-white cursor-pointer select-none group w-fit max-w-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pt-0.5"
            title="Tap to view audio page and use this sound"
          >
            <Music className="w-3.5 h-3.5 text-white shrink-0 group-hover:scale-110 transition-transform drop-shadow" />
            <div className="w-48 sm:w-56 overflow-hidden relative">
              <div className="animate-marquee inline-flex gap-6 whitespace-nowrap text-[11px] font-medium tracking-wide">
                <span>{reel.music?.title || reel.musicTitle || 'Original Audio'} • {reel.music?.artist || reel.musicArtist || reel.user.name}</span>
                <span>• Original audio</span>
                <span>{reel.music?.title || reel.musicTitle || 'Original Audio'} • {reel.music?.artist || reel.musicArtist || reel.user.name}</span>
                <span>• Original audio</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Floating Actions Stack: Compact 20px buttons (Heart, Comment, Share, Save, three-dots ..., spinning audio disc) */}
        <div className="flex flex-col items-center gap-4.5 shrink-0 pointer-events-auto no-reel-tap mb-1">
          {/* 1. Heart (Like) Button */}
          <button
            id={`reel-like-btn-${reel.id}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleLikeReel(reel.id);
            }}
            className="flex flex-col items-center group active:scale-125 transition-transform"
            aria-label={reel.isLiked ? 'Unlike reel' : 'Like reel'}
          >
            <Heart
              className={`w-[24px] h-[24px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] transition-all ${
                reel.isLiked ? 'fill-[#FF3040] text-[#FF3040] scale-110' : 'text-white'
              }`}
            />
            <span className="text-[12px] font-semibold text-white mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
              {reel.likesCount.toLocaleString()}
            </span>
          </button>

          {/* 2. Comment Button */}
          <button
            id={`reel-comment-btn-${reel.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setActiveCommentPostId(reel.id);
            }}
            className="flex flex-col items-center group active:scale-95 transition-transform"
            aria-label="View comments"
          >
            <MessageCircle className="w-[24px] h-[24px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform" />
            <span className="text-[12px] font-semibold text-white mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
              {reel.commentsCount.toLocaleString()}
            </span>
          </button>

          {/* 3. Share Button */}
          <button
            id={`reel-share-btn-${reel.id}`}
            onClick={(e) => {
              e.stopPropagation();
              openShareModal({
                title: `Reel by ${reel.user.name} on LOKSY`,
                url: `${window.location.origin}/#reel_${reel.id}`,
                image: reel.thumbnailUrl,
              });
            }}
            className="flex flex-col items-center group active:scale-95 transition-transform"
            aria-label="Share reel"
          >
            <Share2 className="w-[24px] h-[24px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform" />
            <span className="text-[12px] font-semibold text-white mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
              {reel.sharesCount.toLocaleString()}
            </span>
          </button>

          {/* 4. Save / Bookmark Button */}
          <button
            id={`reel-save-btn-${reel.id}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveReel(reel.id);
              showToast(reel.isSaved ? 'Removed from saved' : 'Saved to collection! 🔖');
            }}
            className="flex flex-col items-center group active:scale-125 transition-transform"
            aria-label={reel.isSaved ? 'Unsave reel' : 'Save reel'}
          >
            <Bookmark
              className={`w-[24px] h-[24px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] transition-all ${
                reel.isSaved ? 'fill-white text-white' : 'text-white'
              }`}
            />
          </button>

          {/* 5. Three-dots (...) More Options Button */}
          <button
            id={`reel-more-btn-${reel.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowActionSheet(true);
            }}
            className="flex flex-col items-center group p-0.5 text-white active:scale-90 transition-transform"
            aria-label="More options"
            title="More options"
          >
            <MoreHorizontal className="w-[24px] h-[24px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]" />
          </button>

          {/* 6. Spinning Audio Album Disc (Compact Instagram style) */}
          <div
            id={`reel-music-disc-${reel.id}`}
            onClick={(e) => {
              e.stopPropagation();
              const trackToOpen: MusicTrack = reel.music || {
                id: `track_reel_${reel.id}`,
                title: reel.musicTitle || 'Original Audio',
                artist: reel.musicArtist || reel.user.name,
                album: 'LOKSY Reels',
                audioUrl: reel.music?.audioUrl || '',
                coverUrl: reel.thumbnailUrl || reel.user.avatar,
                duration: 30,
                category: 'Trending',
              };
              openAudioTrackModal(trackToOpen);
            }}
            className={`w-8 h-8 rounded-full bg-black p-[2px] border-2 border-white/60 shadow-2xl mt-0.5 cursor-pointer hover:scale-110 active:scale-95 transition-transform ${
              isActive && isPlaying ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '3.5s' }}
            title="Tap to see audio page"
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-neutral-900 flex items-center justify-center">
              <img
                src={reel.music?.coverUrl || reel.user.avatar}
                alt="music disc"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Instagram-style Three-dots Action Sheet Modal */}
      {showActionSheet && (
        <div
          id={`reel-action-sheet-backdrop-${reel.id}`}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 no-reel-tap animate-fadeIn"
          onClick={(e) => {
            e.stopPropagation();
            setShowActionSheet(false);
          }}
        >
          <div
            id={`reel-action-sheet-${reel.id}`}
            className="w-full max-w-sm bg-[#262626] text-white rounded-t-3xl md:rounded-2xl overflow-hidden border border-white/10 shadow-2xl divide-y divide-white/10 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle for mobile */}
            <div className="py-2.5 flex justify-center md:hidden bg-transparent">
              <div className="w-10 h-1 bg-white/30 rounded-full" />
            </div>

            {/* Owner Actions */}
            {isOwner ? (
              <>
                <button
                  id={`reel-action-delete-${reel.id}`}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3.5 px-4 text-center text-sm font-bold text-red-500 hover:bg-white/5 active:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Reel</span>
                </button>
                <button
                  id={`reel-action-edit-${reel.id}`}
                  onClick={() => {
                    setEditCaptionText(reel.caption);
                    setShowEditModal(true);
                  }}
                  className="w-full py-3.5 px-4 text-center text-sm font-medium text-white hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Caption</span>
                </button>
              </>
            ) : (
              /* Viewer Actions */
              <>
                <button
                  id={`reel-action-report-${reel.id}`}
                  onClick={() => {
                    setShowActionSheet(false);
                    openReportModal(reel.id, 'reel');
                  }}
                  className="w-full py-3.5 px-4 text-center text-sm font-bold text-red-500 hover:bg-white/5 active:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Report</span>
                </button>
                <button
                  id={`reel-action-not-interested-${reel.id}`}
                  onClick={() => {
                    setShowActionSheet(false);
                    setIsHiddenByViewer(true);
                    showToast('Reel hidden from your feed');
                  }}
                  className="w-full py-3.5 px-4 text-center text-sm font-medium text-white hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <EyeOff className="w-4 h-4" />
                  <span>Not Interested</span>
                </button>
              </>
            )}

            {/* Common Actions */}
            <button
              id={`reel-action-save-${reel.id}`}
              onClick={() => {
                toggleSaveReel(reel.id);
                setShowActionSheet(false);
                showToast(reel.isSaved ? 'Removed from saved' : 'Saved to collection! 🔖');
              }}
              className="w-full py-3.5 px-4 text-center text-sm font-medium text-white hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Bookmark className="w-4 h-4" />
              <span>{reel.isSaved ? 'Remove from Saved' : 'Save Reel'}</span>
            </button>

            <button
              id={`reel-action-audio-${reel.id}`}
              onClick={() => {
                setShowActionSheet(false);
                const trackToOpen: MusicTrack = reel.music || {
                  id: `track_reel_${reel.id}`,
                  title: reel.musicTitle || 'Original Audio',
                  artist: reel.musicArtist || reel.user.name,
                  album: 'LOKSY Reels',
                  audioUrl: reel.music?.audioUrl || '',
                  coverUrl: reel.thumbnailUrl || reel.user.avatar,
                  duration: 30,
                  category: 'Trending',
                };
                openAudioTrackModal(trackToOpen);
              }}
              className="w-full py-3.5 px-4 text-center text-sm font-medium text-white hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Music className="w-4 h-4" />
              <span>Use Audio</span>
            </button>

            <button
              id={`reel-action-copy-link-${reel.id}`}
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/#reel_${reel.id}`);
                showToast('Link copied to clipboard! 📋');
                setShowActionSheet(false);
              }}
              className="w-full py-3.5 px-4 text-center text-sm font-medium text-white hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </button>

            <button
              id={`reel-action-share-${reel.id}`}
              onClick={() => {
                setShowActionSheet(false);
                openShareModal({
                  title: `Reel by ${reel.user.name} on LOKSY`,
                  url: `${window.location.origin}/#reel_${reel.id}`,
                  image: reel.thumbnailUrl,
                });
              }}
              className="w-full py-3.5 px-4 text-center text-sm font-medium text-white hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share to...</span>
            </button>

            <button
              id={`reel-action-cancel-${reel.id}`}
              onClick={() => setShowActionSheet(false)}
              className="w-full py-3.5 px-4 text-center text-sm font-semibold text-gray-400 hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Caption Modal for Owner */}
      {showEditModal && (
        <div
          id={`reel-edit-modal-backdrop-${reel.id}`}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 no-reel-tap animate-fadeIn"
          onClick={() => setShowEditModal(false)}
        >
          <div
            id={`reel-edit-modal-${reel.id}`}
            className="w-full max-w-md bg-[#1e1e1e] rounded-2xl border border-white/15 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <button
                onClick={() => setShowEditModal(false)}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <h3 className="text-sm font-bold text-white">Edit Reel Caption</h3>
              <button
                id={`reel-edit-done-btn-${reel.id}`}
                onClick={handleSaveCaption}
                disabled={isSavingCaption}
                className="text-sm font-bold text-[#00E5FF] hover:text-[#00E5FF]/80 disabled:opacity-50 transition-colors"
              >
                {isSavingCaption ? 'Saving...' : 'Done'}
              </button>
            </div>

            {/* Body with thumbnail preview and textarea */}
            <div className="p-4 space-y-3">
              <div className="flex gap-3">
                <div className="w-16 h-24 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                  <img
                    src={reel.thumbnailUrl || reel.user.avatar}
                    alt="reel preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <textarea
                    id={`reel-edit-caption-input-${reel.id}`}
                    value={editCaptionText}
                    onChange={(e) => setEditCaptionText(e.target.value)}
                    placeholder="Write a caption..."
                    rows={4}
                    maxLength={2200}
                    className="w-full bg-transparent text-sm text-white placeholder-gray-500 resize-none focus:outline-none"
                    autoFocus
                  />
                  <div className="text-right text-[11px] text-gray-500">
                    {editCaptionText.length} / 2,200
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Owner */}
      {showDeleteConfirm && (
        <div
          id={`reel-delete-confirm-backdrop-${reel.id}`}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 no-reel-tap animate-fadeIn"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            id={`reel-delete-confirm-dialog-${reel.id}`}
            className="w-full max-w-xs bg-[#262626] rounded-2xl border border-white/10 overflow-hidden shadow-2xl text-center divide-y divide-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <h4 className="text-base font-bold text-white mb-1.5">Delete Reel?</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                If you delete this reel, you won't be able to restore it. Are you sure?
              </p>
            </div>
            <button
              id={`reel-confirm-delete-btn-${reel.id}`}
              onClick={handleDeleteReel}
              disabled={isDeleting}
              className="w-full py-3.5 text-sm font-bold text-red-500 hover:bg-white/5 active:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              id={`reel-cancel-delete-btn-${reel.id}`}
              onClick={() => setShowDeleteConfirm(false)}
              className="w-full py-3.5 text-sm font-medium text-white hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ReelsScreen: React.FC = () => {
  const {
    reels,
    toggleLikeReel,
    openCreateModal,
    showToast,
  } = useApp();

  // Local active reel index state to prevent triggering full AppProvider root re-renders on every scroll
  const [activeReelIndex, setActiveReelIndex] = useState<number>(0);
  const activeReelIndexRef = useRef<number>(0);
  const previousFirstReelIdRef = useRef<string | null>(null);

  // Default to false so reels and newly uploaded videos play sound clearly
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Scroll to active reel on initial mount or index changes
  const scrollToReel = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const targetCard = container.querySelector(`[data-reel-index="${index}"]`) as HTMLElement | null;
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // When a new reel is published or first reel changes, reset scroll to top
  useEffect(() => {
    if (reels.length > 0) {
      const firstId = reels[0].id;
      if (previousFirstReelIdRef.current && previousFirstReelIdRef.current !== firstId) {
        setActiveReelIndex(0);
        activeReelIndexRef.current = 0;
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      }
      previousFirstReelIdRef.current = firstId;
    }
  }, [reels]);

  // Unified mute toggle handler that supports forced boolean states
  const handleToggleMute = useCallback((forcedState?: boolean) => {
    if (typeof forcedState === 'boolean') {
      setIsMuted(forcedState);
    } else {
      setIsMuted((prev) => {
        const next = !prev;
        return next;
      });
      showToast(!isMuted ? 'All reels muted 🔇' : 'Sound turned on 🔊');
    }
  }, [isMuted, showToast]);

  // IntersectionObserver to detect which reel is actively snapped into view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll('.reel-item');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const indexStr = entry.target.getAttribute('data-reel-index');
            if (indexStr !== null) {
              const newIndex = parseInt(indexStr, 10);
              if (!isNaN(newIndex) && newIndex !== activeReelIndexRef.current) {
                activeReelIndexRef.current = newIndex;
                setActiveReelIndex(newIndex);
              }
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.65, // Must be at least 65% in view to become active
      }
    );

    cards.forEach((c) => observer.observe(c));

    return () => {
      observer.disconnect();
    };
  }, [reels.length]);

  // Keyboard navigation for desktop arrow up/down & M key for mute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        if (activeReelIndex < reels.length - 1) {
          scrollToReel(activeReelIndex + 1);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        if (activeReelIndex > 0) {
          scrollToReel(activeReelIndex - 1);
        }
      } else if (e.key === 'm') {
        handleToggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      soundManager.stopSoundtrack();
    };
  }, [activeReelIndex, reels.length, scrollToReel, handleToggleMute]);

  const handleDoubleTapLike = (reelId: string) => {
    const targetReel = reels.find(r => r.id === reelId);
    if (targetReel) {
      if (!targetReel.isLiked) {
        // Toggle from unliked to liked (increments counter)
        toggleLikeReel(reelId);
      }
    }
  };

  return (
    <div
      id="loksy-reels-screen"
      className="relative w-full h-[calc(100vh-3.5rem)] md:h-[calc(100vh-1rem)] max-w-md mx-auto bg-black rounded-none md:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
    >
      {/* Top Header Overlay with Brand, Sound Toggle, & Create Reel trigger */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-4 pb-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="font-extrabold text-lg text-white tracking-wide drop-shadow-md">
            LOKSY Reels
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4668] animate-pulse" />
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Header Sound Toggle Control */}
          <button
            id="reels-header-mute-btn"
            onClick={() => handleToggleMute()}
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/20 active:scale-95 transition-all shadow-lg flex items-center justify-center"
            title={isMuted ? 'Unmute Sound (M)' : 'Mute Sound (M)'}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-[#FF4668]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#00E5FF] animate-pulse" />
            )}
          </button>

          <button
            id="reels-header-create-btn"
            onClick={() => openCreateModal('reel')}
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/20 active:scale-95 transition-all shadow-lg flex items-center gap-1.5 text-xs font-bold"
            title="Create Reel"
            aria-label="Create Reel"
          >
            <Camera className="w-4 h-4 text-[#FF8A00]" />
            <span className="hidden sm:inline">Create</span>
          </button>
        </div>
      </div>

      {/* Vertical Snap Scroll Container */}
      {reels.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-gray-400">
          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF8A00] mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No reels yet</h3>
          <p className="text-xs text-gray-400 max-w-xs mb-5">
            Be the first creator to share an immersive video reel on LOKSY!
          </p>
          <button
            onClick={() => openCreateModal('reel')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white text-xs font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Create First Reel</span>
          </button>
        </div>
      ) : (
        <div
          ref={containerRef}
          id="loksy-reels-scroll-container"
          className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar flex flex-col scroll-smooth"
        >
          {reels.map((reel, index) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              index={index}
              isActive={index === activeReelIndex}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onDoubleTapLike={handleDoubleTapLike}
            />
          ))}
        </div>
      )}

      {/* Desktop Vertical Quick Navigation Floating Controls */}
      <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 flex-col gap-2 pointer-events-auto">
        <button
          id="reel-nav-prev"
          onClick={() => {
            if (activeReelIndex > 0) scrollToReel(activeReelIndex - 1);
          }}
          disabled={activeReelIndex === 0}
          className="p-3 rounded-full bg-black/60 text-white disabled:opacity-20 hover:bg-black/90 backdrop-blur-md border border-white/15 transition-all shadow-xl hover:scale-110 active:scale-90"
          title="Previous Reel (Up Arrow)"
          aria-label="Previous Reel"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          id="reel-nav-next"
          onClick={() => {
            if (activeReelIndex < reels.length - 1) scrollToReel(activeReelIndex + 1);
          }}
          disabled={activeReelIndex === reels.length - 1}
          className="p-3 rounded-full bg-black/60 text-white disabled:opacity-20 hover:bg-black/90 backdrop-blur-md border border-white/15 transition-all shadow-xl hover:scale-110 active:scale-90"
          title="Next Reel (Down Arrow)"
          aria-label="Next Reel"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

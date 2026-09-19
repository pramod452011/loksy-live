import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Post, MusicTrack } from '../types';
import { useApp } from '../context/AppContext';
import { formatViewCount, formatLikesCount } from '../data/mockData';
import { soundManager } from '../utils/audioEngine';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  MapPin,
  Sparkles,
  ShieldAlert,
  EyeOff,
  UserX,
  Copy,
  Check,
  Bot,
  Eye,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCw,
  Trash2,
  AlertTriangle,
  Music,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
}

// Helper to determine mime type for standard streams vs blob URLs
const getVideoMimeType = (url: string): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('blob:') || url.startsWith('data:')) return undefined;
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.mp4')) return 'video/mp4';
  if (clean.endsWith('.webm')) return 'video/webm';
  if (clean.endsWith('.mov')) return 'video/quicktime';
  if (clean.endsWith('.ogg') || clean.endsWith('.ogv')) return 'video/ogg';
  if (clean.endsWith('.m4v')) return 'video/x-m4v';
  return 'video/mp4';
};

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const {
    toggleLikePost,
    toggleSavePost,
    hidePost,
    deletePost,
    incrementPostViews,
    blockUser,
    setViewingUserId,
    setActiveCommentPostId,
    openShareModal,
    openReportModal,
    showToast,
    currentUser,
    openCopyrightModal,
    runContentIdAudit,
    openAudioTrackModal,
  } = useApp();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [soundFeedback, setSoundFeedback] = useState<'unmuted' | 'muted' | null>(null);
  const articleRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasViewCountedRef = useRef(false);
  const lastTapRef = useRef<number>(0);
  const singleTapTimerRef = useRef<number | null>(null);
  const soundFeedbackTimerRef = useRef<number | null>(null);

  const fallbackThumbnail =
    post.thumbnailUrl ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1080&auto=format&fit=crop&q=80';

  // Music playback bounds (start time & clip duration looping)
  const handleMusicTimeUpdate = () => {
    const musicAudio = musicAudioRef.current;
    if (!musicAudio) return;
    const startSec = post.audioStartTime ?? post.music?.audioStartTime ?? 0;
    const clipDur = post.clipDuration ?? post.music?.clipDuration ?? 15;
    if (clipDur > 0 && musicAudio.currentTime >= startSec + clipDur) {
      musicAudio.currentTime = startSec;
    }
  };

  const handleMusicLoaded = () => {
    const musicAudio = musicAudioRef.current;
    if (!musicAudio) return;
    const startSec = post.audioStartTime ?? post.music?.audioStartTime ?? 0;
    musicAudio.currentTime = startSec;
  };

  // Sync DOM muted property directly whenever isMuted changes
  useEffect(() => {
    const video = videoRef.current;
    const musicAudio = musicAudioRef.current;

    const origVol = ((post.originalVolume ?? post.music?.originalVolume ?? 100) / 100);
    const musVol = ((post.musicVolume ?? post.music?.musicVolume ?? 85) / 100);
    const startSec = post.audioStartTime ?? post.music?.audioStartTime ?? 0;
    const clipDur = post.clipDuration ?? post.music?.clipDuration ?? 15;

    if (video) {
      video.muted = isMuted;
      if (!isMuted) {
        video.volume = Math.max(0, Math.min(1, origVol));
        if (isPlaying && !post.music?.audioUrl) {
          soundManager.playSoundtrack(post.caption, 'ambient');
          soundManager.setMuted(false);
        }
      } else {
        soundManager.setMuted(true);
      }
    }

    if (musicAudio) {
      musicAudio.muted = isMuted;
      if (!isMuted && isPlaying) {
        musicAudio.volume = Math.max(0, Math.min(1, musVol));
        if (musicAudio.currentTime < startSec || (clipDur > 0 && musicAudio.currentTime >= startSec + clipDur)) {
          musicAudio.currentTime = startSec;
        }
        musicAudio.play().catch(() => {});
      } else {
        musicAudio.pause();
      }
    }
  }, [isMuted, isPlaying, post.caption, post.music?.audioUrl, post.originalVolume, post.musicVolume, post.audioStartTime, post.clipDuration]);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      soundManager.stopSoundtrack();
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
      }
      if (singleTapTimerRef.current) {
        window.clearTimeout(singleTapTimerRef.current);
      }
      if (soundFeedbackTimerRef.current) {
        window.clearTimeout(soundFeedbackTimerRef.current);
      }
    };
  }, []);

  // IntersectionObserver: auto-play in viewport, pause when scrolled away
  useEffect(() => {
    const hasMediaToPlay = post.mediaType === 'video' || Boolean(post.music?.audioUrl);
    if (!hasMediaToPlay) return;
    const element = articleRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = videoRef.current;
          const musicAudio = musicAudioRef.current;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
            setIsPlaying(true);
            if (video) {
              video.muted = isMuted;
              const promise = video.play();
              if (promise !== undefined) {
                promise.catch(() => {
                  video.muted = true;
                  setIsMuted(true);
                  video.play().catch(() => {});
                });
              }
            }
            if (musicAudio && !isMuted) {
              musicAudio.play().catch(() => {});
            }
          } else {
            setIsPlaying(false);
            if (video) video.pause();
            if (musicAudio) musicAudio.pause();
            soundManager.stopSoundtrack();
          }
        });
      },
      { threshold: [0, 0.4, 0.8] }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [post.mediaType, post.music?.audioUrl, isMuted]);

  const toggleVideoPlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      soundManager.stopSoundtrack();
    } else {
      video.muted = isMuted;
      if (!isMuted) {
        video.volume = 1.0;
      }
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          if (!isMuted) {
            soundManager.playSoundtrack(post.caption, 'ambient');
            soundManager.setMuted(false);
          }
        })
        .catch(() => {});
    }
  };

  // Instant audio unmuting / muting with visual feedback
  const handleToggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const video = videoRef.current;
    const musicAudio = musicAudioRef.current;
    if (!video && !musicAudio) return;

    // Strict Copyright enforcement: If commercial audio was flagged, force muted state
    if (post.copyrightClaim?.isAudioMuted) {
      setIsMuted(true);
      if (video) {
        video.muted = true;
        video.volume = 0;
      }
      if (musicAudio) {
        musicAudio.muted = true;
        musicAudio.pause();
      }
      setSoundFeedback('muted');
      showToast('Audio muted due to copyright claim. Tap details to review match or replace audio.');
      if (soundFeedbackTimerRef.current) {
        window.clearTimeout(soundFeedbackTimerRef.current);
      }
      soundFeedbackTimerRef.current = window.setTimeout(() => {
        setSoundFeedback(null);
      }, 950);
      return;
    }

    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (video) {
      video.muted = nextMuted;
      if (!nextMuted) {
        const origVol = ((post.originalVolume ?? post.music?.originalVolume ?? 100) / 100);
        video.volume = Math.max(0, Math.min(1, origVol));
        if (video.paused) {
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }
    }

    if (musicAudio) {
      musicAudio.muted = nextMuted;
      if (!nextMuted) {
        const musVol = ((post.musicVolume ?? post.music?.musicVolume ?? 85) / 100);
        const startSec = post.audioStartTime ?? post.music?.audioStartTime ?? 0;
        musicAudio.volume = Math.max(0, Math.min(1, musVol));
        if (musicAudio.currentTime < startSec) {
          musicAudio.currentTime = startSec;
        }
        musicAudio.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        musicAudio.pause();
      }
    }

    if (!nextMuted) {
      setSoundFeedback('unmuted');
      showToast('Sound On 🔊');
    } else {
      setSoundFeedback('muted');
      showToast('Muted 🔇');
    }

    if (soundFeedbackTimerRef.current) {
      window.clearTimeout(soundFeedbackTimerRef.current);
    }
    soundFeedbackTimerRef.current = window.setTimeout(() => {
      setSoundFeedback(null);
    }, 850);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration) {
      setVideoProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
    if (!hasViewCountedRef.current) {
      hasViewCountedRef.current = true;
      incrementPostViews(post.id);
    }
  };

  // Disambiguate single tap (instant audio unmute/mute) and double tap (like)
  const handleMediaClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_THRESHOLD = 260;

    if (now - lastTapRef.current < DOUBLE_TAP_THRESHOLD) {
      // Double tap detected -> like post with heart animation burst
      if (singleTapTimerRef.current) {
        window.clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapRef.current = 0;
      if (!post.isLiked) {
        toggleLikePost(post.id);
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 800);
    } else {
      lastTapRef.current = now;
      if (post.mediaType === 'video') {
        // Instant audio unmuting when tapped
        handleToggleMute(e);
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.origin + `/#post_${post.id}`);
    showToast('Post link copied!');
    setIsMenuOpen(false);
  };

  const retryVideoLoad = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasVideoError(false);
    const video = videoRef.current;
    if (video) {
      video.load();
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <article
      ref={articleRef}
      id={`post-card-${post.id}`}
      className="w-full bg-[#0B0F19] border border-white/5 rounded-2xl sm:rounded-3xl overflow-hidden mb-4 shadow-lg transition-all"
    >
      {/* Header: User Info & 3-Dot More Menu */}
      <div className="flex items-center justify-between px-3.5 py-3 sm:px-4">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setViewingUserId(post.user.id)}
        >
          <div className="relative w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-tr from-[#FF4668] to-[#FF8A00] shrink-0">
            <img
              src={post.user.avatar}
              alt={post.user.name}
              className="w-full h-full rounded-full object-cover border-2 border-[#070A12]"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-white text-sm tracking-tight truncate group-hover:text-[#FF4668] transition-colors">
                {post.user.name}
              </span>
              {post.user.isVerified && (
                <Sparkles className="w-3.5 h-3.5 text-[#FFA000] shrink-0" />
              )}
              {post.isAiGenerated && (
                <span
                  id={`post-header-ai-chip-${post.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    showToast('AI Info: Labeled as generated or modified with AI tools.');
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-[#00E5FF] border border-cyan-500/30 shrink-0 cursor-pointer hover:bg-cyan-500/25 transition-colors"
                  title="AI Info / Generated with AI"
                >
                  <Bot className="w-3 h-3" />
                  <span>AI Info</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="truncate">@{post.user.username}</span>
              {post.location && (
                <>
                  <span>•</span>
                  <span className="truncate flex items-center gap-0.5 text-gray-400">
                    <MapPin className="w-3 h-3 text-[#00E5FF] shrink-0" />
                    {post.location}
                  </span>
                </>
              )}
            </div>
            {(post.music || post.musicTitle) && (
              <div
                id={`post-music-ticker-${post.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const trackToOpen: MusicTrack = post.music || {
                    id: `track_post_${post.id}`,
                    title: post.musicTitle || 'Original Audio',
                    artist: post.musicArtist || post.user.name,
                    album: 'LOKSY Music',
                    audioUrl: post.music?.audioUrl || '',
                    coverUrl: post.thumbnailUrl || post.mediaUrl,
                    duration: 30,
                    category: 'Trending',
                  };
                  openAudioTrackModal(trackToOpen);
                }}
                className="flex items-center gap-1.5 text-xs text-[#00E5FF] hover:underline cursor-pointer font-medium truncate mt-0.5 group"
                title="Tap to view audio page and use this track"
              >
                <Music className="w-3 h-3 text-[#00E5FF] shrink-0 group-hover:scale-110 transition-transform animate-pulse" />
                <span className="truncate">
                  {post.music?.title || post.musicTitle} • {post.music?.artist || post.musicArtist}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-gray-300 font-normal shrink-0 border border-white/10">
                  Original Audio
                </span>
              </div>
            )}
          </div>
        </div>

        {/* More Options Dropdown */}
        <div className="relative">
          <button
            id={`post-more-btn-${post.id}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Post Options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-10 w-48 bg-[#0F1423] border border-white/10 rounded-2xl shadow-2xl py-1.5 z-30 space-y-0.5 text-xs">
                {post.copyrightClaim && (
                  <button
                    onClick={() => {
                      openCopyrightModal(post.copyrightClaim!, {
                        type: 'post',
                        id: post.id,
                        title: post.musicTitle || post.copyrightClaim?.audioTrack,
                        artist: post.musicArtist || post.copyrightClaim?.audioArtist,
                      });
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4 text-[#00E5FF]" />
                    <span>Copyright Details</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    showToast('Re-running Content ID audit on media...');
                    runContentIdAudit(post.id, 'post', {
                      caption: post.caption,
                      tags: post.tags,
                      musicTitle: post.musicTitle,
                      musicArtist: post.musicArtist,
                      mediaType: post.mediaType,
                      isCommercialAudio: true,
                      simulateTrigger: post.mediaType === 'video' ? 'audio' : 'visual',
                    });
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-amber-300 hover:bg-amber-500/10 transition-colors"
                >
                  <RotateCw className="w-4 h-4 text-amber-400" />
                  <span>Re-scan Content ID</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-200 hover:bg-white/5 transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                  <span>Copy Link</span>
                </button>

                <button
                  onClick={() => {
                    hidePost(post.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-200 hover:bg-white/5 transition-colors"
                >
                  <EyeOff className="w-4 h-4 text-amber-400" />
                  <span>Hide Post</span>
                </button>

                {post.user.id !== currentUser.id && (
                  <button
                    onClick={() => {
                      blockUser(post.user.id);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-300 hover:bg-rose-500/10 transition-colors"
                  >
                    <UserX className="w-4 h-4 text-rose-400" />
                    <span>Block @{post.user.username}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    openReportModal({
                      targetId: post.id,
                      targetType: 'post',
                      nameOrTitle: `Post by @${post.user.username}`,
                    });
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Report Post</span>
                </button>

                {(post.user.id === currentUser.id || hasVideoError) && (
                  <button
                    onClick={() => {
                      deletePost(post.id);
                      setIsMenuOpen(false);
                      showToast('Post deleted from feed');
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-white/5"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Delete Post</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Media Container with single/double-tap detection */}
      <div
        className="relative w-full bg-[#070A12] select-none cursor-pointer overflow-hidden max-h-[580px] flex items-center justify-center"
        onClick={handleMediaClick}
      >
        {/* Prominent Visible 'AI Info / Generated with AI' badge */}
        {post.isAiGenerated && (
          <div
            id={`post-ai-badge-${post.id}`}
            onClick={(e) => {
              e.stopPropagation();
              showToast('AI Info: Creator marked this content as generated or altered with AI.');
            }}
            className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black backdrop-blur-md border border-cyan-400/50 text-[#00E5FF] text-xs font-bold shadow-xl shadow-black/70 cursor-pointer active:scale-95 transition-all select-none"
            title="AI Info: Generated with AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00E5FF] animate-pulse" />
            <span>AI Info • Generated with AI</span>
          </div>
        )}

        {/* Content ID Background Scan In Progress Badge */}
        {post.copyrightClaim?.status === 'scanning' && (
          <div
            id={`post-scanning-badge-${post.id}`}
            onClick={(e) => {
              e.stopPropagation();
              showToast('Content ID scan in progress: Analyzing audio/visual fingerprints...');
            }}
            className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-cyan-400/40 text-[#00E5FF] text-xs font-semibold shadow-xl shadow-black/80 animate-pulse cursor-pointer select-none"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#00E5FF] animate-spin" />
            <span>Auditing Content ID...</span>
          </div>
        )}

        {post.mediaType === 'video' ? (
          <div className="relative w-full h-auto max-h-[580px] bg-black flex items-center justify-center overflow-hidden">
            {hasVideoError ? (
              /* Fallback Thumbnail if video fails to decode */
              <div className="relative w-full h-auto max-h-[580px] flex items-center justify-center bg-black">
                <img
                  src={fallbackThumbnail}
                  alt={post.caption || 'Video preview thumbnail'}
                  className="w-full h-auto object-cover max-h-[580px] filter brightness-90"
                  referrerPolicy="no-referrer"
                />

                {/* Video Fallback Badge */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-gray-300 text-[11px] font-medium">
                  <Play className="w-3 h-3 text-[#FF4668] fill-[#FF4668]" />
                  <span>Video Preview</span>
                </div>

                {/* Center Retry and Delete Buttons */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1.5px] p-4 text-center z-20 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      id={`post-retry-video-${post.id}`}
                      onClick={retryVideoLoad}
                      className="px-3.5 py-2 rounded-2xl bg-black/80 hover:bg-black/95 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 shadow-2xl backdrop-blur-md transition-all group"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-[#00E5FF] group-hover:rotate-180 transition-transform duration-500" />
                      <span>Retry Video</span>
                    </button>
                    <button
                      id={`post-delete-broken-${post.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePost(post.id);
                        showToast('Corrupted post removed from feed');
                      }}
                      className="px-3.5 py-2 rounded-2xl bg-rose-600/85 hover:bg-rose-600 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 border border-rose-400/30 shadow-2xl transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                      <span>Delete Post</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={post.mediaUrl}
                  poster={post.thumbnailUrl || fallbackThumbnail}
                  className="w-full h-auto object-cover max-h-[580px]"
                  loop
                  playsInline
                  autoPlay
                  preload="auto"
                  muted={isMuted}
                  onPlay={handleVideoPlay}
                  onTimeUpdate={handleTimeUpdate}
                  onError={() => {
                    console.warn('Video playback notice for post', post.id);
                    setHasVideoError(true);
                  }}
                >
                  {/* Standard typed source if remote URL */}
                  {post.mediaUrl && !post.mediaUrl.startsWith('blob:') && !post.mediaUrl.startsWith('data:') && (
                    <source src={post.mediaUrl} type={getVideoMimeType(post.mediaUrl)} />
                  )}
                </video>

                {/* Progress Bar along bottom of video */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF4668] to-[#FF8A00] transition-all duration-100 ease-linear"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>

                {/* Play overlay indicator when paused */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 pointer-events-none z-10 animate-fade-in">
                    <div className="w-14 h-14 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-2xl scale-105">
                      <Play className="w-7 h-7 fill-white translate-x-0.5" />
                    </div>
                  </div>
                )}

                {/* Animated Center Speaker Feedback on Tap */}
                {soundFeedback === 'unmuted' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-fade-in">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/85 backdrop-blur-md border border-[#00E5FF]/40 text-[#00E5FF] shadow-2xl shadow-[#00E5FF]/20 scale-110">
                      <Volume2 className="w-5 h-5 text-[#00E5FF] animate-pulse" />
                      <span className="text-xs font-bold tracking-wide">Sound On</span>
                    </div>
                  </div>
                )}

                {soundFeedback === 'muted' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-fade-in">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-gray-200 shadow-2xl scale-110">
                      <VolumeX className="w-5 h-5 text-[#FF4668]" />
                      <span className="text-xs font-bold tracking-wide">Muted</span>
                    </div>
                  </div>
                )}

                {/* Instagram-style Clean Muted Notice Banner Over Post */}
                {post.copyrightClaim?.isAudioMuted && (
                  <div
                    id={`post-audio-copyright-banner-${post.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      openCopyrightModal(post.copyrightClaim!, {
                        type: 'post',
                        id: post.id,
                        title: post.musicTitle || post.copyrightClaim?.audioTrack,
                        artist: post.musicArtist || post.copyrightClaim?.audioArtist,
                      });
                    }}
                    className="absolute bottom-3 left-3 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/85 hover:bg-black backdrop-blur-md border border-white/20 text-white shadow-2xl cursor-pointer active:scale-95 transition-all select-none group"
                    title="Audio muted due to copyright claim. Click for details."
                  >
                    <VolumeX className="w-3.5 h-3.5 text-[#FF4668] shrink-0" />
                    <span className="text-[11px] font-medium text-gray-200 group-hover:text-white">
                      Audio muted due to copyright claim
                    </span>
                    <span className="text-[11px] font-bold text-[#00E5FF] underline ml-0.5">
                      Details
                    </span>
                  </div>
                )}

                {/* Mute/Unmute audio button with wave feedback */}
                <button
                  id={`post-mute-btn-${post.id}`}
                  onClick={handleToggleMute}
                  className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md transition-all z-20 border select-none ${
                    isMuted
                      ? 'bg-black/70 hover:bg-black/90 text-white border-white/15'
                      : 'bg-black/85 text-[#00E5FF] border-[#00E5FF]/40 shadow-lg shadow-[#00E5FF]/20'
                  }`}
                  title={isMuted ? 'Unmute video sound' : 'Mute video sound'}
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-4 h-4 text-[#FF4668]" />
                      <span className="text-[11px] font-medium text-gray-300">Muted</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-[#00E5FF] animate-pulse" />
                      <span className="text-[11px] font-bold text-[#00E5FF]">Sound On</span>
                      <div className="flex items-end gap-0.5 h-2.5 ml-0.5">
                        <span className="w-0.5 h-2.5 bg-[#00E5FF] rounded-full animate-pulse" />
                        <span className="w-0.5 h-1.5 bg-[#00E5FF] rounded-full animate-pulse delay-75" />
                        <span className="w-0.5 h-2 bg-[#00E5FF] rounded-full animate-pulse delay-150" />
                      </div>
                    </>
                  )}
                </button>
                {post.music?.audioUrl && (
                  <audio
                    ref={musicAudioRef}
                    src={post.music.audioUrl}
                    loop
                    preload="auto"
                    crossOrigin="anonymous"
                    playsInline
                    onTimeUpdate={handleMusicTimeUpdate}
                    onLoadedMetadata={handleMusicLoaded}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (post.music?.audioUrl && !target.src.includes('allorigins')) {
                        target.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(post.music.audioUrl)}`;
                        target.load();
                        target.play().catch(() => {});
                      }
                    }}
                  />
                )}
              </>
            )}
          </div>
        ) : (
          <div className="relative w-full h-auto max-h-[580px] bg-black flex items-center justify-center overflow-hidden">
            <img
              src={post.mediaUrl}
              alt={post.caption}
              className="w-full h-auto object-cover max-h-[580px]"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            {post.music?.audioUrl && (
              <>
                <audio
                  ref={musicAudioRef}
                  src={post.music.audioUrl}
                  loop
                  preload="auto"
                  crossOrigin="anonymous"
                  playsInline
                  onTimeUpdate={handleMusicTimeUpdate}
                  onLoadedMetadata={handleMusicLoaded}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (post.music?.audioUrl && !target.src.includes('allorigins')) {
                      target.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(post.music.audioUrl)}`;
                      target.load();
                      target.play().catch(() => {});
                    }
                  }}
                />
                <button
                  id={`post-photo-mute-btn-${post.id}`}
                  onClick={handleToggleMute}
                  className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md transition-all z-20 border select-none ${
                    isMuted
                      ? 'bg-black/70 hover:bg-black/90 text-white border-white/15'
                      : 'bg-black/85 text-[#00E5FF] border-[#00E5FF]/40 shadow-lg shadow-[#00E5FF]/20'
                  }`}
                  title={isMuted ? 'Turn Sound On' : 'Turn Sound Off'}
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-4 h-4 text-[#FF4668]" />
                      <span className="text-[11px] font-medium text-gray-300">Sound Off</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-[#00E5FF] animate-pulse" />
                      <span className="text-[11px] font-bold text-[#00E5FF]">Sound On</span>
                      <div className="flex items-end gap-0.5 h-2.5 ml-0.5">
                        <span className="w-0.5 h-2.5 bg-[#00E5FF] rounded-full animate-pulse" />
                        <span className="w-0.5 h-1.5 bg-[#00E5FF] rounded-full animate-pulse delay-75" />
                        <span className="w-0.5 h-2 bg-[#00E5FF] rounded-full animate-pulse delay-150" />
                      </div>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* Double-tap animated heart burst */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="animate-ping duration-500">
              <Heart className="w-24 h-24 text-[#FF4668] fill-[#FF4668] drop-shadow-2xl" />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons: Like, Comment, Share, Save */}
      <div className="px-3.5 pt-3 pb-1 sm:px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {/* Like */}
            <button
              id={`post-like-btn-${post.id}`}
              onClick={() => toggleLikePost(post.id)}
              className={`flex items-center gap-1.5 text-xs font-semibold p-1.5 -ml-1.5 rounded-xl transition-all active:scale-125 ${
                post.isLiked
                  ? 'text-[#FF4668]'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Heart
                className={`w-6 h-6 transition-transform ${
                  post.isLiked ? 'fill-[#FF4668] text-[#FF4668]' : ''
                }`}
              />
            </button>

            {/* Comment */}
            <button
              id={`post-comment-btn-${post.id}`}
              onClick={() => setActiveCommentPostId(post.id)}
              className="flex items-center gap-1.5 text-xs font-semibold p-1.5 rounded-xl text-gray-300 hover:text-white transition-all active:scale-95"
            >
              <MessageCircle className="w-6 h-6" />
            </button>

            {/* Share */}
            <button
              id={`post-share-btn-${post.id}`}
              onClick={() =>
                openShareModal({
                  title: `Post by ${post.user.name}`,
                  url: window.location.origin + `/#post_${post.id}`,
                  image: post.mediaUrl,
                })
              }
              className="flex items-center gap-1.5 text-xs font-semibold p-1.5 rounded-xl text-gray-300 hover:text-white transition-all active:scale-95"
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>

          {/* Bookmark Save */}
          <button
            id={`post-save-btn-${post.id}`}
            onClick={() => toggleSavePost(post.id)}
            className={`p-1.5 rounded-xl transition-all active:scale-125 ${
              post.isSaved
                ? 'text-[#00E5FF]'
                : 'text-gray-300 hover:text-white'
            }`}
            title="Save to collection"
          >
            <Bookmark
              className={`w-6 h-6 ${post.isSaved ? 'fill-[#00E5FF] text-[#00E5FF]' : ''}`}
            />
          </button>
        </div>

        {/* Video View Count (below video post) */}
        {post.mediaType === 'video' && (
          <div
            id={`post-view-count-${post.id}`}
            className="flex items-center gap-1.5 font-bold text-xs text-[#00E5FF] mb-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>{formatViewCount(post.viewsCount)}</span>
          </div>
        )}

        {/* Likes Count - Clean Formatting ("1 like", "10 likes", etc.) */}
        <div id={`post-likes-count-${post.id}`} className="font-bold text-xs text-white mb-1.5">
          {formatLikesCount(post.likesCount)}
        </div>

        {/* Discreet Warning Tag for Copyrighted Visual Content */}
        {post.copyrightClaim?.hasVisualWarning && (
          <div
            id={`post-visual-copyright-tag-${post.id}`}
            onClick={() =>
              openCopyrightModal(post.copyrightClaim!, {
                type: 'post',
                id: post.id,
              })
            }
            className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs cursor-pointer active:scale-98 transition-all select-none"
            title="Copyright Notice: Contains copyrighted content. Click to view match details."
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-medium text-[11px] truncate">
                ⚠️ Copyright Notice: Contains copyrighted content
              </span>
            </div>
            <span className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline ml-2 shrink-0">
              Details
            </span>
          </div>
        )}

        {/* Caption & Expanding Hashtags */}
        <div className="text-xs text-gray-200 leading-relaxed mb-1.5">
          <span
            className="font-bold text-white mr-1.5 cursor-pointer hover:underline"
            onClick={() => setViewingUserId(post.user.id)}
          >
            {post.user.username}
          </span>
          <span className={isExpanded ? '' : 'line-clamp-2'}>
            {post.caption}
          </span>
          {Boolean(post.caption && post.caption.length > 90) && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-gray-400 text-xs ml-1 hover:text-gray-200"
            >
              more
            </button>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium text-[#FF8A00] hover:underline cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Comments link */}
        {post.commentsCount > 0 && (
          <button
            onClick={() => setActiveCommentPostId(post.id)}
            className="text-xs text-gray-400 hover:text-gray-300 mb-1 block"
          >
            View all {post.commentsCount} comments
          </button>
        )}

        {/* Timestamp */}
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
          {post.createdAt}
        </div>
      </div>
    </article>
  );
};

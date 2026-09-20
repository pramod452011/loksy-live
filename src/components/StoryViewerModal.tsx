import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { soundManager } from '../utils/audioEngine';
import { STORY_FILTERS } from './StoryEditor';
import {
  X,
  Heart,
  Send,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Sparkles,
  Volume2,
  VolumeX,
  Music,
  MoreVertical,
  Trash2,
  Download,
  AlertTriangle,
} from 'lucide-react';

export const StoryViewerModal: React.FC = () => {
  const {
    currentUser,
    deleteStory,
    activeStoryGroup,
    activeStoryIndex,
    closeStoryViewer,
    nextStory,
    prevStory,
    sendMessage,
    showToast,
  } = useApp();

  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  const currentStory = activeStoryGroup?.stories?.[activeStoryIndex];

  // Stop custom story music when closing or switching
  const stopStoryMusic = () => {
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.src = '';
      musicAudioRef.current = null;
    }
  };

  // Reset progress, state, and media whenever active story changes
  useEffect(() => {
    setProgress(0);
    setIsLiked(false);
    setReplyText('');
    setIsPaused(false);
    setIsMenuOpen(false);
    setShowDeleteConfirm(false);
    stopStoryMusic();

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = isMuted;
      const origVol = ((currentStory?.originalVolume ?? currentStory?.music?.originalVolume ?? 100) / 100);
      videoRef.current.volume = Math.max(0, Math.min(1, origVol));
      videoRef.current.play().catch(() => {});
    }

    // Play attached Indian Music track if available, else ambient soundtrack
    if (!isMuted) {
      if (currentStory?.music?.audioUrl) {
        try {
          const audio = new Audio();
          audio.crossOrigin = 'anonymous';
          (audio as any).playsInline = true;
          audio.setAttribute('playsinline', 'true');
          audio.preload = 'auto';
          audio.src = currentStory.music.audioUrl;
          const musicVol = ((currentStory.music.musicVolume ?? currentStory.musicVolume ?? 85) / 100);
          audio.volume = Math.max(0, Math.min(1, musicVol));
          const startSec = currentStory.music.audioStartTime ?? currentStory.audioStartTime ?? 0;
          const clipDur = currentStory.music.clipDuration ?? currentStory.clipDuration ?? 15;
          audio.currentTime = startSec;

          audio.onerror = () => {
            // If direct CDN blocks, try proxied or ambient fallback
            if (currentStory?.music?.audioUrl && !audio.src.includes('allorigins')) {
              audio.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(currentStory.music.audioUrl)}`;
              audio.play().catch(() => {});
            } else {
              soundManager.playSoundtrack(currentStory?.caption || 'Story Soundtrack', 'ambient');
            }
          };

          audio.ontimeupdate = () => {
            if (clipDur > 0 && audio.currentTime >= startSec + clipDur) {
              audio.currentTime = startSec;
            }
          };

          audio.play().catch(() => {});
          musicAudioRef.current = audio;
        } catch (e) {
          // fallback to ambient
          soundManager.playSoundtrack(currentStory?.caption || 'Story Soundtrack', 'ambient');
          soundManager.setMuted(false);
        }
      } else {
        soundManager.playSoundtrack(currentStory?.caption || 'Story Soundtrack', 'ambient');
        soundManager.setMuted(false);
      }
    }
  }, [activeStoryGroup?.userId, activeStoryIndex, isMuted, currentStory]);

  // Clean up sound on unmount or close
  useEffect(() => {
    return () => {
      stopStoryMusic();
      soundManager.stopSoundtrack();
    };
  }, []);

  // Sync mute state to video DOM element, custom music audio and soundManager
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
      if (!isMuted) {
        const origVol = ((currentStory?.originalVolume ?? currentStory?.music?.originalVolume ?? 100) / 100);
        video.volume = Math.max(0, Math.min(1, origVol));
        if (!isPaused && video.paused) {
          video.play().catch(() => {});
        }
      }
    }

    if (musicAudioRef.current) {
      musicAudioRef.current.muted = isMuted;
      if (!isMuted && !isPaused && musicAudioRef.current.paused) {
        const musicVol = ((currentStory?.music?.musicVolume ?? currentStory?.musicVolume ?? 85) / 100);
        musicAudioRef.current.volume = Math.max(0, Math.min(1, musicVol));
        musicAudioRef.current.play().catch(() => {});
      }
    }

    soundManager.setMuted(isMuted);
  }, [isMuted, isPaused, currentStory]);

  // Sync pause state with video element and sound
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (isPaused) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    }

    if (musicAudioRef.current) {
      if (isPaused) {
        musicAudioRef.current.pause();
      } else if (!isMuted) {
        musicAudioRef.current.play().catch(() => {});
      }
    }

    if (isPaused) {
      soundManager.setMuted(true);
    } else if (!isMuted) {
      soundManager.setMuted(false);
    }
  }, [isPaused, isMuted]);

  // If group is set but current story is invalid, safely close viewer
  useEffect(() => {
    if (activeStoryGroup && !currentStory) {
      closeStoryViewer();
    }
  }, [activeStoryGroup, currentStory, closeStoryViewer]);

  // Auto-advancing story timer
  useEffect(() => {
    if (!activeStoryGroup || !currentStory || isPaused) return;

    // For videos, duration comes from video or default 6s
    const durationSec = currentStory.duration || 5;
    const durationMs = durationSec * 1000;
    const intervalStep = 50;
    const stepIncrement = (intervalStep / durationMs) * 100;

    const interval = window.setInterval(() => {
      setProgress((prev) => {
        const nextVal = prev + stepIncrement;
        if (nextVal >= 100) {
          window.clearInterval(interval);
          return 100;
        }
        return nextVal;
      });
    }, intervalStep);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeStoryGroup?.userId, activeStoryIndex, currentStory?.id, currentStory?.duration, isPaused]);

  // When progress reaches 100%, advance to next story cleanly
  useEffect(() => {
    if (progress >= 100) {
      setProgress(0);
      nextStory();
    }
  }, [progress, nextStory]);

  if (!activeStoryGroup || !currentStory) return null;

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    sendMessage(`chat_${activeStoryGroup.userId}`, `Replying to your story: "${replyText}"`);
    showToast('Reply sent to creator inbox!');
    setReplyText('');
  };

  const handleLikeStory = () => {
    setIsLiked(!isLiked);
    showToast(!isLiked ? 'Loved this story! ❤️' : 'Story unliked');
  };

  const isVideoStory = currentStory.mediaType === 'video';
  const storyFilterCss = currentStory.filter
    ? (STORY_FILTERS.find((f) => f.id === currentStory.filter)?.css || 'none')
    : 'none';
  const isMyStory = Boolean(
    (currentUser && activeStoryGroup?.userId === currentUser.id) ||
    (currentUser && (currentStory as { userId?: string })?.userId === currentUser.id)
  );

  const handleSaveToDevice = async () => {
    if (!currentStory?.mediaUrl) return;
    try {
      showToast('Preparing download...');
      const ext = currentStory.mediaType === 'video' ? 'mp4' : 'jpg';
      const fileName = `loksy_story_${currentStory.id || Date.now()}.${ext}`;

      if (currentStory.mediaUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = currentStory.mediaUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Story saved to device!');
      } else {
        const res = await fetch(currentStory.mediaUrl, { mode: 'cors' });
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
        showToast('Story saved to device!');
      }
    } catch (err) {
      console.warn('Direct blob download failed, falling back to direct link:', err);
      const link = document.createElement('a');
      link.href = currentStory.mediaUrl;
      link.target = '_blank';
      link.download = `loksy_story_${Date.now()}.${currentStory.mediaType === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Story download started!');
    } finally {
      setIsMenuOpen(false);
      setIsPaused(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentStory?.id) return;
    try {
      setIsDeleting(true);
      await deleteStory(currentStory.id);
      setIsMenuOpen(false);
      setShowDeleteConfirm(false);
      setIsPaused(false);
    } catch (err) {
      console.error('Delete story failed:', err);
      showToast('Could not delete story');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="loksy-story-viewer"
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center select-none backdrop-blur-md"
    >
      {/* Desktop side navigation buttons */}
      <button
        onClick={prevStory}
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95"
        aria-label="Previous story"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>
      <button
        onClick={nextStory}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95"
        aria-label="Next story"
      >
        <ChevronRight className="w-7 h-7" />
      </button>

      {/* Main Story Container */}
      <div className="relative w-full max-w-md h-full md:h-[90vh] md:max-h-[820px] md:rounded-3xl overflow-hidden bg-[#070A12] shadow-2xl flex flex-col justify-between border border-white/10">
        {/* Background Blur Ambience */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {isVideoStory ? (
            <video
              src={currentStory.mediaUrl}
              className="w-full h-full object-cover blur-2xl opacity-25"
              style={{ filter: storyFilterCss !== 'none' ? storyFilterCss : undefined }}
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt=""
              className="w-full h-full object-cover blur-2xl opacity-25"
              style={{ filter: storyFilterCss !== 'none' ? storyFilterCss : undefined }}
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        {/* Story Media (Image or Video) with Hold-to-Pause */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40"
          onMouseDown={() => !isMenuOpen && setIsPaused(true)}
          onMouseUp={() => !isMenuOpen && setIsPaused(false)}
          onTouchStart={() => !isMenuOpen && setIsPaused(true)}
          onTouchEnd={() => !isMenuOpen && setIsPaused(false)}
        >
          {isVideoStory ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="w-full h-full object-cover"
              style={{ filter: storyFilterCss !== 'none' ? storyFilterCss : undefined }}
              autoPlay
              playsInline
              loop
              muted={isMuted}
              onEnded={() => nextStory()}
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story content"
              className="w-full h-full object-cover"
              style={{ filter: storyFilterCss !== 'none' ? storyFilterCss : undefined }}
              referrerPolicy="no-referrer"
            />
          )}

          {/* Left / Right tap zones for navigation */}
          <div
            className="absolute top-20 bottom-24 left-0 w-1/3 z-10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              prevStory();
            }}
          />
          <div
            className="absolute top-20 bottom-24 right-0 w-1/3 z-10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              nextStory();
            }}
          />
        </div>

        {/* Top Overlay: Progress Bars & Creator Info */}
        <div className="relative z-20 pt-4 px-4 bg-gradient-to-b from-black/85 via-black/50 to-transparent pb-8">
          {/* Multi-segment Progress Bars */}
          <div className="flex items-center gap-1.5 mb-3">
            {(activeStoryGroup.stories || []).map((story, idx) => {
              let fill = 0;
              if (idx < activeStoryIndex) fill = 100;
              else if (idx === activeStoryIndex) fill = progress;
              return (
                <div
                  key={story.id}
                  className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-gradient-to-r from-[#FF4668] to-[#FF8A00] transition-all duration-75 ease-linear"
                    style={{ width: `${fill}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Creator Header & Control Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-r from-[#FF4668] to-[#FF8A00] shrink-0">
                <img
                  src={activeStoryGroup.user.avatar}
                  alt={activeStoryGroup.user.name}
                  className="w-full h-full rounded-full object-cover border-2 border-[#070A12]"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white text-sm truncate">
                    {activeStoryGroup.user.name}
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-[#FFA000] shrink-0" />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <span className="truncate">@{activeStoryGroup.user.username}</span>
                  <span>•</span>
                  <span>{currentStory.createdAt}</span>
                </div>
              </div>
            </div>

            {/* Controls: More Menu (for story owner), Audio Mute & Close */}
            <div className="flex items-center gap-2 shrink-0">
              {isMyStory && (
                <button
                  id="story-more-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPaused(true);
                    setIsMenuOpen(true);
                  }}
                  className={`p-1.5 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                    isMenuOpen
                      ? 'bg-white text-black border-white'
                      : 'bg-black/60 text-white border-white/10 hover:bg-black/80'
                  }`}
                  title="Story options"
                  aria-label="Story management menu"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              )}
              <button
                id="story-mute-toggle"
                onClick={handleToggleMute}
                className={`p-1.5 rounded-full backdrop-blur-md border transition-all ${
                  isMuted
                    ? 'bg-black/60 text-white border-white/10 hover:bg-black/80'
                    : 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40 shadow-lg'
                }`}
                title={isMuted ? 'Turn Sound On' : 'Turn Sound Off'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
              </button>
              <button
                id="story-close-btn"
                onClick={closeStoryViewer}
                className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md border border-white/10 transition-all"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Instagram Music Sticker (if story has music attached) */}
          {currentStory.music && (
            <div className="mt-2.5 flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white shadow-xl select-none animate-fade-in max-w-[280px]">
              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/30">
                <img
                  src={currentStory.music.coverUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold truncate">
                <Music className="w-3 h-3 text-[#00E5FF] shrink-0 animate-pulse" />
                <span className="truncate">
                  {currentStory.music.title} • {currentStory.music.artist}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Story Caption (if any) */}
        {currentStory.caption && (
          <div className="relative z-20 px-4 py-2.5 mx-4 my-auto bg-black/70 backdrop-blur-md rounded-2xl text-white text-sm text-center border border-white/15 shadow-xl max-w-sm self-center">
            {currentStory.caption}
          </div>
        )}

        {/* Bottom Interactive Bar */}
        <div className="relative z-20 pb-6 pt-8 px-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
          {isMyStory ? (
            <div className="flex items-center justify-between w-full px-4 py-3 rounded-full bg-black/50 backdrop-blur-md border border-white/15">
              <span className="text-xs text-gray-300 font-medium">Your Story</span>
              <button
                type="button"
                id="story-bottom-more-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(true);
                  setIsMenuOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs text-white font-medium hover:text-[#00E5FF] transition-colors cursor-pointer"
              >
                <MoreVertical className="w-3.5 h-3.5" />
                <span>Story Options</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendReply} className="flex items-center gap-2.5">
              <div className="flex-1 relative">
                <input
                  id="story-reply-input"
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${activeStoryGroup.user.name}...`}
                  className="w-full px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-sm placeholder-gray-300 backdrop-blur-md focus:outline-none focus:border-[#FF4668]"
                />
              </div>
              {replyText.trim() ? (
                <button
                  type="submit"
                  className="p-2.5 rounded-full bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white shadow-md active:scale-95 transition-transform"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  id="story-like-btn"
                  onClick={handleLikeStory}
                  className={`p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-all active:scale-125 ${
                    isLiked ? 'bg-[#FF4668] text-white border-[#FF4668]' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title="Send Love"
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
                </button>
              )}
            </form>
          )}
        </div>

        {/* Story Management Action Sheet & Confirm Alert Modal */}
        {isMenuOpen && (
          <div
            id="story-menu-backdrop"
            className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end animate-fade-in"
            onClick={(e) => {
              e.stopPropagation();
              if (!isDeleting) {
                setIsMenuOpen(false);
                setShowDeleteConfirm(false);
                setIsPaused(false);
              }
            }}
          >
            <div
              id="story-action-sheet"
              className="w-full bg-[#111625] border-t border-white/15 rounded-t-3xl p-5 pb-8 shadow-2xl space-y-4 select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Pill Handle */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />

              {!showDeleteConfirm ? (
                <>
                  {/* Story preview card */}
                  <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/50 border border-white/10 shrink-0">
                      {isVideoStory ? (
                        <video
                          src={currentStory.mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={currentStory.mediaUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-semibold truncate">
                        {currentStory.caption || 'Your Story'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {currentStory.createdAt} • {isVideoStory ? 'Video' : 'Photo'}
                      </p>
                    </div>
                  </div>

                  {/* Actions List */}
                  <div className="space-y-2">
                    {/* Save to Device */}
                    <button
                      id="story-action-save"
                      onClick={handleSaveToDevice}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/15 text-white transition-all text-left cursor-pointer"
                    >
                      <div className="p-2 rounded-xl bg-white/10 text-[#00E5FF] shrink-0">
                        <Download className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">Save to Device</div>
                        <div className="text-xs text-gray-400">Download media file to your gallery</div>
                      </div>
                    </button>

                    {/* Delete Story */}
                    <button
                      id="story-action-delete"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/25 border border-red-500/20 text-red-400 transition-all text-left cursor-pointer"
                    >
                      <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-red-400">Delete Story</div>
                        <div className="text-xs text-red-300/70">Permanently delete this story from your profile</div>
                      </div>
                    </button>
                  </div>

                  {/* Cancel Button */}
                  <button
                    id="story-action-cancel"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsPaused(false);
                    }}
                    className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-gray-300 font-semibold text-sm transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                /* Delete Confirmation Alert */
                <div className="py-2 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center border border-red-500/30">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">Delete this story?</h3>
                    <p className="text-xs text-gray-300 mt-1.5 max-w-xs mx-auto leading-relaxed">
                      This will permanently remove this story from your profile and Story Bar. It cannot be recovered.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      id="story-delete-cancel-btn"
                      disabled={isDeleting}
                      onClick={() => setShowDeleteConfirm(false)}
                      className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="story-delete-confirm-btn"
                      disabled={isDeleting}
                      onClick={handleConfirmDelete}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white font-bold text-sm shadow-lg shadow-red-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { soundManager } from '../utils/audioEngine';
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
} from 'lucide-react';

export const StoryViewerModal: React.FC = () => {
  const {
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
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt=""
              className="w-full h-full object-cover blur-2xl opacity-25"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        {/* Story Media (Image or Video) with Hold-to-Pause */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {isVideoStory ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="w-full h-full object-cover"
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

            {/* Controls: Audio Mute & Close (Exact Instagram Stories style) */}
            <div className="flex items-center gap-2 shrink-0">
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

        {/* Bottom Interactive Reply & Send Love Bar */}
        <div className="relative z-20 pb-6 pt-8 px-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
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
        </div>
      </div>
    </div>
  );
};

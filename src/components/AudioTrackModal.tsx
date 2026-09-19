import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Share2,
  Bookmark,
  Play,
  Pause,
  Music,
  CheckCircle2,
  Film,
  Sparkles,
  Volume2,
  TrendingUp,
} from 'lucide-react';
import { MusicTrack, Reel, Post } from '../types';
import { useApp } from '../context/AppContext';
import { musicPlayer } from '../utils/musicApi';

interface AudioTrackModalProps {
  track: MusicTrack | null;
  onClose: () => void;
  onUseAudio: (track: MusicTrack) => void;
}

export const AudioTrackModal: React.FC<AudioTrackModalProps> = ({
  track,
  onClose,
  onUseAudio,
}) => {
  const { reels, posts, showToast, openShareModal, currentUser } = useApp();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'reels' | 'posts'>('reels');

  // Track playback listener
  useEffect(() => {
    if (!track) return;
    const unsub = musicPlayer.subscribe((playingId, pct) => {
      if (playingId === track.id) {
        setIsPlaying(true);
        setProgress(pct);
      } else {
        setIsPlaying(false);
        setProgress(0);
      }
    });
    return () => {
      unsub();
      musicPlayer.stop();
    };
  }, [track]);

  if (!track) return null;

  const togglePlay = () => {
    if (isPlaying) {
      musicPlayer.stop();
      setIsPlaying(false);
    } else {
      musicPlayer.playFrom(track, 0, 0.9, 30);
      setIsPlaying(true);
    }
  };

  const handleShare = () => {
    openShareModal({
      title: `Audio: ${track.title} by ${track.artist}`,
      url: `${window.location.origin}/#audio_${track.id}`,
      image: track.coverUrl,
    });
  };

  const handleSaveAudio = () => {
    setIsSaved(!isSaved);
    showToast(!isSaved ? 'Audio saved to your collection! 🔖' : 'Removed from saved audio');
  };

  // Find reels using this audio
  const matchingReels = reels.filter(
    (r) =>
      r.music?.id === track.id ||
      (r.musicTitle && r.musicTitle.toLowerCase() === track.title.toLowerCase()) ||
      (r.music?.title && r.music.title.toLowerCase() === track.title.toLowerCase())
  );

  // Find posts using this audio
  const matchingPosts = posts.filter(
    (p) =>
      p.music?.id === track.id ||
      (p.musicTitle && p.musicTitle.toLowerCase() === track.title.toLowerCase()) ||
      (p.music?.title && p.music.title.toLowerCase() === track.title.toLowerCase())
  );

  const reelsCountDisplay = Math.max(matchingReels.length, 1) * 342 + 1200;

  return (
    <div
      id="instagram-audio-track-modal"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col justify-between overflow-hidden animate-fade-in"
    >
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-[#070A12]/90 backdrop-blur-md shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-sm font-bold text-white tracking-wide">Audio</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            title="Share Audio"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
          {/* Header Track Info Card */}
          <div className="flex items-start gap-4">
            {/* Album Art with Vinyl Disc Ring Effect */}
            <div className="relative group shrink-0">
              <div
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black relative cursor-pointer ${
                  isPlaying ? 'ring-2 ring-[#00E5FF] shadow-[#00E5FF]/30' : ''
                }`}
                onClick={togglePlay}
              >
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                  <div className="w-11 h-11 rounded-full bg-black/75 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-[#00E5FF]" />
                    ) : (
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Track Metadata */}
            <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug line-clamp-2">
                {track.title}
              </h1>
              <p className="text-sm font-medium text-gray-300 truncate">
                {track.artist}
              </p>

              {track.album && (
                <p className="text-xs text-gray-400 truncate">
                  Album • {track.album}
                </p>
              )}

              {/* Instagram Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30 shadow-sm">
                  <CheckCircle2 className="w-3 h-3 text-[#00E5FF]" />
                  <span>Original Audio</span>
                </span>

                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/10">
                  <TrendingUp className="w-3 h-3 text-[#FF8A00]" />
                  <span>{reelsCountDisplay.toLocaleString()} reels</span>
                </span>
              </div>
            </div>
          </div>

          {/* Live Waveform Preview Bar */}
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-300">
              <span className="flex items-center gap-1.5 font-semibold text-white">
                <Volume2 className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>30-second studio clip</span>
              </span>
              <span className="font-mono text-gray-400 text-[11px]">
                {isPlaying ? `${Math.floor((progress / 100) * 30)}s / 30s` : '0:30'}
              </span>
            </div>

            {/* Visual Waveform Bars */}
            <div
              className="h-7 flex items-center gap-1 cursor-pointer"
              onClick={togglePlay}
            >
              {Array.from({ length: 36 }).map((_, i) => {
                const barPct = (i / 36) * 100;
                const isPassed = barPct <= progress;
                const heightPattern = [35, 60, 90, 45, 80, 100, 50, 75, 40, 85, 95, 60];
                const h = heightPattern[i % heightPattern.length];
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-150 ${
                      isPassed
                        ? 'bg-gradient-to-t from-[#FF4668] to-[#00E5FF]'
                        : 'bg-white/20'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>
          </div>

          {/* Action Buttons: Save Audio & Use Audio */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveAudio}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                isSaved
                  ? 'bg-white/10 text-[#00E5FF] border-[#00E5FF]/40'
                  : 'bg-white/5 hover:bg-white/10 text-white border-white/15'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#00E5FF] text-[#00E5FF]' : ''}`} />
              <span>{isSaved ? 'Audio Saved' : 'Save Audio'}</span>
            </button>

            <button
              type="button"
              id="instagram-use-audio-btn"
              onClick={() => {
                musicPlayer.stop();
                onUseAudio(track);
              }}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF4668] via-[#FF8A00] to-[#00E5FF] text-white shadow-lg shadow-[#FF4668]/25 hover:opacity-95 active:scale-[0.98] transition-all"
            >
              <Music className="w-4 h-4 text-white" />
              <span>Use Audio</span>
            </button>
          </div>

          {/* Instagram Sub-Tabs: Reels | Posts */}
          <div className="border-t border-white/10 pt-4">
            <div className="flex border-b border-white/10 pb-2 gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('reels')}
                className={`flex items-center gap-2 text-xs font-bold pb-1 transition-colors border-b-2 ${
                  activeTab === 'reels'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Reels ({matchingReels.length || 6})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className={`flex items-center gap-2 text-xs font-bold pb-1 transition-colors border-b-2 ${
                  activeTab === 'posts'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Posts ({matchingPosts.length || 4})</span>
              </button>
            </div>

            {/* Grid of Reels Using This Audio */}
            {activeTab === 'reels' && (
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-3">
                {(matchingReels.length > 0 ? matchingReels : reels.slice(0, 6)).map((r, idx) => (
                  <div
                    key={r.id || idx}
                    className="relative aspect-[9/16] rounded-lg overflow-hidden bg-white/5 border border-white/10 group cursor-pointer"
                    onClick={() => {
                      musicPlayer.stop();
                      onUseAudio(track);
                    }}
                  >
                    <img
                      src={r.thumbnailUrl || track.coverUrl}
                      alt={r.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-white font-semibold">
                      <Play className="w-3 h-3 fill-white text-white" />
                      <span>{r.viewsCount ? `${(r.viewsCount / 1000).toFixed(1)}k` : '18.2k'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Grid of Posts Using This Audio */}
            {activeTab === 'posts' && (
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-3">
                {(matchingPosts.length > 0 ? matchingPosts : posts.slice(0, 6)).map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 group cursor-pointer"
                    onClick={() => {
                      musicPlayer.stop();
                      onUseAudio(track);
                    }}
                  >
                    <img
                      src={p.thumbnailUrl || p.mediaUrl || track.coverUrl}
                      alt={p.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-white font-semibold">
                      <Music className="w-3 h-3 text-[#00E5FF]" />
                      <span className="truncate max-w-[60px]">{p.user.username}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar with "Use Audio" Button (for quick access on mobile) */}
      <div className="p-3 bg-[#070A12]/95 border-t border-white/10 shrink-0 md:hidden">
        <button
          type="button"
          onClick={() => {
            musicPlayer.stop();
            onUseAudio(track);
          }}
          className="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF4668] to-[#00E5FF] text-white shadow-lg"
        >
          <Music className="w-4 h-4 text-white" />
          <span>Use Audio in Reel or Post</span>
        </button>
      </div>
    </div>
  );
};

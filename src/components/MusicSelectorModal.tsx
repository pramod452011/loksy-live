import React, { useState, useEffect, useRef, useTransition } from 'react';
import {
  Music,
  Search,
  X,
  Play,
  Pause,
  Check,
  Disc3,
  Volume2,
  Sparkles,
  Loader2,
  Flame,
  Heart,
  PartyPopper,
  Radio,
} from 'lucide-react';
import { MusicTrack } from '../types';
import {
  MUSIC_CATEGORIES,
  MusicCategory,
  CURATED_INDIAN_LIBRARY,
  searchIndianMusic,
  musicPlayer,
} from '../utils/musicApi';

interface MusicSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMusic: (track: MusicTrack | null) => void;
  currentSelectedMusic?: MusicTrack | null;
}

export const MusicSelectorModal: React.FC<MusicSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectMusic,
  currentSelectedMusic,
}) => {
  const [activeTab, setActiveTab] = useState<MusicCategory>('Trending Hindi');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState<number>(0);
  const [, startTransition] = useTransition();
  const searchTimeoutRef = useRef<number | null>(null);

  // Subscribe to singleton preview player
  useEffect(() => {
    const unsubscribe = musicPlayer.subscribe((id, progress) => {
      setPlayingTrackId(id);
      setPlayProgress(progress);
    });
    return () => {
      unsubscribe();
      musicPlayer.stop();
    };
  }, []);

  // Stop music when modal closes
  useEffect(() => {
    if (!isOpen) {
      musicPlayer.stop();
    }
  }, [isOpen]);

  // Handle Search Debounce with live JioSaavn API call
  useEffect(() => {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        const results = await searchIndianMusic(trimmed);
        startTransition(() => {
          setSearchResults(results);
          setIsSearching(false);
        });
      } catch (e) {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  if (!isOpen) return null;

  const currentDisplayTracks = searchQuery.trim()
    ? searchResults
    : CURATED_INDIAN_LIBRARY[activeTab] || [];

  const handleTogglePlay = (track: MusicTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingTrackId === track.id) {
      musicPlayer.pause();
    } else {
      musicPlayer.play(track);
    }
  };

  const handleSelectTrack = (track: MusicTrack) => {
    musicPlayer.stop();
    onSelectMusic(track);
    onClose();
  };

  const handleRemoveCurrentMusic = () => {
    musicPlayer.stop();
    onSelectMusic(null);
    onClose();
  };

  const getCategoryIcon = (cat: MusicCategory) => {
    switch (cat) {
      case 'Trending Hindi':
        return <Flame className="w-3.5 h-3.5 text-[#FF8A00]" />;
      case 'Bhojpuri Hits':
        return <Radio className="w-3.5 h-3.5 text-[#FF4668]" />;
      case 'Dance':
        return <PartyPopper className="w-3.5 h-3.5 text-[#E040FB]" />;
      case 'Romantic':
        return <Heart className="w-3.5 h-3.5 text-[#FF5252]" />;
    }
  };

  return (
    <div
      id="music-selector-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={() => {
        musicPlayer.stop();
        onClose();
      }}
    >
      <div
        id="music-selector-modal-card"
        className="w-full max-w-lg bg-[#0E1322] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] h-[640px] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5 shrink-0 bg-[#0E1322]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF4668] to-[#FF8A00] flex items-center justify-center shadow-lg shadow-[#FF4668]/20">
              <Music className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base flex items-center gap-1.5">
                Indian Music Library
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-[#00E5FF]">
                  Free
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Bhojpuri, Hindi, Punjabi & JioSaavn public search
              </p>
            </div>
          </div>
          <button
            id="close-music-selector-btn"
            onClick={() => {
              musicPlayer.stop();
              onClose();
            }}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currently Selected Track Bar (if any) */}
        {currentSelectedMusic && (
          <div className="px-5 py-2.5 bg-gradient-to-r from-[#FF4668]/15 via-purple-500/10 to-transparent border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentSelectedMusic.coverUrl}
                alt=""
                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/20"
              />
              <div className="min-w-0">
                <span className="text-[10px] text-rose-300 font-semibold uppercase tracking-wider block">
                  Attached Sound
                </span>
                <p className="text-xs text-white font-bold truncate">
                  {currentSelectedMusic.title} • {currentSelectedMusic.artist}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveCurrentMusic}
              className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:underline shrink-0 ml-2"
            >
              Remove Sound
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="px-5 pt-3 pb-2 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              id="music-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Hindi, Bhojpuri, Punjabi songs or artists..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-400 focus:outline-none focus:border-[#FF4668] transition-colors"
              autoFocus={false}
            />
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-[#00E5FF] animate-spin absolute right-3" />
            ) : searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-gray-400 hover:text-white absolute right-2.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Category Tabs (shown when not searching) */}
        {!searchQuery.trim() && (
          <div className="px-5 py-2 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {MUSIC_CATEGORIES.map((cat) => {
              const isActive = activeTab === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white shadow-md shadow-[#FF4668]/20 scale-100'
                      : 'bg-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10'
                  }`}
                >
                  {getCategoryIcon(cat)}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Song List Content */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-2">
          {searchQuery.trim() && (
            <div className="flex items-center justify-between pb-1 text-xs text-gray-400">
              <span>
                Search results for &ldquo;<span className="text-white font-medium">{searchQuery}</span>&rdquo;
              </span>
              <span>{currentDisplayTracks.length} tracks found</span>
            </div>
          )}

          {currentDisplayTracks.length === 0 && !isSearching && (
            <div className="py-16 text-center text-gray-400">
              <Disc3 className="w-10 h-10 mx-auto mb-2 text-gray-600 animate-spin-slow" />
              <p className="text-sm font-semibold text-gray-300">No tracks found</p>
              <p className="text-xs text-gray-500 mt-1">
                Try searching for Pawan Singh, Arijit Singh, Khesari Lal, or popular song titles.
              </p>
            </div>
          )}

          {currentDisplayTracks.map((track) => {
            const isPlaying = playingTrackId === track.id;
            const isSelected = currentSelectedMusic?.id === track.id;

            return (
              <div
                key={track.id}
                id={`song-item-${track.id}`}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all select-none group cursor-pointer ${
                  isSelected
                    ? 'bg-[#FF4668]/10 border-[#FF4668]/50 ring-1 ring-[#FF4668]/30'
                    : isPlaying
                    ? 'bg-white/10 border-[#00E5FF]/40'
                    : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07] hover:border-white/15'
                }`}
                onClick={() => handleSelectTrack(track)}
              >
                {/* Left: Album Cover + Play Preview Button */}
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div
                    className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 group/cover bg-gray-900 border border-white/10"
                    onClick={(e) => handleTogglePlay(track, e)}
                  >
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        isPlaying ? 'scale-110' : 'group-hover/cover:scale-105'
                      }`}
                      referrerPolicy="no-referrer"
                    />

                    {/* Play/Pause Overlay */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                        isPlaying
                          ? 'bg-black/50 opacity-100'
                          : 'bg-black/40 opacity-0 group-hover/cover:opacity-100'
                      }`}
                      title={isPlaying ? 'Pause 30s preview' : 'Play 30s preview'}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white fill-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      )}
                    </div>

                    {/* Animated Audio Equalizer Bars when playing */}
                    {isPlaying && (
                      <div className="absolute bottom-1 right-1 flex items-end gap-0.5 h-3 px-1 py-0.5 rounded bg-black/60 backdrop-blur-sm">
                        <span className="w-0.5 h-2.5 bg-[#00E5FF] rounded-full animate-pulse" />
                        <span className="w-0.5 h-1.5 bg-[#00E5FF] rounded-full animate-pulse delay-75" />
                        <span className="w-0.5 h-2 bg-[#00E5FF] rounded-full animate-pulse delay-150" />
                      </div>
                    )}
                  </div>

                  {/* Song Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4
                        className={`text-xs sm:text-sm font-bold truncate leading-tight ${
                          isSelected ? 'text-[#FF4668]' : isPlaying ? 'text-[#00E5FF]' : 'text-white'
                        }`}
                      >
                        {track.title}
                      </h4>
                      {track.genre && (
                        <span className="hidden sm:inline-block text-[9px] font-medium px-1.5 py-0.2 rounded bg-white/10 text-gray-300 shrink-0">
                          {track.genre}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {track.artist}
                    </p>
                    {track.album && (
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">
                        {track.album}
                      </p>
                    )}

                    {/* Preview Progress Bar */}
                    {isPlaying && (
                      <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#00E5FF] to-[#FF4668] transition-all duration-100 ease-linear"
                          style={{ width: `${playProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Select / Used Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleTogglePlay(track, e)}
                    className={`p-2 rounded-full border transition-all ${
                      isPlaying
                        ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/15'
                    }`}
                    title={isPlaying ? 'Pause preview' : 'Play 30s preview'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTrack(track)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#FF4668] text-white shadow-md'
                        : 'bg-white/10 hover:bg-[#FF4668] text-white hover:shadow-lg'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Used</span>
                      </>
                    ) : (
                      <span>Use</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="px-5 py-3 border-t border-white/5 bg-[#090D18] flex items-center justify-between text-[11px] text-gray-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>30-sec preview enabled • Plays in feed background</span>
          </div>
          <button
            type="button"
            onClick={() => {
              musicPlayer.stop();
              onClose();
            }}
            className="text-gray-300 hover:text-white font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

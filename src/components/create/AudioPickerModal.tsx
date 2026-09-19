import React, { useState } from 'react';
import { X, Search, Music, Play, Pause, Check, Volume2 } from 'lucide-react';
import { soundManager } from '../../utils/audioEngine';

export interface AudioTrackOption {
  title: string;
  artist: string;
  isCommercial?: boolean;
  rightsHolder?: string;
  duration?: string;
}

interface AudioPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAudio: AudioTrackOption;
  onSelectAudio: (track: AudioTrackOption) => void;
  trendingAudios: AudioTrackOption[];
}

export const AudioPickerModal: React.FC<AudioPickerModalProps> = ({
  isOpen,
  onClose,
  selectedAudio,
  onSelectAudio,
  trendingAudios,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingTitle, setPreviewingTitle] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = trendingAudios.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePreview = (track: AudioTrackOption) => {
    if (previewingTitle === track.title) {
      soundManager.stopSoundtrack();
      setPreviewingTitle(null);
    } else {
      soundManager.playSoundtrack(track.title, track.isCommercial ? 'dance' : 'ambient');
      soundManager.setMuted(false);
      setPreviewingTitle(track.title);
    }
  };

  const handleSelect = (track: AudioTrackOption) => {
    soundManager.stopSoundtrack();
    setPreviewingTitle(null);
    onSelectAudio(track);
    onClose();
  };

  const handleClose = () => {
    soundManager.stopSoundtrack();
    setPreviewingTitle(null);
    onClose();
  };

  return (
    <div
      id="instagram-audio-picker-backdrop"
      className="fixed inset-0 z-[125] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={handleClose}
    >
      <div
        id="instagram-audio-picker-dialog"
        className="w-full max-w-md bg-[#121622] text-white rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[85vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-[#00E5FF]" />
            <span className="text-sm font-bold">Audio & Music</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-white/5 bg-white/[0.02]">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search music, songs, or artists..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-xs text-gray-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Track list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-white/5">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">
              No matching tracks found for "{searchQuery}".
            </div>
          ) : (
            filtered.map((track, idx) => {
              const isSelected = selectedAudio.title === track.title;
              const isPlaying = previewingTitle === track.title;

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                    isSelected ? 'bg-white/10 border border-[#00E5FF]/40' : 'hover:bg-white/5'
                  }`}
                  onClick={() => handleSelect(track)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    {/* Play / Preview Trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePreview(track);
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                        isPlaying
                          ? 'bg-[#00E5FF] text-[#070A12]'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      title={isPlaying ? 'Pause preview' : 'Play preview'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current translate-x-0.5" />
                      )}
                    </button>

                    {/* Track info */}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                        <span className="truncate">{track.title}</span>
                        {track.isCommercial ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-normal shrink-0">
                            Licensed
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-normal shrink-0">
                            Royalty-Free
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                        <span>{track.artist}</span>
                        {track.rightsHolder && (
                          <span className="text-gray-500 text-[10px]">
                            • {track.rightsHolder.split('/')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#00E5FF] text-[#070A12] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-black/20 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>Click play button to listen before selecting</span>
          </div>
          <button
            onClick={handleClose}
            className="px-3 py-1 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

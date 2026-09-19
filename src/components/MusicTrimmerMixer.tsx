import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Scissors,
  Sliders,
  Sparkles,
  Flame,
  Radio,
  X,
  RotateCcw,
  Video,
} from 'lucide-react';
import { MusicTrack } from '../types';
import { musicPlayer } from '../utils/musicApi';

export interface MusicTrimmerMixerProps {
  track: MusicTrack;
  audioStartTime: number;
  onChangeStartTime: (startTimeSec: number) => void;
  clipDuration: number; // 15 or 30
  onChangeClipDuration: (durationSec: number) => void;
  originalVolume: number; // 0 - 100
  onChangeOriginalVolume: (vol: number) => void;
  musicVolume: number; // 0 - 100
  onChangeMusicVolume: (vol: number) => void;
  hasOriginalAudio?: boolean; // true if video is uploaded
  onChangeTrack?: () => void;
  onRemoveTrack?: () => void;
  compact?: boolean;
}

export const MusicTrimmerMixer: React.FC<MusicTrimmerMixerProps> = ({
  track,
  audioStartTime,
  onChangeStartTime,
  clipDuration,
  onChangeClipDuration,
  originalVolume,
  onChangeOriginalVolume,
  musicVolume,
  onChangeMusicVolume,
  hasOriginalAudio = true,
  onChangeTrack,
  onRemoveTrack,
  compact = false,
}) => {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('balanced');
  const scrubTimeoutRef = useRef<number | null>(null);

  // Total assumed track duration for scrubber calculation (default 60s if not specified)
  const totalDuration = track.duration && track.duration > 30 ? track.duration : 60;
  const maxStartTime = Math.max(0, totalDuration - clipDuration);

  // Generate 48 realistic visual waveform bar heights based on track id & index
  const waveformBars = React.useMemo(() => {
    const bars: number[] = [];
    const seed = (track.id || 'track').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    for (let i = 0; i < 48; i++) {
      // pseudo-random rhythmic pattern with energetic chorus peaks around 30-70%
      const phase = (i / 48) * Math.PI * 3;
      const energy = 0.35 + Math.sin(phase) * 0.25 + (((seed * (i + 13)) % 41) / 100);
      bars.push(Math.max(0.18, Math.min(1.0, energy)));
    }
    return bars;
  }, [track.id]);

  // Subscribe to preview playback state
  useEffect(() => {
    const unsubscribe = musicPlayer.subscribe((playingId) => {
      setIsPlayingPreview(playingId === track.id);
    });
    return () => {
      unsubscribe();
    };
  }, [track.id]);

  // Toggle Live Preview Play/Pause
  const handleTogglePreview = () => {
    if (isPlayingPreview) {
      musicPlayer.pause();
      setIsPlayingPreview(false);
    } else {
      musicPlayer.playFrom(track, audioStartTime, musicVolume / 100, clipDuration);
      setIsPlayingPreview(true);
    }
  };

  // When start timestamp slider is dragged: update state and immediately live preview!
  const handleStartTimeChange = (newStart: number) => {
    const clamped = Math.max(0, Math.min(maxStartTime, Math.round(newStart * 10) / 10));
    onChangeStartTime(clamped);

    // Live preview update with debounce to prevent glitchy rapid re-triggers
    if (scrubTimeoutRef.current) {
      window.clearTimeout(scrubTimeoutRef.current);
    }
    scrubTimeoutRef.current = window.setTimeout(() => {
      musicPlayer.playFrom(track, clamped, musicVolume / 100, clipDuration);
      setIsPlayingPreview(true);
    }, 80);
  };

  // Jump to specific musical moment (e.g. Intro, Chorus, Hook)
  const jumpToCue = (timeSec: number) => {
    handleStartTimeChange(timeSec);
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentEndTime = Math.min(totalDuration, audioStartTime + clipDuration);

  // Mixer Balance Presets
  const applyPreset = (presetName: string, orig: number, mus: number) => {
    setActivePreset(presetName);
    onChangeOriginalVolume(orig);
    onChangeMusicVolume(mus);
    musicPlayer.setVolume(mus / 100);
  };

  return (
    <div
      id="music-trimmer-mixer-card"
      className="w-full bg-[#0E121E] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-5 select-none"
    >
      {/* 1. Track Info Banner */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-black/40">
            <img
              src={track.coverUrl}
              alt={track.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {isPlayingPreview && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                <div className="flex items-end gap-0.5 h-4">
                  <span className="w-1 bg-[#00E5FF] h-full animate-bounce" />
                  <span className="w-1 bg-[#FF4668] h-3/4 animate-bounce delay-75" />
                  <span className="w-1 bg-[#FF8A00] h-full animate-bounce delay-150" />
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-[#FF4668] shrink-0" />
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                {track.title}
              </h4>
            </div>
            <p className="text-[11px] text-gray-400 truncate">
              {track.artist} {track.genre ? `• ${track.genre}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onChangeTrack && (
            <button
              type="button"
              onClick={onChangeTrack}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-[#00E5FF] transition-all"
            >
              Change
            </button>
          )}
          {onRemoveTrack && (
            <button
              type="button"
              onClick={() => {
                musicPlayer.stop();
                onRemoveTrack();
              }}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              title="Remove audio"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. MUSIC TRIMMER SECTION (Instagram Waveform & Scrubber) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span className="text-xs font-bold text-white tracking-tight">
              Music Trimmer (Starting Point)
            </span>
          </div>

          {/* Clip Length Toggle: 15-sec vs 30-sec */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => {
                onChangeClipDuration(15);
                if (audioStartTime > totalDuration - 15) {
                  onChangeStartTime(totalDuration - 15);
                }
              }}
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                clipDuration === 15
                  ? 'bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              15s clip
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeClipDuration(30);
                if (audioStartTime > totalDuration - 30) {
                  onChangeStartTime(totalDuration - 30);
                }
              }}
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                clipDuration === 30
                  ? 'bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              30s clip
            </button>
          </div>
        </div>

        {/* Visual Waveform Container with Highlights */}
        <div className="relative bg-black/50 border border-white/10 rounded-xl p-3 pt-4 overflow-hidden">
          {/* Waveform Bars */}
          <div className="h-14 flex items-center justify-between gap-[2px] relative z-10 px-1">
            {waveformBars.map((heightMultiplier, idx) => {
              // Calculate if this bar falls inside the active trimmer window
              const barTime = (idx / 48) * totalDuration;
              const isInsideWindow = barTime >= audioStartTime && barTime <= currentEndTime;

              return (
                <div
                  key={idx}
                  onClick={() => jumpToCue(barTime)}
                  className="flex-1 flex items-center justify-center h-full cursor-pointer group/bar"
                  title={`Jump to ${formatTime(barTime)}`}
                >
                  <div
                    className={`w-full max-w-[5px] rounded-full transition-all duration-150 ${
                      isInsideWindow
                        ? 'bg-gradient-to-t from-[#FF4668] via-[#FF8A00] to-[#00E5FF] shadow-sm shadow-[#FF4668]/40'
                        : 'bg-white/20 group-hover/bar:bg-white/40'
                    }`}
                    style={{
                      height: `${Math.round(heightMultiplier * 100)}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Glowing Active Window Overlay Frame (Instagram Style) */}
          <div
            className="absolute top-1 bottom-1 border-2 border-[#00E5FF] rounded-lg bg-[#00E5FF]/10 pointer-events-none transition-all duration-150"
            style={{
              left: `${Math.max(2, (audioStartTime / totalDuration) * 96)}%`,
              width: `${Math.min(94, (clipDuration / totalDuration) * 96)}%`,
            }}
          >
            <div className="absolute top-0.5 left-1.5 text-[9px] font-mono font-bold text-[#00E5FF] bg-black/80 px-1 rounded">
              {clipDuration}s
            </div>
          </div>
        </div>

        {/* Draggable Audio Seek Slider & Live Preview Button */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="music-trimmer-play-btn"
              onClick={handleTogglePreview}
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all active:scale-95 ${
                isPlayingPreview
                  ? 'bg-[#00E5FF] text-black border-[#00E5FF] shadow-lg shadow-[#00E5FF]/30'
                  : 'bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white border-transparent shadow-lg shadow-[#FF4668]/25 hover:brightness-110'
              }`}
              title={isPlayingPreview ? 'Pause audio preview' : 'Play live audio preview'}
            >
              {isPlayingPreview ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              )}
            </button>

            <div className="flex-1 space-y-1">
              <input
                type="range"
                min={0}
                max={maxStartTime}
                step={0.5}
                value={audioStartTime}
                onChange={(e) => handleStartTimeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF4668]"
              />
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#00E5FF] font-bold">
                  Start: {formatTime(audioStartTime)}
                </span>
                <span className="text-gray-400">
                  Clip: {formatTime(audioStartTime)} - {formatTime(currentEndTime)}
                </span>
                <span className="text-gray-500">
                  Total: {formatTime(totalDuration)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Jump Hotspots (Hook step, Chorus, Beat drop) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <span className="text-[10px] text-gray-400 font-semibold shrink-0">
              Quick cues:
            </span>
            <button
              type="button"
              onClick={() => jumpToCue(0)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium border shrink-0 transition-all ${
                audioStartTime === 0
                  ? 'bg-white/15 text-white border-white/30'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
              }`}
            >
              0:00 Intro
            </button>
            <button
              type="button"
              onClick={() => jumpToCue(Math.min(maxStartTime, 15))}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium border shrink-0 flex items-center gap-1 transition-all ${
                audioStartTime === 15
                  ? 'bg-[#FF4668]/20 text-[#FF4668] border-[#FF4668]/40'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
              }`}
            >
              <Flame className="w-2.5 h-2.5 text-[#FF4668]" />
              <span>0:15 Hook Step</span>
            </button>
            <button
              type="button"
              onClick={() => jumpToCue(Math.min(maxStartTime, 30))}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium border shrink-0 flex items-center gap-1 transition-all ${
                audioStartTime === 30
                  ? 'bg-[#FF8A00]/20 text-[#FF8A00] border-[#FF8A00]/40'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
              }`}
            >
              <Sparkles className="w-2.5 h-2.5 text-[#FF8A00]" />
              <span>0:30 Chorus Drop</span>
            </button>
            {maxStartTime >= 45 && (
              <button
                type="button"
                onClick={() => jumpToCue(Math.min(maxStartTime, 45))}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium border shrink-0 transition-all ${
                  audioStartTime === 45
                    ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40'
                    : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
                }`}
              >
                0:45 Verse 2
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. AUDIO VOLUME MIXER CONTROLS */}
      <div className="space-y-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#FF8A00]" />
            <span className="text-xs font-bold text-white tracking-tight">
              Audio Volume Mixer
            </span>
          </div>
          <span className="text-[10px] text-gray-400">
            {hasOriginalAudio ? 'Video Sound & Music' : 'Music Volume'}
          </span>
        </div>

        {/* Presets Row */}
        {hasOriginalAudio && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'balanced', label: 'Balanced 50/50', orig: 80, mus: 80 },
              { id: 'voice', label: 'Voice Focus', orig: 100, mus: 25 },
              { id: 'music', label: 'Music Dominant', orig: 20, mus: 100 },
              { id: 'music_only', label: 'Music Only', orig: 0, mus: 100 },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id, p.orig, p.mus)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold shrink-0 border transition-all ${
                  activePreset === p.id
                    ? 'bg-white/15 text-white border-white/30 shadow-sm'
                    : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3 bg-black/40 p-3 rounded-xl border border-white/5">
          {/* Slider 1: Original Audio Volume (Video ki aawaz) */}
          {hasOriginalAudio && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-gray-200">
                  <Video className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>Original Audio Volume (Video)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePreset(null);
                      onChangeOriginalVolume(originalVolume > 0 ? 0 : 100);
                    }}
                    className="p-1 rounded text-gray-400 hover:text-white"
                    title={originalVolume === 0 ? 'Unmute' : 'Mute'}
                  >
                    {originalVolume === 0 ? (
                      <VolumeX className="w-3.5 h-3.5 text-[#FF4668]" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-gray-300" />
                    )}
                  </button>
                  <span className="font-mono text-[#00E5FF] text-[11px] w-8 text-right">
                    {originalVolume}%
                  </span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={originalVolume}
                onChange={(e) => {
                  setActivePreset(null);
                  onChangeOriginalVolume(parseInt(e.target.value, 10));
                }}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
              />
              <p className="text-[10px] text-gray-400">
                Adjusts the camera mic/spoken dialogue of your original video clip.
              </p>
            </div>
          )}

          {/* Slider 2: Added Music Volume (Background gaane ki aawaz) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-gray-200">
                <Music className="w-3.5 h-3.5 text-[#FF4668]" />
                <span>Added Music Volume (Background Song)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActivePreset(null);
                    const newVol = musicVolume > 0 ? 0 : 100;
                    onChangeMusicVolume(newVol);
                    musicPlayer.setVolume(newVol / 100);
                  }}
                  className="p-1 rounded text-gray-400 hover:text-white"
                  title={musicVolume === 0 ? 'Unmute music' : 'Mute music'}
                >
                  {musicVolume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-[#FF4668]" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-gray-300" />
                  )}
                </button>
                <span className="font-mono text-[#FF4668] text-[11px] w-8 text-right">
                  {musicVolume}%
                </span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={musicVolume}
              onChange={(e) => {
                setActivePreset(null);
                const val = parseInt(e.target.value, 10);
                onChangeMusicVolume(val);
                musicPlayer.setVolume(val / 100);
              }}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF4668]"
            />
            <p className="text-[10px] text-gray-400">
              Adjusts background Indian soundtrack / song audio level.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

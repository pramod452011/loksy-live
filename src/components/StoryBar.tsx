import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Sparkles, Image as ImageIcon, X, Music, Volume2, Camera } from 'lucide-react';
import { MusicTrack } from '../types';
import { MusicSelectorModal } from './MusicSelectorModal';
import { MusicTrimmerMixer } from './MusicTrimmerMixer';

export const StoryBar: React.FC = () => {
  const {
    stories,
    openStoryViewer,
    currentUser,
    addStory,
    openStoryCamera,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [selectedMusicTrack, setSelectedMusicTrack] = useState<MusicTrack | null>(null);
  const [audioStartTime, setAudioStartTime] = useState(0);
  const [clipDuration, setClipDuration] = useState(15);
  const [musicVolume, setMusicVolume] = useState(85);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets = [
    { label: 'Chai Moment', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80' },
    { label: 'Sunset Glow', url: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&auto=format&fit=crop&q=80' },
    { label: 'Desi Street', url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80' },
    { label: 'Music Jam', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomImageUrl(reader.result);
          setSelectedPreset('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateStory = () => {
    const finalUrl = customImageUrl || selectedPreset || presets[0].url;
    const finalTrack: MusicTrack | undefined = selectedMusicTrack ? {
      ...selectedMusicTrack,
      audioStartTime,
      clipDuration,
      musicVolume,
      originalVolume: 100,
    } : undefined;
    addStory(finalUrl, newCaption, finalTrack, audioStartTime, clipDuration, 100, musicVolume);
    setIsAddModalOpen(false);
    setNewCaption('');
    setCustomImageUrl('');
    setSelectedPreset('');
    setSelectedMusicTrack(null);
    setAudioStartTime(0);
    setClipDuration(15);
    setMusicVolume(85);
  };

  const myStoryGroup = stories.find(s => s.userId === currentUser.id);
  const otherStories = stories.filter(s => s.userId !== currentUser.id);

  return (
    <div
      id="loksy-stories-section"
      className="w-full bg-[#0B0F19] border-b border-white/5 py-3.5 px-3 mb-3 rounded-2xl"
    >
      <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar scroll-smooth">
        {/* "Your Story" Circle */}
        <div className="flex flex-col items-center shrink-0 w-18">
          <div className="relative group cursor-pointer">
            <div
              id="story-circle-me"
              onClick={() => {
                if (myStoryGroup && myStoryGroup.stories && myStoryGroup.stories.length > 0) {
                  openStoryViewer(currentUser.id);
                } else {
                  openStoryCamera();
                }
              }}
              className={`w-16 h-16 rounded-full p-[2.5px] transition-transform active:scale-95 ${
                myStoryGroup && myStoryGroup.stories && myStoryGroup.stories.length > 0
                  ? 'bg-gradient-to-tr from-[#FF4668] via-[#FF8A00] to-[#E040FB]'
                  : 'border border-dashed border-gray-600'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-[#070A12] border-2 border-[#070A12]">
                <img
                  src={currentUser.avatar}
                  alt="Your Story"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Plus button to add story */}
            <button
              id="add-story-btn"
              onClick={(e) => {
                e.stopPropagation();
                openStoryCamera();
              }}
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white flex items-center justify-center border-2 border-[#070A12] shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
              title="Add Story"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
          <span className="text-[11px] font-medium text-gray-300 mt-1.5 truncate max-w-[70px] text-center">
            Your Story
          </span>
        </div>

        {/* Other Users' Stories */}
        {otherStories.map((group) => {
          const hasUnseen = group.hasUnseenStories;
          return (
            <div
              key={group.userId}
              id={`story-group-${group.userId}`}
              onClick={() => openStoryViewer(group.userId)}
              className="flex flex-col items-center shrink-0 w-18 cursor-pointer group"
            >
              <div
                className={`w-16 h-16 rounded-full p-[2.5px] transition-transform duration-200 group-hover:scale-105 active:scale-95 ${
                  hasUnseen
                    ? 'bg-gradient-to-tr from-[#FF4668] via-[#FF8A00] to-[#00E5FF] shadow-sm shadow-[#FF4668]/30'
                    : 'bg-white/10'
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-[#070A12] border-2 border-[#070A12]">
                  <img
                    src={group.user.avatar}
                    alt={group.user.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <span className="text-[11px] font-medium text-gray-300 mt-1.5 truncate max-w-[70px] text-center">
                {group.user.name.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Add Story Dialog */}
      {isAddModalOpen && (
        <div
          id="add-story-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            id="add-story-modal-card"
            className="w-full max-w-md bg-[#0F1423] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FF8A00]" />
                <h3 className="font-bold text-white text-base">Add to LOKSY Story</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Launch Camera Quick Action */}
            <button
              type="button"
              id="story-modal-open-camera-btn"
              onClick={() => {
                setIsAddModalOpen(false);
                openStoryCamera();
              }}
              className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-pink-600 to-rose-600 hover:brightness-110 text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Open Story Camera (Take Photo / Video)</span>
            </button>

            {/* Preset Selection */}
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-2">
                Choose a vibe or upload:
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setSelectedPreset(preset.url);
                      setCustomImageUrl('');
                    }}
                    className={`relative h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedPreset === preset.url && !customImageUrl
                        ? 'border-[#FF4668] ring-2 ring-[#FF4668]/30 scale-95'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] font-medium text-white py-0.5 text-center truncate px-1">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Upload custom image */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-200 flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-4 h-4 text-[#00E5FF]" />
                  <span>Upload from Device</span>
                </button>
              </div>

              {customImageUrl && (
                <div className="mt-3 relative h-36 rounded-xl overflow-hidden border border-[#00E5FF]/40">
                  <img
                    src={customImageUrl}
                    alt="Custom preview"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-md font-semibold">
                    Ready
                  </span>
                </div>
              )}
            </div>

            {/* Story Caption */}
            <div>
              <input
                type="text"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="Add a quick story caption... ✨"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FF4668]"
              />
            </div>

            {/* Indian Music Library Selector Trigger */}
            <div className="pt-1 space-y-2">
              {selectedMusicTrack ? (
                <>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-[#FF4668]/15 via-purple-500/10 to-transparent border border-[#FF4668]/30">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={selectedMusicTrack.coverUrl}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover border border-white/20 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <Music className="w-3 h-3 text-[#FF4668] shrink-0" />
                          <span className="text-xs text-white font-bold truncate">
                            {selectedMusicTrack.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 truncate block">
                          {selectedMusicTrack.artist}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => setIsMusicModalOpen(true)}
                        className="text-[11px] font-semibold text-[#00E5FF] hover:underline"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMusicTrack(null)}
                        className="p-1 rounded-full text-gray-400 hover:text-white"
                        title="Remove music"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Visual Waveform Trimmer & Dual Volume Mixer */}
                  <MusicTrimmerMixer
                    track={selectedMusicTrack}
                    isVideo={false}
                    audioStartTime={audioStartTime}
                    clipDuration={clipDuration}
                    originalVolume={100}
                    musicVolume={musicVolume}
                    onStartTimeChange={(time) => setAudioStartTime(time)}
                    onDurationChange={(dur) => setClipDuration(dur)}
                    onOriginalVolumeChange={() => {}}
                    onMusicVolumeChange={(vol) => setMusicVolume(vol)}
                    onRemoveMusic={() => setSelectedMusicTrack(null)}
                  />
                </>
              ) : (
                <button
                  type="button"
                  id="story-add-music-btn"
                  onClick={() => setIsMusicModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-white/20 hover:border-[#FF4668]/60 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-semibold text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-all"
                >
                  <Music className="w-3.5 h-3.5 text-[#FF4668]" />
                  <span>Add Music / Sound (Hindi, Bhojpuri, Punjabi)</span>
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateStory}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                Share to Story
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indian Music Library Selector Modal */}
      <MusicSelectorModal
        isOpen={isMusicModalOpen}
        onClose={() => setIsMusicModalOpen(false)}
        onSelectMusic={(track) => {
          setSelectedMusicTrack(track);
          setAudioStartTime(track.audioStartTime ?? 0);
          setClipDuration(track.clipDuration ?? 15);
          setMusicVolume(track.musicVolume ?? 85);
        }}
        currentSelectedMusic={selectedMusicTrack}
      />
    </div>
  );
};

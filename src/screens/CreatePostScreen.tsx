import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Image as ImageIcon,
  Video,
  MapPin,
  Hash,
  X,
  Sparkles,
  UploadCloud,
  CheckCircle,
  Globe,
  Lock,
  Bot,
} from 'lucide-react';

export const CreatePostScreen: React.FC = () => {
  const { createPost, goBack, currentUser, showToast, openCreateModal } = useApp();

  const [mediaUrl, setMediaUrl] = useState<string>('https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1080&auto=format&fit=crop&q=80');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('New Delhi, India');
  const [selectedTags, setSelectedTags] = useState<string[]>(['DesiCreatives', 'LOKSYLife']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const samplePresets = [
    { label: 'Jaipur Palace', url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1080&auto=format&fit=crop&q=80', type: 'image' as const },
    { label: 'Marine Drive', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1080&auto=format&fit=crop&q=80', type: 'image' as const },
    { label: 'Filter Coffee', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1080&auto=format&fit=crop&q=80', type: 'image' as const },
    { label: 'Ladakh Sky', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080&auto=format&fit=crop&q=80', type: 'image' as const },
    { label: 'Pottery Wheel', url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1080&auto=format&fit=crop&q=80', type: 'image' as const },
    { label: 'Kerala Backwaters', url: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=1080&auto=format&fit=crop&q=80', type: 'image' as const },
  ];

  const popularLocations = [
    'New Delhi, India',
    'Marine Drive, Mumbai',
    'Hawa Mahal, Jaipur',
    'Indiranagar, Bengaluru',
    'Fort Kochi, Kerala',
    'Assi Ghat, Varanasi',
    'Pangong Lake, Ladakh',
    'Park Street, Kolkata',
  ];

  const suggestedTags = [
    'DesiCreatives',
    'IncredibleIndia',
    'ChaiAndChill',
    'BombayVibes',
    'DelhiDiaries',
    'IndianIndieMusic',
    'TravelBharat',
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setMediaUrl(reader.result);
          setMediaType(isVideo ? 'video' : 'image');
          showToast(`Loaded media from device!`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTagInput.trim()) {
      e.preventDefault();
      const cleaned = customTagInput.trim().replace(/^#/, '');
      if (!selectedTags.includes(cleaned)) {
        setSelectedTags(prev => [...prev, cleaned]);
      }
      setCustomTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() && !mediaUrl) {
      showToast('Please add a caption or photo before sharing!');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      createPost({
        userId: currentUser.id,
        caption: caption.trim() || 'Sharing moments on LOKSY ✨ #ApniDuniya',
        mediaUrl: mediaUrl || samplePresets[0].url,
        mediaType,
        location: location || undefined,
        tags: selectedTags,
        aspectRatio: 'portrait',
        isAiGenerated,
      });
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div id="loksy-create-post-screen" className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-5">
      {/* Top action bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <button
          onClick={goBack}
          className="text-xs font-semibold text-gray-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/5"
        >
          Cancel
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold border border-white/20"
          >
            Post
          </button>
          <button
            type="button"
            onClick={() => openCreateModal('reel')}
            className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-400 hover:text-white text-xs font-semibold hover:bg-white/10 transition-colors"
          >
            Reel 🎬
          </button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
        >
          {isSubmitting ? 'Sharing...' : 'Share Post'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* User preview header */}
        <div className="flex items-center gap-3 bg-[#0B0F19] p-3.5 rounded-2xl border border-white/5">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#FF4668]/30 shrink-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <span className="font-bold text-sm text-white block">{currentUser.name}</span>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Globe className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>Public Feed • LOKSY India</span>
            </div>
          </div>
        </div>

        {/* Media Preview Box */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
            Media Preview & Selection
          </label>

          <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-[#070A12] border border-white/10 flex items-center justify-center group shadow-xl">
            {mediaUrl ? (
              mediaType === 'video' ? (
                <video
                  src={mediaUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Post preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )
            ) : (
              <div className="text-center p-6 text-gray-500">
                <UploadCloud className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                <p className="text-sm">Select a picture or preset below</p>
              </div>
            )}

            {/* Quick Change Badge */}
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-white border border-white/15">
              Live Preview
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,video/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white flex items-center justify-center gap-2 transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-[#00E5FF]" />
              <span>Upload Photo / Video from Device</span>
            </button>
          </div>

          {/* Preset Photo Carousel */}
          <div>
            <span className="text-[11px] font-semibold text-gray-400 block mb-2">
              Or pick an Indian curated scene:
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {samplePresets.map((preset) => (
                <div
                  key={preset.label}
                  onClick={() => {
                    setMediaUrl(preset.url);
                    setMediaType(preset.type);
                  }}
                  className={`relative h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                    mediaUrl === preset.url
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
                  <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1 text-[9px] font-medium text-white text-center truncate">
                    {preset.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Caption */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Share your thoughts, story, camera settings, or feelings... ✨"
            rows={3}
            className="w-full px-4 py-3 rounded-2xl bg-[#0B0F19] border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FF4668] transition-colors"
          />
        </div>

        {/* Location Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#00E5FF]" /> Add Location
            </label>
            {location && (
              <button
                type="button"
                onClick={() => setLocation('')}
                className="text-[11px] text-gray-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Search city or landmark..."
            className="w-full px-4 py-2.5 rounded-xl bg-[#0B0F19] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF4668]"
          />
          <div className="flex flex-wrap gap-1.5">
            {popularLocations.slice(0, 5).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocation(loc)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                  location === loc
                    ? 'bg-[#00E5FF]/10 border-[#00E5FF]/40 text-[#00E5FF] font-semibold'
                    : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Hashtags */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-[#FF8A00]" /> Hashtags
          </label>

          <div className="flex flex-wrap gap-1.5">
            {suggestedTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`text-[11px] px-3 py-1 rounded-full border transition-all ${
                    active
                      ? 'bg-[#FF8A00]/15 border-[#FF8A00]/50 text-[#FFA000] font-bold'
                      : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  #{tag} {active && '✓'}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={handleAddCustomTag}
              placeholder="Type custom hashtag and hit Enter..."
              className="w-full px-4 py-2 rounded-xl bg-[#0B0F19] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF8A00]"
            />
          </div>
        </div>

        {/* AI-Generated Content Disclosure Toggle */}
        <div
          id="create-screen-ai-toggle-section"
          className={`p-3.5 rounded-2xl border transition-all ${
            isAiGenerated
              ? 'bg-gradient-to-r from-[#00E5FF]/10 via-[#E040FB]/10 to-transparent border-[#00E5FF]/40 shadow-lg shadow-[#00E5FF]/5'
              : 'bg-white/[0.02] border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`p-2 rounded-xl border shrink-0 transition-colors ${
                  isAiGenerated
                    ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/50'
                    : 'bg-white/5 text-gray-400 border-white/10'
                }`}
              >
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <label
                    htmlFor="create-screen-ai-toggle"
                    className="text-xs font-bold text-white cursor-pointer select-none"
                  >
                    AI-Generated Content
                  </label>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                      isAiGenerated
                        ? 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/40'
                        : 'bg-white/5 text-gray-400 border-white/10'
                    }`}
                  >
                    AI Info
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                  Turn on if this post was created or edited with generative AI tools. Displays an 'AI Info' badge on the card.
                </p>
              </div>
            </div>

            {/* Custom Toggle Switch */}
            <button
              id="create-screen-ai-toggle"
              type="button"
              role="switch"
              aria-checked={isAiGenerated}
              onClick={() => setIsAiGenerated(!isAiGenerated)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isAiGenerated
                  ? 'bg-gradient-to-r from-[#00E5FF] to-[#E040FB] shadow-md shadow-[#00E5FF]/30'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <span className="sr-only">Toggle AI-Generated Content</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isAiGenerated ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Submit button bottom */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF4668] via-[#FF8A00] to-[#E040FB] text-white font-bold text-sm shadow-xl shadow-[#FF4668]/30 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? 'Publishing to LOKSY Feed...' : 'Share with LOKSY Community 🇮🇳'}
          </button>
        </div>
      </form>
    </div>
  );
};

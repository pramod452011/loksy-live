import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  ArrowLeft,
  Image as ImageIcon,
  Film,
  Video,
  MapPin,
  Music,
  Hash,
  Sparkles,
  UploadCloud,
  Check,
  Play,
  Pause,
  ChevronRight,
  Volume2,
  VolumeX,
  AlertTriangle,
  Scale,
  Shield,
  Bot,
  Crop,
  Sliders,
  Maximize2,
  CheckCircle2,
  Smile,
  Info,
  ChevronDown,
  Layers,
  Scissors,
  Eye,
  RotateCw,
  Users,
} from 'lucide-react';
import { CopyrightGuidelinesModal } from './CopyrightGuidelinesModal';
import { DiscardModal } from './create/DiscardModal';
import { AudioPickerModal, AudioTrackOption } from './create/AudioPickerModal';
import { INSTAGRAM_FILTERS, getCombinedFilterStyle } from './create/InstagramFilters';
import { storeMedia, registerSessionBlob } from '../utils/mediaStorage';
import { soundManager } from '../utils/audioEngine';

export type CreationStep = 'media' | 'crop' | 'edit' | 'details' | 'sharing' | 'done';
export type AspectRatioOption = 'original' | '1:1' | '4:5' | '16:9' | '9:16';

export const CreateModal: React.FC = () => {
  const {
    isCreateModalOpen,
    closeCreateModal,
    createModalInitialTab,
    createPost,
    createReel,
    currentUser,
    users,
    showToast,
    navigateTo,
  } = useApp();

  // Multi-step Instagram creation flow
  const [step, setStep] = useState<CreationStep>('media');
  const [activeType, setActiveType] = useState<'post' | 'reel'>('post');

  // Media state
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [localMediaKey, setLocalMediaKey] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('1:1');
  const [zoom, setZoom] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(15);

  // Edit / Filters state
  const [activeEditTab, setActiveEditTab] = useState<'filters' | 'adjust'>('filters');
  const [selectedFilter, setSelectedFilter] = useState<string>('normal');
  const [filterIntensity, setFilterIntensity] = useState<number>(100);
  const [coverFrameTime, setCoverFrameTime] = useState<number>(0);
  const [customCoverUrl, setCustomCoverUrl] = useState<string>('');
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(15);
  const [originalAudioVolume, setOriginalAudioVolume] = useState<number>(100);

  // Tools menus
  const [showRatioMenu, setShowRatioMenu] = useState<boolean>(false);
  const [showZoomSlider, setShowZoomSlider] = useState<boolean>(false);
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [showAudioPicker, setShowAudioPicker] = useState<boolean>(false);

  // Details state
  const [caption, setCaption] = useState<string>('');
  const [location, setLocation] = useState<string>('Marine Drive, Mumbai');
  const [showLocationDropdown, setShowLocationDropdown] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(['DesiCreatives', 'LOKSYLife']);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(false);
  const [altText, setAltText] = useState<string>('');
  const [showAccessibility, setShowAccessibility] = useState<boolean>(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [hideLikes, setHideLikes] = useState<boolean>(false);
  const [disableComments, setDisableComments] = useState<boolean>(false);
  const [highQualityUpload, setHighQualityUpload] = useState<boolean>(true);
  const [shareToReelsFeed, setShareToReelsFeed] = useState<boolean>(true);

  // Tag people
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);
  const [showTagPeopleModal, setShowTagPeopleModal] = useState<boolean>(false);

  // Audio / Music track
  const [selectedAudio, setSelectedAudio] = useState<AudioTrackOption>({
    title: 'Kesariya (Acoustic Folk Fusion)',
    artist: 'Pritam & Arijit Singh',
    isCommercial: true,
    rightsHolder: 'Sony Music India & Dharma Productions',
  });

  // Copyright scan & submission state
  const [isScanningCopyright, setIsScanningCopyright] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [showCopyrightWarning, setShowCopyrightWarning] = useState<boolean>(false);
  const [flaggedAudio, setFlaggedAudio] = useState<AudioTrackOption | null>(null);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Sample Indian video & media presets
  const sampleVideos = [
    {
      label: 'Mumbai Skyline Reel (9:16)',
      url: 'https://res.cloudinary.com/demo/video/upload/rafting.mp4',
      type: 'video' as const,
      ratio: '9:16' as AspectRatioOption,
      location: 'Bandra Bandstand, Mumbai',
      music: {
        title: 'Bombay Nights Lofi',
        artist: 'Ritviz & Nucleya',
        isCommercial: true,
        rightsHolder: 'Ritviz / NH7 Records',
      },
    },
    {
      label: 'Kathak Folk Session (Video)',
      url: 'https://res.cloudinary.com/demo/video/upload/celenarae.mp4',
      type: 'video' as const,
      ratio: '4:5' as AspectRatioOption,
      location: 'Jaipur, Rajasthan',
      music: {
        title: 'Ghoomar Dhamaal Beat',
        artist: 'Shreya Ghoshal',
        isCommercial: true,
        rightsHolder: 'T-Series Regional',
      },
    },
    {
      label: 'Kerala Coastal Waves (Video)',
      url: 'https://res.cloudinary.com/demo/video/upload/walking.mp4',
      type: 'video' as const,
      ratio: '16:9' as AspectRatioOption,
      location: 'Varkala Cliff, Kerala',
      music: {
        title: 'Malabar Coastline Breeze',
        artist: 'Job Kurian & Thaikkudam Bridge',
        isCommercial: true,
        rightsHolder: 'Wonderwall Media',
      },
    },
    {
      label: 'Chai Pouring Art (Video)',
      url: 'https://res.cloudinary.com/demo/video/upload/h-video.mp4',
      type: 'video' as const,
      ratio: '1:1' as AspectRatioOption,
      location: 'Connaught Place, New Delhi',
      music: {
        title: 'Chai & Chill Beats (Lofi)',
        artist: 'LOKSY Originals',
        isCommercial: false,
        rightsHolder: 'LOKSY Creator Commons (Royalty-Free)',
      },
    },
    {
      label: 'Marine Drive Sunset (Photo)',
      url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1080&auto=format&fit=crop&q=80',
      type: 'image' as const,
      ratio: '1:1' as AspectRatioOption,
      location: 'Marine Drive, Mumbai',
      music: {
        title: 'Kesariya (Acoustic Folk Fusion)',
        artist: 'Pritam & Arijit Singh',
        isCommercial: true,
        rightsHolder: 'Sony Music India',
      },
    },
  ];

  const popularLocations = [
    'Marine Drive, Mumbai',
    'Connaught Place, New Delhi',
    'Hawa Mahal, Jaipur',
    'Indiranagar, Bengaluru',
    'Fort Kochi, Kerala',
    'Assi Ghat, Varanasi',
    'Pangong Lake, Ladakh',
    'Park Street, Kolkata',
    'Cyber Hub, Gurugram',
    'Jubilee Hills, Hyderabad',
  ];

  const trendingAudios: AudioTrackOption[] = [
    {
      title: 'Kesariya (Acoustic Folk Fusion)',
      artist: 'Pritam & Arijit Singh',
      isCommercial: true,
      rightsHolder: 'Sony Music India & Dharma Productions',
    },
    {
      title: 'Baarishein (Monsoon Chill)',
      artist: 'Anuv Jain',
      isCommercial: true,
      rightsHolder: 'Anuv Jain Records / Warner Music India',
    },
    {
      title: 'Liggi (Indie Electro Beat)',
      artist: 'Ritviz',
      isCommercial: true,
      rightsHolder: 'Ritviz / Bacardi NH7 Records',
    },
    {
      title: 'Kasoor (Ukulele Live)',
      artist: 'Prateek Kuhad',
      isCommercial: true,
      rightsHolder: 'Elektra Records / IPRS India',
    },
    {
      title: 'Aaftaab (Darbari Strings)',
      artist: 'The Local Train',
      isCommercial: true,
      rightsHolder: 'Believe Music / The Local Train',
    },
    {
      title: 'Chai & Chill Beats (Lofi)',
      artist: 'LOKSY Originals',
      isCommercial: false,
      rightsHolder: 'LOKSY Creator Commons (Royalty-Free)',
    },
    {
      title: 'Original Audio (Device Mic)',
      artist: currentUser.username,
      isCommercial: false,
      rightsHolder: 'Original Creator Sound',
    },
    {
      title: 'Muted Audio (No Sound)',
      artist: 'None',
      isCommercial: false,
      rightsHolder: 'Claim-Free / Muted',
    },
  ];

  // Initialize on open
  useEffect(() => {
    if (isCreateModalOpen) {
      const isReel = createModalInitialTab === 'reel';
      setActiveType(isReel ? 'reel' : 'post');
      setStep('media');
      setMediaUrl('');
      setLocalMediaKey('');
      setMediaType('video');
      setAspectRatio(isReel ? '9:16' : '1:1');
      setZoom(1);
      setSelectedFilter('normal');
      setFilterIntensity(100);
      setCaption('');
      setIsAiGenerated(false);
      setShowDiscardModal(false);
      setShowRatioMenu(false);
      setShowZoomSlider(false);
      setCoverFrameTime(0);
      setCustomCoverUrl('');
      setTrimStart(0);
      setTrimEnd(15);
      setOriginalAudioVolume(100);
      setIsMuted(false);
      setIsPlaying(true);
    }
  }, [isCreateModalOpen, createModalInitialTab]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      soundManager.stopSoundtrack();
    };
  }, []);

  const [isProcessingMedia, setIsProcessingMedia] = useState<boolean>(false);

  // Handle local file selection with persistent Base64 / IndexedDB storage
  const handleFileSelect = async (file: File) => {
    const isVideo = file.type.startsWith('video') || Boolean(file.name.match(/\.(mp4|webm|mov|m4v)$/i));
    const isImage = file.type.startsWith('image') || Boolean(file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i));

    if (!isVideo && !isImage) {
      showToast('Please choose a valid video (MP4, MOV, WebM) or image (JPG, PNG).');
      return;
    }

    setIsProcessingMedia(true);
    showToast(`Storing ${file.name} for persistent playback... ✨`);

    try {
      const stored = await storeMedia(file);
      setMediaUrl(stored.dataUrl);
      setLocalMediaKey(stored.id);
      setMediaType(isVideo ? 'video' : 'image');

      if (stored.thumbnailUrl) {
        setCustomCoverUrl(stored.thumbnailUrl);
      }

      if (activeType === 'reel' || isVideo) {
        setAspectRatio(activeType === 'reel' ? '9:16' : '4:5');
      } else {
        setAspectRatio('1:1');
      }

      setStep('crop');
      showToast(`Ready! ${file.name}`);
    } catch (err) {
      console.warn('[CreateModal] Fallback to standard objectUrl:', err);
      const objectUrl = URL.createObjectURL(file);
      registerSessionBlob(objectUrl);
      setMediaUrl(objectUrl);
      setMediaType(isVideo ? 'video' : 'image');
      setStep('crop');
      showToast(`Loaded ${file.name}`);
    } finally {
      setIsProcessingMedia(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Video time & metadata updates
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 15;
      setVideoDuration(dur);
      setTrimEnd(dur);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const ct = videoRef.current.currentTime;
      setCurrentTime(ct);

      // Enforce loop within trim boundaries
      if (trimEnd > trimStart && ct >= trimEnd) {
        videoRef.current.currentTime = trimStart;
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (videoRef.current) {
      videoRef.current.muted = next;
      videoRef.current.volume = next ? 0 : originalAudioVolume / 100;
    }
  };

  // Handle Back Navigation with Discard confirmation if edits exist
  const handleBack = () => {
    if (step === 'crop') {
      setShowDiscardModal(true);
    } else if (step === 'edit') {
      setStep('crop');
    } else if (step === 'details') {
      setStep('edit');
    }
  };

  const handleClose = () => {
    if (step !== 'media' && step !== 'done') {
      setShowDiscardModal(true);
    } else {
      soundManager.stopSoundtrack();
      closeCreateModal();
    }
  };

  const confirmDiscard = () => {
    setShowDiscardModal(false);
    setMediaUrl('');
    setStep('media');
    soundManager.stopSoundtrack();
    closeCreateModal();
    showToast('Post creation cancelled');
  };

  // Execute actual publish to Firestore
  const executeFinalPublish = (forceMuteAudio = false) => {
    setStep('sharing');
    const audioTitleToUse = forceMuteAudio ? 'Original Audio (Muted)' : selectedAudio.title;
    const audioArtistToUse = forceMuteAudio ? currentUser.username : selectedAudio.artist;
    const isCommercial = !forceMuteAudio && !isMuted && !selectedAudio.title.toLowerCase().includes('muted') && (selectedAudio.isCommercial ?? true);

    setTimeout(() => {
      if (activeType === 'reel') {
        createReel({
          userId: currentUser.id,
          videoUrl: mediaUrl,
          thumbnailUrl:
            customCoverUrl ||
            (mediaType === 'image'
              ? mediaUrl
              : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1080&auto=format&fit=crop&q=80'),
          localMediaKey: localMediaKey || undefined,
          caption: caption.trim() || 'Created with LOKSY Reels ✨ #DesiCreatives',
          musicTitle: audioTitleToUse,
          musicArtist: audioArtistToUse,
          isAiGenerated,
          isCommercialAudio: isCommercial,
        } as any);
      } else {
        createPost({
          userId: currentUser.id,
          mediaUrl,
          mediaType,
          localMediaKey: localMediaKey || undefined,
          thumbnailUrl:
            customCoverUrl ||
            (mediaType === 'image'
              ? mediaUrl
              : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1080&auto=format&fit=crop&q=80'),
          caption: caption.trim() || 'Sharing a moment with the LOKSY community ✨',
          location: location || undefined,
          tags: selectedTags.length > 0 ? selectedTags : ['DesiCreatives'],
          aspectRatio:
            aspectRatio === '9:16'
              ? 'portrait'
              : aspectRatio === '16:9'
              ? 'landscape'
              : aspectRatio === '4:5'
              ? 'portrait'
              : 'square',
          isAiGenerated,
          musicTitle: audioTitleToUse,
          musicArtist: audioArtistToUse,
          isCommercialAudio: isCommercial,
        } as any);
      }

      setStep('done');
      soundManager.stopSoundtrack();
      showToast('🎉 Your post has been shared! Background Content ID scan initiated.');
    }, 450);
  };

  // Immediate Post-Upload Background Scan on Share
  const handleShareClick = () => {
    if (!mediaUrl) {
      showToast('Please pick or upload media to share.');
      return;
    }

    // Immediately trigger upload to feed
    executeFinalPublish(false);
  };

  // Helper for aspect ratio container sizing
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square max-h-[580px] w-full max-w-[580px]';
      case '4:5':
        return 'aspect-[4/5] max-h-[620px] w-full max-w-[496px]';
      case '16:9':
        return 'aspect-[16/9] max-h-[460px] w-full max-w-[720px]';
      case '9:16':
        return 'aspect-[9/16] max-h-[680px] w-full max-w-[382px]';
      case 'original':
      default:
        return 'aspect-square max-h-[580px] w-full max-w-[580px]';
    }
  };

  if (!isCreateModalOpen) return null;

  return (
    <div
      id="instagram-create-modal-overlay"
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={handleClose}
    >
      {/* Floating Close Button in top-right corner like Instagram */}
      <button
        id="instagram-create-close-button"
        type="button"
        onClick={handleClose}
        className="hidden sm:flex absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-[110]"
        aria-label="Close modal"
      >
        <X className="w-7 h-7" />
      </button>

      {/* Main Instagram Modal Box */}
      <div
        id="instagram-create-modal-card"
        className={`w-full bg-[#12151f] text-white rounded-none sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          step === 'details' || step === 'edit'
            ? 'max-w-5xl h-full sm:h-[88vh] max-h-[820px]'
            : 'max-w-2xl h-full sm:h-[85vh] max-h-[760px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Instagram Top Navigation Header */}
        <header
          id="instagram-modal-header"
          className="h-14 shrink-0 border-b border-white/10 px-4 flex items-center justify-between bg-[#12151f] z-20"
        >
          {/* Left Action */}
          <div className="w-20 flex items-center">
            {step !== 'media' && step !== 'sharing' && step !== 'done' && (
              <button
                id="instagram-header-back-btn"
                type="button"
                onClick={handleBack}
                className="p-1 -ml-1 text-white hover:text-gray-300 active:scale-95 transition-all flex items-center gap-1 text-sm font-medium"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            {step === 'media' && (
              <button
                type="button"
                onClick={closeCreateModal}
                className="sm:hidden p-1 -ml-1 text-white"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Center Title */}
          <h2 className="text-sm sm:text-base font-bold text-white text-center tracking-tight truncate flex-1">
            {step === 'media' && (activeType === 'reel' ? 'Create new reel' : 'Create new post')}
            {step === 'crop' && 'Crop'}
            {step === 'edit' && 'Edit'}
            {step === 'details' && (activeType === 'reel' ? 'New reel' : 'New post')}
            {step === 'sharing' && 'Sharing'}
            {step === 'done' && 'Post shared'}
          </h2>

          {/* Right Action (Next / Share) */}
          <div className="w-20 flex items-center justify-end">
            {step === 'crop' && (
              <button
                id="instagram-header-next-crop-btn"
                type="button"
                onClick={() => setStep('edit')}
                className="text-sm font-bold text-[#0095F6] hover:text-[#3897f0] active:scale-95 transition-all"
              >
                Next
              </button>
            )}

            {step === 'edit' && (
              <button
                id="instagram-header-next-edit-btn"
                type="button"
                onClick={() => setStep('details')}
                className="text-sm font-bold text-[#0095F6] hover:text-[#3897f0] active:scale-95 transition-all"
              >
                Next
              </button>
            )}

            {step === 'details' && (
              <button
                id="instagram-header-share-btn"
                type="button"
                onClick={handleShareClick}
                disabled={isScanningCopyright}
                className="text-sm font-bold text-[#0095F6] hover:text-[#3897f0] disabled:opacity-50 active:scale-95 transition-all flex items-center gap-1.5"
              >
                {isScanningCopyright ? (
                  <RotateCw className="w-4 h-4 animate-spin text-[#0095F6]" />
                ) : (
                  'Share'
                )}
              </button>
            )}
          </div>
        </header>

        {/* 2-Second Copyright Fingerprinting Banner */}
        {isScanningCopyright && (
          <div
            id="instagram-copyright-scan-bar"
            className="bg-gradient-to-r from-[#FF4668]/20 via-[#FF8A00]/20 to-[#00E5FF]/20 border-b border-[#FF4668]/40 px-4 py-2.5 flex items-center justify-between text-xs animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#FF8A00] animate-pulse" />
              <span className="font-semibold text-white">Scanning audio Content ID & Copyright...</span>
              <span className="font-mono text-[#00E5FF] text-[11px] bg-white/10 px-1.5 py-0.5 rounded">
                {scanProgress}%
              </span>
            </div>
            <div className="w-32 bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF4668] to-[#00E5FF] transition-all duration-75"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 1: INSTAGRAM MEDIA DROPZONE & SELECTOR */}
        {/* ======================================================== */}
        {step === 'media' && (
          <div
            id="instagram-media-dropzone-step"
            className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {/* Top Post Type Switcher */}
            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-full border border-white/10 mb-8">
              <button
                type="button"
                onClick={() => {
                  setActiveType('post');
                  setAspectRatio('1:1');
                }}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeType === 'post'
                    ? 'bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Feed Post</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveType('reel');
                  setAspectRatio('9:16');
                }}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeType === 'reel'
                    ? 'bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Reels (9:16 Video)</span>
              </button>
            </div>

            {/* Iconic Instagram Upload Graphic (Curved Frames with Reels & Camera) */}
            <div className="relative mb-6 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-white/[0.04] to-white/[0.12] border border-white/15 flex items-center justify-center shadow-2xl group-hover:scale-105 group-hover:border-[#0095F6]/60 transition-all">
                <div className="relative flex items-center justify-center">
                  <Film className="w-12 h-12 text-[#FF8A00] -rotate-12 translate-x-1" />
                  <Video className="w-10 h-10 text-[#00E5FF] absolute rotate-6 -translate-x-1" />
                  <div className="w-4 h-4 rounded-full bg-[#FF4668] absolute -top-2 -right-2 ring-4 ring-[#12151f]" />
                </div>
              </div>
            </div>

            {/* Typography */}
            <h3 className="text-lg sm:text-xl font-medium text-white mb-2 text-center">
              Drag photos and videos here
            </h3>
            <p className="text-xs text-gray-400 mb-6 text-center max-w-sm">
              Supports MP4, MOV, WebM videos or high-resolution photos.
            </p>

            {/* Instagram Primary Blue Button */}
            <button
              id="instagram-select-computer-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 rounded-xl bg-[#0095F6] hover:bg-[#1877f2] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#0095F6]/30 active:scale-95 transition-all cursor-pointer"
            >
              Select from device
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            {/* Quick Sample Media Presets */}
            <div className="mt-10 w-full max-w-md pt-6 border-t border-white/5">
              <div className="text-[11px] font-semibold text-gray-400 mb-2.5 flex items-center justify-between">
                <span>Or choose from curated video clips:</span>
                <span className="text-[10px] text-[#00E5FF]">Ready to test</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sampleVideos.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMediaUrl(sample.url);
                      setMediaType(sample.type);
                      setAspectRatio(sample.ratio);
                      setLocation(sample.location);
                      setSelectedAudio(sample.music);
                      if (sample.ratio === '9:16') {
                        setActiveType('reel');
                      }
                      setStep('crop');
                      showToast(`Loaded "${sample.label}"`);
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 text-left transition-all group"
                  >
                    <div className="text-xs font-semibold text-white truncate group-hover:text-[#00E5FF] transition-colors flex items-center gap-1.5">
                      {sample.type === 'video' ? (
                        <Video className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-[#FF8A00] shrink-0" />
                      )}
                      <span className="truncate">{sample.label}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 truncate mt-0.5">
                      {sample.location}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: INSTAGRAM CROP & FRAMING CANVAS */}
        {/* ======================================================== */}
        {step === 'crop' && (
          <div
            id="instagram-crop-step"
            className="flex-1 relative bg-black flex items-center justify-center overflow-hidden select-none"
          >
            {/* Framed Media Container */}
            <div
              className={`relative overflow-hidden transition-all duration-300 flex items-center justify-center ${getAspectRatioClasses()}`}
              style={{
                transform: `scale(${zoom})`,
                transition: 'transform 0.2s ease-out',
              }}
            >
              {mediaType === 'video' ? (
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  autoPlay
                  loop
                  playsInline
                  muted={isMuted}
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Crop preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Bottom-Left Instagram Floating Tools (Aspect Ratio & Zoom) */}
            <div className="absolute bottom-4 left-4 z-30 flex items-center gap-3">
              {/* Aspect Ratio Button & Popup */}
              <div className="relative">
                <button
                  id="instagram-crop-ratio-btn"
                  type="button"
                  onClick={() => {
                    setShowRatioMenu(!showRatioMenu);
                    setShowZoomSlider(false);
                  }}
                  className={`w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
                    showRatioMenu
                      ? 'bg-white text-black border-white'
                      : 'bg-black/65 text-white border-white/20 hover:bg-black/80'
                  }`}
                  title="Select Aspect Ratio"
                >
                  <Crop className="w-4 h-4" />
                </button>

                {/* Aspect Ratio Popover */}
                {showRatioMenu && (
                  <div
                    id="instagram-crop-ratio-menu"
                    className="absolute bottom-12 left-0 w-36 bg-[#1a1f2c]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 animate-scale-up z-40"
                  >
                    {[
                      { id: '1:1', label: '1:1 Square' },
                      { id: '4:5', label: '4:5 Portrait' },
                      { id: '16:9', label: '16:9 Landscape' },
                      { id: '9:16', label: '9:16 Reel' },
                      { id: 'original', label: 'Original' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setAspectRatio(opt.id as AspectRatioOption);
                          setShowRatioMenu(false);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition-colors ${
                          aspectRatio === opt.id
                            ? 'bg-white/15 text-[#00E5FF]'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {aspectRatio === opt.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Zoom / Scale Button & Slider */}
              <div className="relative">
                <button
                  id="instagram-crop-zoom-btn"
                  type="button"
                  onClick={() => {
                    setShowZoomSlider(!showZoomSlider);
                    setShowRatioMenu(false);
                  }}
                  className={`w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
                    showZoomSlider
                      ? 'bg-white text-black border-white'
                      : 'bg-black/65 text-white border-white/20 hover:bg-black/80'
                  }`}
                  title="Zoom / Frame Scale"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {/* Zoom Slider Popover */}
                {showZoomSlider && (
                  <div
                    id="instagram-crop-zoom-popover"
                    className="absolute bottom-12 left-0 w-44 bg-[#1a1f2c]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-3 shadow-2xl flex items-center gap-3 animate-scale-up z-40"
                  >
                    <input
                      type="range"
                      min={1}
                      max={1.5}
                      step={0.05}
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full accent-[#0095F6] cursor-pointer"
                    />
                    <span className="text-[11px] font-mono font-bold text-gray-300 shrink-0">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom-Right Video Play / Mute Controls */}
            {mediaType === 'video' && (
              <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-full bg-black/65 text-white backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg hover:bg-black/80 active:scale-90 transition-transform"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white translate-x-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="w-9 h-9 rounded-full bg-black/65 text-white backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg hover:bg-black/80 active:scale-90 transition-transform"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#00E5FF]" />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: INSTAGRAM EDIT (FILTERS & VIDEO ADJUSTMENTS) */}
        {/* ======================================================== */}
        {step === 'edit' && (
          <div id="instagram-edit-step" className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left: Video Preview with Applied Filter */}
            <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden min-h-[300px]">
              <div className={`relative overflow-hidden flex items-center justify-center ${getAspectRatioClasses()}`}>
                {mediaType === 'video' ? (
                  <video
                    ref={videoRef}
                    src={mediaUrl}
                    autoPlay
                    loop
                    playsInline
                    muted={isMuted}
                    onTimeUpdate={handleTimeUpdate}
                    className="w-full h-full object-cover"
                    style={{
                      filter: getCombinedFilterStyle(selectedFilter, filterIntensity),
                    }}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Filtered preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    style={{
                      filter: getCombinedFilterStyle(selectedFilter, filterIntensity),
                    }}
                  />
                )}
              </div>

              {/* Video scrubber bar at bottom of preview */}
              {mediaType === 'video' && (
                <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
                  <button type="button" onClick={togglePlay} className="text-white hover:text-[#00E5FF]">
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                  </button>
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={videoDuration || 15}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCurrentTime(val);
                        if (videoRef.current) {
                          videoRef.current.currentTime = val;
                        }
                      }}
                      className="w-full accent-[#0095F6] h-1 bg-white/20 rounded-full cursor-pointer"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-300">
                    {Math.floor(currentTime)}s / {Math.floor(videoDuration)}s
                  </span>
                  <button type="button" onClick={toggleMute} className="text-white">
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#00E5FF]" />}
                  </button>
                </div>
              )}
            </div>

            {/* Right: Instagram Edit Tabs Panel */}
            <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-white/10 flex flex-col bg-[#12151f] shrink-0 overflow-y-auto">
              {/* Instagram Sub-Tabs: Filters | Adjust */}
              <div className="flex border-b border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveEditTab('filters')}
                  className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
                    activeEditTab === 'filters'
                      ? 'border-white text-white'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Filters
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEditTab('adjust')}
                  className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
                    activeEditTab === 'adjust'
                      ? 'border-white text-white'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  {mediaType === 'video' ? 'Video & Audio' : 'Adjustments'}
                </button>
              </div>

              {/* Filters Tab Content */}
              {activeEditTab === 'filters' && (
                <div className="p-4 space-y-4 flex-1">
                  {/* Filter Intensity Slider */}
                  {selectedFilter !== 'normal' && (
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2 animate-fade-in">
                      <div className="flex justify-between text-xs font-semibold text-gray-300">
                        <span>Intensity</span>
                        <span className="font-mono text-[#00E5FF]">{filterIntensity}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={filterIntensity}
                        onChange={(e) => setFilterIntensity(parseInt(e.target.value, 10))}
                        className="w-full accent-[#0095F6] cursor-pointer"
                      />
                    </div>
                  )}

                  {/* 12 Live Instagram Filters Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {INSTAGRAM_FILTERS.map((f) => {
                      const isChosen = selectedFilter === f.id;
                      return (
                        <div
                          key={f.id}
                          className="flex flex-col items-center gap-1.5 cursor-pointer group"
                          onClick={() => setSelectedFilter(f.id)}
                        >
                          <div
                            className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                              isChosen
                                ? 'border-[#0095F6] shadow-lg shadow-[#0095F6]/30 scale-105'
                                : 'border-white/10 group-hover:border-white/30'
                            }`}
                          >
                            <img
                              src={
                                mediaType === 'image'
                                  ? mediaUrl
                                  : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'
                              }
                              alt={f.name}
                              className="w-full h-full object-cover"
                              style={{ filter: f.filter }}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span
                            className={`text-[11px] font-semibold truncate ${
                              isChosen ? 'text-[#0095F6]' : 'text-gray-400 group-hover:text-white'
                            }`}
                          >
                            {f.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Adjust / Video Tools Tab Content */}
              {activeEditTab === 'adjust' && (
                <div className="p-4 space-y-5 flex-1">
                  {/* Video Cover Frame Selector */}
                  {mediaType === 'video' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-200 block flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-[#FF8A00]" />
                        <span>Select Cover Frame</span>
                      </label>
                      <p className="text-[11px] text-gray-400">
                        Choose a frame from your video or select a thumbnail image.
                      </p>

                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-black border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                          <img
                            src={
                              customCoverUrl ||
                              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'
                            }
                            alt="Cover thumbnail"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <input
                            type="range"
                            min={0}
                            max={videoDuration || 15}
                            step={0.5}
                            value={coverFrameTime}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setCoverFrameTime(val);
                              if (videoRef.current) {
                                videoRef.current.currentTime = val;
                              }
                            }}
                            className="w-full accent-[#0095F6] cursor-pointer"
                          />
                          <div className="text-[10px] text-gray-400 flex justify-between">
                            <span>Cover at: {coverFrameTime.toFixed(1)}s</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomCoverUrl('https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80');
                                showToast('Selected custom high-res poster frame');
                              }}
                              className="text-[#0095F6] hover:underline"
                            >
                              Preset cover
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video Trim Controls */}
                  {mediaType === 'video' && (
                    <div className="space-y-2 pt-3 border-t border-white/5">
                      <label className="text-xs font-bold text-gray-200 block flex items-center gap-1.5">
                        <Scissors className="w-3.5 h-3.5 text-[#00E5FF]" />
                        <span>Trim Video</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] text-gray-400">Start (sec)</span>
                          <input
                            type="number"
                            min={0}
                            max={trimEnd - 1}
                            value={trimStart}
                            onChange={(e) => setTrimStart(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400">End (sec)</span>
                          <input
                            type="number"
                            min={trimStart + 1}
                            max={videoDuration || 60}
                            value={trimEnd}
                            onChange={(e) => setTrimEnd(Math.min(videoDuration, parseFloat(e.target.value) || videoDuration))}
                            className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Audio Volume & Background Track */}
                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <label className="text-xs font-bold text-gray-200 block flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-[#FF8A00]" />
                        <span>Audio & Music</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAudioPicker(true)}
                        className="text-[11px] text-[#0095F6] hover:underline font-semibold"
                      >
                        Change Music
                      </button>
                    </label>

                    {/* Selected Audio Card */}
                    <div
                      onClick={() => setShowAudioPicker(true)}
                      className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold text-white truncate group-hover:text-[#00E5FF] transition-colors">
                          {selectedAudio.title}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {selectedAudio.artist}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white shrink-0" />
                    </div>

                    {/* Video Audio Volume Slider */}
                    {mediaType === 'video' && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] text-gray-300">
                          <span>Original Video Volume</span>
                          <span className="font-mono text-gray-400">{originalAudioVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={originalAudioVolume}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            setOriginalAudioVolume(v);
                            if (videoRef.current) {
                              videoRef.current.volume = v / 100;
                            }
                          }}
                          className="w-full accent-[#0095F6] cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 4: INSTAGRAM POST DETAILS & SHARING INSPECTOR */}
        {/* ======================================================== */}
        {step === 'details' && (
          <div id="instagram-details-step" className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left: Final Video / Media Preview */}
            <div className="flex-1 bg-black relative flex items-center justify-center p-2 min-h-[260px] overflow-hidden">
              <div className={`relative overflow-hidden flex items-center justify-center ${getAspectRatioClasses()}`}>
                {mediaType === 'video' ? (
                  <video
                    src={mediaUrl}
                    autoPlay
                    loop
                    playsInline
                    muted={isMuted}
                    className="w-full h-full object-cover"
                    style={{
                      filter: getCombinedFilterStyle(selectedFilter, filterIntensity),
                    }}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Final preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    style={{
                      filter: getCombinedFilterStyle(selectedFilter, filterIntensity),
                    }}
                  />
                )}
              </div>
            </div>

            {/* Right: Instagram Details Inspector */}
            <div className="w-full md:w-80 lg:w-[420px] border-t md:border-t-0 md:border-l border-white/10 flex flex-col bg-[#12151f] shrink-0 overflow-y-auto">
              {/* Creator Profile Header */}
              <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shrink-0">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>{currentUser.username}</span>
                    {currentUser.isVerified && <CheckCircle2 className="w-3 h-3 text-[#00E5FF] fill-[#00E5FF]" />}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Sharing to {activeType === 'reel' ? 'LOKSY Reels' : 'Followers & Feed'}
                  </div>
                </div>
              </div>

              {/* Caption Textarea & Emoji Bar */}
              <div className="p-4 border-b border-white/5 space-y-2">
                <textarea
                  id="instagram-caption-textarea"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  rows={4}
                  maxLength={2200}
                  className="w-full bg-transparent border-none text-xs text-white placeholder-gray-500 focus:outline-none resize-none leading-relaxed"
                />

                {/* Quick Emoji Bar & Character Counter */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {['❤️', '🔥', '👏', '😍', '✨', '🇮🇳', '🙌', '💯'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setCaption((prev) => prev + em)}
                        className="text-sm p-1 hover:scale-125 transition-transform"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono shrink-0 pl-2">
                    {caption.length}/2,200
                  </span>
                </div>
              </div>

              {/* Add Location Row */}
              <div className="border-b border-white/5">
                <div
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02]"
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                >
                  <div className="flex items-center gap-2.5 text-xs text-gray-200">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{location || 'Add location'}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} />
                </div>

                {showLocationDropdown && (
                  <div className="px-3.5 pb-3 pt-1 space-y-2 bg-white/[0.02] animate-fade-in">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Search city or landmark..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {popularLocations.slice(0, 6).map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => {
                            setLocation(loc);
                            setShowLocationDropdown(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300 border border-white/5"
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Add Music Row */}
              <div
                className="p-3.5 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02]"
                onClick={() => setShowAudioPicker(true)}
              >
                <div className="flex items-center gap-2.5 text-xs text-gray-200 min-w-0 pr-2">
                  <Music className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{selectedAudio.title}</span>
                </div>
                <span className="text-[11px] text-[#0095F6] font-semibold shrink-0">Change</span>
              </div>

              {/* Tag People Row */}
              <div
                className="p-3.5 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02]"
                onClick={() => setShowTagPeopleModal(true)}
              >
                <div className="flex items-center gap-2.5 text-xs text-gray-200">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>
                    {taggedUserIds.length > 0 ? `${taggedUserIds.length} person tagged` : 'Tag people'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              {/* AI Info Disclosure Toggle (Instagram official requirement) */}
              <div className="p-3.5 border-b border-white/5 flex items-center justify-between bg-cyan-500/[0.03]">
                <div className="pr-3">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
                    <span>AI Info / Made with AI</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-snug mt-0.5">
                    Label content created or edited with AI tools (as required by community policies).
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isAiGenerated}
                    onChange={(e) => setIsAiGenerated(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00E5FF]" />
                </label>
              </div>

              {/* Accessibility Section */}
              <div className="border-b border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAccessibility(!showAccessibility)}
                  className="w-full p-3.5 flex items-center justify-between text-xs text-gray-300 hover:bg-white/[0.02]"
                >
                  <span className="font-semibold">Accessibility</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAccessibility ? 'rotate-180' : ''}`} />
                </button>
                {showAccessibility && (
                  <div className="px-3.5 pb-3 space-y-2 bg-white/[0.02] animate-fade-in">
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Alt text describes your photos and videos for people with visual impairments.
                    </p>
                    <input
                      type="text"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      placeholder="Write alt text..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
                    />
                  </div>
                )}
              </div>

              {/* Advanced Settings Section */}
              <div className="border-b border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="w-full p-3.5 flex items-center justify-between text-xs text-gray-300 hover:bg-white/[0.02]"
                >
                  <span className="font-semibold">Advanced settings</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`} />
                </button>
                {showAdvancedSettings && (
                  <div className="px-3.5 pb-4 space-y-3 bg-white/[0.02] text-xs text-gray-300 animate-fade-in divide-y divide-white/5">
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="font-semibold text-white">Hide like & view count</span>
                        <p className="text-[10px] text-gray-400">Only you will see total likes and views</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={hideLikes}
                        onChange={(e) => setHideLikes(e.target.checked)}
                        className="accent-[#0095F6] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="font-semibold text-white">Turn off commenting</span>
                        <p className="text-[10px] text-gray-400">Nobody will be able to comment on this post</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={disableComments}
                        onChange={(e) => setDisableComments(e.target.checked)}
                        className="accent-[#0095F6] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="font-semibold text-white">Upload at highest quality</span>
                        <p className="text-[10px] text-gray-400">Always upload 1080p full resolution</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={highQualityUpload}
                        onChange={(e) => setHighQualityUpload(e.target.checked)}
                        className="accent-[#0095F6] cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 5: INSTAGRAM SHARING & COMPLETION STATES */}
        {/* ======================================================== */}
        {step === 'sharing' && (
          <div
            id="instagram-sharing-loader-step"
            className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in"
          >
            {/* Instagram Loading Spinner Ring */}
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-[#0095F6] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Video className="w-6 h-6 text-white animate-pulse" />
              </div>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Sharing your {activeType === 'reel' ? 'reel' : 'post'}...</h3>
            <p className="text-xs text-gray-400 max-w-xs">
              Optimizing video encoding, applying filters, and syncing to LOKSY network.
            </p>
          </div>
        )}

        {step === 'done' && (
          <div
            id="instagram-done-success-step"
            className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-scale-up"
          >
            {/* Green Checkmark Animation */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mb-5 shadow-2xl shadow-emerald-500/20">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Your post has been shared.</h3>
            <p className="text-xs text-gray-400 max-w-xs mb-6">
              It is now live on your profile, feed, and visible to the entire community!
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  closeCreateModal();
                  navigateTo(activeType === 'reel' ? 'reels' : 'home');
                }}
                className="px-6 py-2.5 rounded-xl bg-[#0095F6] hover:bg-[#1877f2] text-white text-xs font-bold shadow-lg transition-all active:scale-95"
              >
                View {activeType === 'reel' ? 'Reel' : 'Post'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('media');
                  setMediaUrl('');
                  setCaption('');
                }}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all active:scale-95"
              >
                Create Another
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECONDARY DIALOGS & OVERLAYS */}
      {/* ======================================================== */}

      {/* Instagram Discard Confirmation Dialog */}
      <DiscardModal
        isOpen={showDiscardModal}
        onDiscard={confirmDiscard}
        onCancel={() => setShowDiscardModal(false)}
      />

      {/* Instagram Audio Picker Sheet */}
      <AudioPickerModal
        isOpen={showAudioPicker}
        onClose={() => setShowAudioPicker(false)}
        selectedAudio={selectedAudio}
        onSelectAudio={(track) => {
          setSelectedAudio(track);
          showToast(`🎵 Music selected: ${track.title}`);
        }}
        trendingAudios={trendingAudios}
      />

      {/* Copyright Warning Modal (if commercial audio flagged) */}
      {showCopyrightWarning && flaggedAudio && (
        <div
          id="instagram-copyright-flagged-dialog"
          className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="w-full max-w-md bg-[#161a26] text-white rounded-3xl p-6 border border-amber-500/30 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 rounded-2xl bg-amber-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Commercial Audio Detected</h3>
                <p className="text-xs text-amber-300">Content ID Fingerprint Match</p>
              </div>
            </div>

            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-xs space-y-1">
              <div className="font-semibold text-white">{flaggedAudio.title}</div>
              <div className="text-gray-400">{flaggedAudio.artist}</div>
              <div className="text-[11px] text-amber-300 pt-1 font-mono">
                Rights holder: {flaggedAudio.rightsHolder}
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              This track is commercially copyrighted. To protect your post from copyright muting or demonetization, choose an option below:
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCopyrightWarning(false);
                  executeFinalPublish(true); // Mute audio
                }}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
              >
                Mute Audio & Share Claim-Free
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCopyrightWarning(false);
                  setShowAudioPicker(true);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white text-xs font-bold transition-all"
              >
                Choose Royalty-Free Track
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCopyrightWarning(false);
                  executeFinalPublish(false); // Share anyway with credit
                }}
                className="w-full py-2 text-center text-xs text-gray-400 hover:text-white"
              >
                I have commercial rights / Share with attribution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag People Modal */}
      {showTagPeopleModal && (
        <div
          id="instagram-tag-people-dialog"
          className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowTagPeopleModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#161a26] text-white rounded-3xl p-5 border border-white/10 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#00E5FF]" />
                <span>Tag Creators & Friends</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowTagPeopleModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {users.slice(0, 6).map((u) => {
                const isTagged = taggedUserIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      setTaggedUserIds((prev) =>
                        prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                      );
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${
                      isTagged ? 'bg-white/15 border border-[#0095F6]' : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="text-xs font-bold text-white">{u.username}</div>
                        <div className="text-[10px] text-gray-400">{u.name}</div>
                      </div>
                    </div>
                    {isTagged && <Check className="w-4 h-4 text-[#0095F6]" />}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowTagPeopleModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#0095F6] text-white text-xs font-bold"
            >
              Done Tagging ({taggedUserIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Guidelines Modal */}
      <CopyrightGuidelinesModal
        isOpen={showGuidelinesModal}
        onClose={() => setShowGuidelinesModal(false)}
      />
    </div>
  );
};

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
  ChevronLeft,
  Plus,
} from 'lucide-react';
import { CopyrightGuidelinesModal } from './CopyrightGuidelinesModal';
import { DiscardModal } from './create/DiscardModal';
import { AudioPickerModal, AudioTrackOption } from './create/AudioPickerModal';
import { MusicSelectorModal } from './MusicSelectorModal';
import { MusicTrimmerMixer } from './MusicTrimmerMixer';
import { MusicTrack } from '../types';
import { INSTAGRAM_FILTERS, getCombinedFilterStyle } from './create/InstagramFilters';
import { storeMedia, registerSessionBlob } from '../utils/mediaStorage';
import { soundManager } from '../utils/audioEngine';

export type CreationStep = 'media' | 'crop' | 'edit' | 'details' | 'sharing' | 'done';
export type AspectRatioOption = 'original' | '1:1' | '4:5' | '16:9' | '9:16';

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  localKey?: string;
  thumbnailUrl?: string;
}

export const CreateModal: React.FC = () => {
  const {
    isCreateModalOpen,
    closeCreateModal,
    createModalInitialTab,
    initialCreateMusicTrack,
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
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
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
  const [clipDuration, setClipDuration] = useState<number>(15);
  const [originalAudioVolume, setOriginalAudioVolume] = useState<number>(100);
  const [musicVolume, setMusicVolume] = useState<number>(85);

  // Tools menus
  const [showRatioMenu, setShowRatioMenu] = useState<boolean>(false);
  const [showZoomSlider, setShowZoomSlider] = useState<boolean>(false);
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [showAudioPicker, setShowAudioPicker] = useState<boolean>(false);
  const [showCoverPickerModal, setShowCoverPickerModal] = useState<boolean>(false);

  // Details & Instagram Share screen state
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
  const [alsoShareToFeed, setAlsoShareToFeed] = useState<boolean>(true);

  // Tag people
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);
  const [showTagPeopleModal, setShowTagPeopleModal] = useState<boolean>(false);

  // Audio / Music track
  const [selectedMusicTrack, setSelectedMusicTrack] = useState<MusicTrack | null>(null);
  const [isMusicSelectorOpen, setIsMusicSelectorOpen] = useState<boolean>(false);
  const [selectedAudio, setSelectedAudio] = useState<AudioTrackOption>({
    title: 'Kesariya (Acoustic Folk Fusion)',
    artist: 'Pritam & Arijit Singh',
    isCommercial: true,
    rightsHolder: 'Sony Music India & Dharma Productions',
  });

  // Copyright scan, pre-upload checking & attribution state
  const [isPreUploadChecking, setIsPreUploadChecking] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [preUploadCheckText, setPreUploadCheckText] = useState<string>('Checking for copyright issues...');
  const [isSimulateCopyrightClaim, setIsSimulateCopyrightClaim] = useState<boolean>(false);
  const [isScanningCopyright, setIsScanningCopyright] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [showCopyrightWarning, setShowCopyrightWarning] = useState<boolean>(false);
  const [flaggedAudio, setFlaggedAudio] = useState<AudioTrackOption | null>(null);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreMediaInputRef = useRef<HTMLInputElement>(null);
  const cameraRollInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Instagram Audio Attribution Pill logic
  const officialAudioPill = selectedMusicTrack
    ? `${selectedMusicTrack.title} • ${selectedMusicTrack.artist}`
    : `Original Audio • @${currentUser?.username || 'user'}`;

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
      setShowCoverPickerModal(false);

      if (initialCreateMusicTrack) {
        setSelectedMusicTrack(initialCreateMusicTrack);
        setSelectedAudio({
          title: initialCreateMusicTrack.title,
          artist: initialCreateMusicTrack.artist,
          isCommercial: true,
          rightsHolder: initialCreateMusicTrack.album || 'Verified Audio',
        });
      }
    }
  }, [isCreateModalOpen, createModalInitialTab, initialCreateMusicTrack]);

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

  // Handle local file(s) selection with persistent Base64 / IndexedDB storage
  const handleFilesSelect = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setIsProcessingMedia(true);
    showToast(`Loading ${fileList.length > 1 ? `${fileList.length} items` : fileList[0].name}... ✨`);

    try {
      const newItems: MediaItem[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const isVideo = file.type.startsWith('video') || Boolean(file.name.match(/\.(mp4|webm|mov|m4v)$/i));
        const isImage = file.type.startsWith('image') || Boolean(file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i));

        if (!isVideo && !isImage) continue;

        try {
          const stored = await storeMedia(file);
          newItems.push({
            id: `item_${Date.now()}_${i}`,
            url: stored.dataUrl,
            type: isVideo ? 'video' : 'image',
            localKey: stored.id,
            thumbnailUrl: stored.thumbnailUrl,
          });
        } catch {
          const objectUrl = URL.createObjectURL(file);
          registerSessionBlob(objectUrl);
          newItems.push({
            id: `item_${Date.now()}_${i}`,
            url: objectUrl,
            type: isVideo ? 'video' : 'image',
          });
        }
      }

      if (newItems.length > 0) {
        setMediaItems(newItems);
        setActiveMediaIndex(0);
        const primary = newItems[0];
        setMediaUrl(primary.url);
        setLocalMediaKey(primary.localKey || '');
        setMediaType(primary.type);

        if (primary.thumbnailUrl) {
          setCustomCoverUrl(primary.thumbnailUrl);
        }

        if (activeType === 'reel' || primary.type === 'video') {
          setAspectRatio(activeType === 'reel' ? '9:16' : '4:5');
        } else {
          setAspectRatio('1:1');
        }

        setStep('crop');
        showToast(`Loaded ${newItems.length} item${newItems.length > 1 ? 's (Carousel ready)' : ''}`);
      } else {
        showToast('Please choose valid video or image files.');
      }
    } finally {
      setIsProcessingMedia(false);
    }
  };

  const handleFileSelect = (file: File) => {
    handleFilesSelect([file]);
  };

  // Add more media to existing carousel
  const handleAddMoreMedia = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const isVideo = file.type.startsWith('video') || Boolean(file.name.match(/\.(mp4|webm|mov|m4v)$/i));
      const objectUrl = URL.createObjectURL(file);
      registerSessionBlob(objectUrl);
      setMediaItems((prev) => [
        ...prev,
        {
          id: `item_${Date.now()}_${i}`,
          url: objectUrl,
          type: isVideo ? 'video' : 'image',
        },
      ]);
    }
    showToast(`Added ${fileList.length} media item(s) to carousel 🎠`);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
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

  // Capture video frame to canvas as cover thumbnail (Instagram style)
  const captureFrameAsCover = (seekTime?: number) => {
    if (!videoRef.current) return;
    try {
      const vid = videoRef.current;
      if (typeof seekTime === 'number') {
        vid.currentTime = seekTime;
      }
      const canvas = document.createElement('canvas');
      canvas.width = vid.videoWidth || 640;
      canvas.height = vid.videoHeight || 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setCustomCoverUrl(dataUrl);
        showToast('Cover frame captured from video! 📸');
      }
    } catch (err) {
      console.warn('Cover frame capture note:', err);
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

    const musicToSave = selectedMusicTrack ? {
      ...selectedMusicTrack,
      audioStartTime: trimStart,
      clipDuration,
      originalVolume: originalAudioVolume,
      musicVolume,
    } : undefined;

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
          music: musicToSave,
          musicTitle: selectedMusicTrack?.title || audioTitleToUse,
          musicArtist: selectedMusicTrack?.artist || audioArtistToUse,
          musicCover: selectedMusicTrack?.coverUrl,
          audioStartTime: trimStart,
          clipDuration,
          originalVolume: originalAudioVolume,
          musicVolume,
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
          music: musicToSave,
          musicTitle: selectedMusicTrack?.title || audioTitleToUse,
          musicArtist: selectedMusicTrack?.artist || audioArtistToUse,
          musicCover: selectedMusicTrack?.coverUrl,
          audioStartTime: trimStart,
          clipDuration,
          originalVolume: originalAudioVolume,
          musicVolume,
          isCommercialAudio: isCommercial,
        } as any);
      }

      setStep('done');
      soundManager.stopSoundtrack();
      showToast('🎉 Your post has been shared to LOKSY community!');
    }, 500);
  };

  // Instagram Pre-Upload Copyright Check Simulation & Share Handler
  const handleShareClick = () => {
    if (!mediaUrl) {
      showToast('Please pick or upload media to share.');
      return;
    }

    setIsPreUploadChecking(true);
    setUploadProgress(15);
    setPreUploadCheckText('Checking for copyright issues...');

    // Simulate Instagram's real-time pre-upload audio check
    setTimeout(() => {
      setUploadProgress(50);
    }, 350);

    setTimeout(() => {
      setUploadProgress(85);

      // Check if simulated copyright claim is enabled or commercial audio flagged
      if (isSimulateCopyrightClaim) {
        setIsPreUploadChecking(false);
        setFlaggedAudio({
          title: selectedMusicTrack?.title || selectedAudio.title,
          artist: selectedMusicTrack?.artist || selectedAudio.artist,
          isCommercial: true,
          rightsHolder: 'T-Series / Sony Music Entertainment',
        });
        setShowCopyrightWarning(true);
        return;
      }

      // Check passed
      setPreUploadCheckText('Copyright check passed ✓');
      setUploadProgress(100);

      setTimeout(() => {
        setIsPreUploadChecking(false);
        executeFinalPublish(false);
      }, 400);
    }, 950);
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
                disabled={isPreUploadChecking}
                className="text-sm font-bold text-[#0095F6] hover:text-[#3897f0] disabled:opacity-50 active:scale-95 transition-all flex items-center gap-1.5"
              >
                {isPreUploadChecking ? (
                  <RotateCw className="w-4 h-4 animate-spin text-[#0095F6]" />
                ) : (
                  'Share'
                )}
              </button>
            )}
          </div>
        </header>

        {/* Instagram Upload & Pre-upload Copyright Check Progress Bar */}
        {isPreUploadChecking && (
          <div
            id="instagram-upload-progress-banner"
            className="w-full bg-[#161a26] border-b border-white/10 px-4 py-2.5 flex flex-col gap-1.5 animate-fade-in"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#0095F6] font-semibold">
                <CheckCircle2 className="w-4 h-4 fill-[#0095F6] text-black shrink-0" />
                <span className="tracking-tight">{preUploadCheckText}</span>
              </div>
              <span className="font-mono text-[11px] text-[#0095F6] font-bold">
                {uploadProgress}%
              </span>
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0095F6] transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
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
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesSelect(e.target.files);
                }
              }}
            />

            <input
              ref={addMoreMediaInputRef}
              type="file"
              accept="video/*,image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleAddMoreMedia(e.target.files);
                }
              }}
            />

            <input
              ref={cameraRollInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    if (evt.target?.result) {
                      setCustomCoverUrl(evt.target.result as string);
                      showToast(`Cover selected from camera roll: ${file.name} 🖼️`);
                    }
                  };
                  reader.readAsDataURL(file);
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
            {/* Instagram Aspect Ratio Quick Switcher Bar */}
            <div
              id="instagram-aspect-ratio-selector-bar"
              className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1 rounded-full bg-black/75 backdrop-blur-xl border border-white/20 shadow-2xl"
            >
              {[
                { id: '1:1', label: '1:1', icon: '■' },
                { id: '4:5', label: '4:5', icon: '▮' },
                { id: '9:16', label: '9:16', icon: '📱' },
                { id: 'original', label: 'Original', icon: '⧉' },
              ].map((opt) => {
                const isActive = aspectRatio === opt.id;
                return (
                  <button
                    key={opt.id}
                    id={`ratio-btn-${opt.id.replace(':', '-')}`}
                    type="button"
                    onClick={() => setAspectRatio(opt.id as AspectRatioOption)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-white text-black shadow-lg scale-105 font-bold'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="text-[10px] opacity-75">{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Multiple Media Carousel Indicator Badge */}
            {mediaItems.length > 1 && (
              <div
                id="instagram-carousel-indicator-badge"
                className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-xl border border-white/20 text-white text-xs font-semibold shadow-lg"
              >
                <Layers className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>
                  {activeMediaIndex + 1} / {mediaItems.length}
                </span>
              </div>
            )}

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

              {/* Carousel Previous & Next Chevrons */}
              {mediaItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = (activeMediaIndex - 1 + mediaItems.length) % mediaItems.length;
                      setActiveMediaIndex(nextIdx);
                      setMediaUrl(mediaItems[nextIdx].url);
                      setMediaType(mediaItems[nextIdx].type);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90"
                    title="Previous media"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = (activeMediaIndex + 1) % mediaItems.length;
                      setActiveMediaIndex(nextIdx);
                      setMediaUrl(mediaItems[nextIdx].url);
                      setMediaType(mediaItems[nextIdx].type);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90"
                    title="Next media"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
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

              {/* Music / Sound Button */}
              <button
                id="instagram-crop-music-btn"
                type="button"
                onClick={() => setIsMusicSelectorOpen(true)}
                className={`h-9 px-3 rounded-full backdrop-blur-md border flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 select-none ${
                  selectedMusicTrack
                    ? 'bg-gradient-to-r from-[#FF4668] to-[#FF8A00] text-white border-transparent'
                    : 'bg-black/65 text-white border-white/20 hover:bg-black/80'
                }`}
                title="Add Music / Sound"
              >
                <Music className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold max-w-[130px] truncate">
                  {selectedMusicTrack ? selectedMusicTrack.title : 'Add Music'}
                </span>
              </button>
            </div>

            {/* Bottom-Right Controls: Select Multiple & Play/Mute */}
            <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2">
              {/* Select Multiple Media (Carousel) Toggle */}
              <button
                id="instagram-select-multiple-btn"
                type="button"
                onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
                className={`w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
                  isMultiSelectMode || mediaItems.length > 1
                    ? 'bg-[#0095F6] text-white border-[#0095F6]'
                    : 'bg-black/65 text-white border-white/20 hover:bg-black/80'
                }`}
                title="Select multiple (Carousel)"
              >
                <Layers className="w-4 h-4" />
              </button>

              {mediaType === 'video' && (
                <>
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-full bg-black/65 text-white backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg hover:bg-black/80 active:scale-90 transition-transform"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white translate-x-0.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="w-9 h-9 rounded-full bg-black/65 text-white backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg hover:bg-black/80 active:scale-90 transition-transform"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#00E5FF]" />}
                  </button>
                </>
              )}
            </div>

            {/* Multiple Media Thumbnail Strip */}
            {(isMultiSelectMode || mediaItems.length > 1) && (
              <div
                id="instagram-carousel-thumbnail-strip"
                className="absolute bottom-16 right-4 z-30 flex items-center gap-2 p-1.5 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-[280px] overflow-x-auto scrollbar-none"
              >
                {mediaItems.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveMediaIndex(idx);
                      setMediaUrl(item.url);
                      setMediaType(item.type);
                    }}
                    className={`relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border-2 transition-transform active:scale-95 ${
                      activeMediaIndex === idx ? 'border-[#0095F6] scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    {item.type === 'video' ? (
                      <video src={item.url} className="w-full h-full object-cover pointer-events-none" />
                    ) : (
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                    )}
                    <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold bg-black/70 px-1 rounded text-white">
                      {idx + 1}
                    </span>
                  </button>
                ))}

                {/* Add More Media Button */}
                <button
                  type="button"
                  onClick={() => addMoreMediaInputRef.current?.click()}
                  className="w-11 h-11 rounded-lg border border-dashed border-white/30 hover:border-white/60 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center shrink-0 text-white transition-colors"
                  title="Add more photos or videos"
                >
                  <Plus className="w-4 h-4 text-[#00E5FF]" />
                  <span className="text-[9px] text-gray-300 font-medium">Add</span>
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
                  {/* Instagram Video Cover Frame Selector */}
                  {mediaType === 'video' && (
                    <div className="space-y-3 p-3 bg-white/[0.03] rounded-2xl border border-white/10">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-[#FF8A00]" />
                          <span>Cover Frame Selector</span>
                        </label>
                        <span className="text-[10px] font-mono text-[#00E5FF] bg-white/10 px-1.5 py-0.5 rounded">
                          {customCoverUrl.startsWith('data:') ? 'Camera Roll' : `${coverFrameTime.toFixed(1)}s`}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Scrub video to choose your reel thumbnail or upload directly from camera roll.
                      </p>

                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-20 rounded-xl bg-black border-2 border-white/20 overflow-hidden flex items-center justify-center shrink-0 shadow-lg group">
                          <img
                            src={
                              customCoverUrl ||
                              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'
                            }
                            alt="Cover thumbnail"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] font-bold text-white">
                            Cover
                          </div>
                        </div>

                        <div className="flex-1 space-y-2">
                          <input
                            id="instagram-cover-video-scrubber"
                            type="range"
                            min={0}
                            max={videoDuration || 15}
                            step={0.2}
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
                          <div className="flex items-center justify-between gap-2">
                            {/* Add from camera roll button */}
                            <button
                              id="instagram-cover-camera-roll-btn"
                              type="button"
                              onClick={() => cameraRollInputRef.current?.click()}
                              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-semibold text-white flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                            >
                              <UploadCloud className="w-3.5 h-3.5 text-[#0095F6]" />
                              <span>Add from camera roll</span>
                            </button>

                            {/* Capture Current Frame */}
                            <button
                              type="button"
                              onClick={() => {
                                if (videoRef.current) {
                                  try {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = videoRef.current.videoWidth || 720;
                                    canvas.height = videoRef.current.videoHeight || 1280;
                                    const ctx = canvas.getContext('2d');
                                    if (ctx) {
                                      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                                      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                                      setCustomCoverUrl(dataUrl);
                                      showToast(`Captured cover frame at ${currentTime.toFixed(1)}s 📸`);
                                    }
                                  } catch {
                                    setCoverFrameTime(currentTime);
                                    showToast(`Cover frame set to ${currentTime.toFixed(1)}s`);
                                  }
                                }
                              }}
                              className="text-[11px] text-[#00E5FF] hover:underline font-medium"
                            >
                              Capture current
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
                    {selectedMusicTrack ? (
                      <MusicTrimmerMixer
                        track={selectedMusicTrack}
                        audioStartTime={trimStart}
                        onChangeStartTime={setTrimStart}
                        clipDuration={clipDuration}
                        onChangeClipDuration={setClipDuration}
                        originalVolume={originalAudioVolume}
                        onChangeOriginalVolume={(v) => {
                          setOriginalAudioVolume(v);
                          if (videoRef.current) {
                            videoRef.current.volume = v / 100;
                          }
                        }}
                        musicVolume={musicVolume}
                        onChangeMusicVolume={setMusicVolume}
                        hasOriginalAudio={mediaType === 'video'}
                        onChangeTrack={() => setIsMusicSelectorOpen(true)}
                        onRemoveTrack={() => setSelectedMusicTrack(null)}
                      />
                    ) : (
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-200 block flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Music className="w-3.5 h-3.5 text-[#FF8A00]" />
                            <span>Audio & Music</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsMusicSelectorOpen(true)}
                            className="text-[11px] text-[#00E5FF] hover:underline font-semibold"
                          >
                            Add Song
                          </button>
                        </label>

                        {/* Prompt to add Music */}
                        <div
                          onClick={() => setIsMusicSelectorOpen(true)}
                          className="p-3 rounded-2xl bg-gradient-to-r from-[#FF4668]/10 via-[#FF8A00]/10 to-[#00E5FF]/10 border border-white/10 hover:border-[#00E5FF]/40 transition-all flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF4668] to-[#FF8A00] flex items-center justify-center shrink-0 shadow-md">
                              <Music className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate group-hover:text-[#00E5FF] transition-colors">
                                Add Indian Music / Soundtrack
                              </div>
                              <div className="text-[10px] text-gray-400 truncate">
                                Bhojpuri, Hindi, Punjabi & JioSaavn search
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white shrink-0" />
                        </div>

                        {/* Video Audio Volume Slider */}
                        {mediaType === 'video' && (
                          <div className="space-y-1.5 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                            <div className="flex justify-between text-[11px] text-gray-300 font-semibold">
                              <div className="flex items-center gap-1.5">
                                <Video className="w-3.5 h-3.5 text-[#00E5FF]" />
                                <span>Original Video Audio Volume</span>
                              </div>
                              <span className="font-mono text-[#00E5FF]">{originalAudioVolume}%</span>
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
                              className="w-full accent-[#00E5FF] cursor-pointer"
                            />
                          </div>
                        )}
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

                {/* Instagram Official Audio Attribution Pill Overlay */}
                <div
                  id="instagram-preview-audio-pill"
                  className="absolute bottom-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-lg max-w-[85%]"
                >
                  <Music className="w-3.5 h-3.5 text-[#0095F6] shrink-0" />
                  <span className="truncate">{officialAudioPill}</span>
                </div>
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

              {/* Caption & Media Thumbnail Row (Instagram layout) */}
              <div className="p-4 border-b border-white/5 flex gap-3.5 items-start">
                {/* Media / Cover Thumbnail box */}
                <div
                  id="create-modal-details-cover-box"
                  className="relative w-16 h-20 rounded-xl bg-black overflow-hidden border border-white/15 shrink-0 group cursor-pointer shadow-lg"
                  onClick={() => {
                    if (mediaType === 'video') {
                      setShowCoverPickerModal(true);
                    }
                  }}
                  title={mediaType === 'video' ? 'Tap to choose cover frame' : 'Media preview'}
                >
                  <img
                    src={customCoverUrl || (mediaType === 'image' ? mediaUrl : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80')}
                    alt="Cover preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  {mediaType === 'video' && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-end p-1 transition-opacity group-hover:bg-black/20">
                      <span className="text-[9px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded-full backdrop-blur-sm border border-white/20">
                        Cover
                      </span>
                    </div>
                  )}
                </div>

                {/* Caption Textarea & Quick Emoji Bar */}
                <div className="flex-1 min-w-0 space-y-2">
                  <textarea
                    id="instagram-caption-textarea"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption..."
                    rows={3}
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
                          className="text-sm p-0.5 hover:scale-125 transition-transform"
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
              </div>

              {/* Cover Photo Scrubber Row (For Videos / Reels) */}
              {mediaType === 'video' && (
                <div
                  id="create-modal-cover-picker-row"
                  className="p-3.5 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setShowCoverPickerModal(true)}
                >
                  <div className="flex items-center gap-2.5 text-xs text-gray-200">
                    <ImageIcon className="w-4 h-4 text-[#FF8A00]" />
                    <div>
                      <span className="font-semibold block text-white">Cover photo</span>
                      <span className="text-[10px] text-gray-400 block">
                        {customCoverUrl ? `Selected frame at ${coverFrameTime.toFixed(1)}s` : 'Scrub video frame to select cover'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#00E5FF] font-semibold">Select</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              )}

              {/* Tag People Row (Directly below Caption & Cover) */}
              <div
                id="create-modal-tag-people-row"
                className="p-3.5 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
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

              {/* Add Location Row */}
              <div id="create-modal-location-row" className="border-b border-white/5">
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

              {/* Add Music Row (Indian Music Library & JioSaavn public search) */}
              <div
                id="create-modal-add-music-row"
                className="p-3.5 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setIsMusicSelectorOpen(true)}
              >
                <div className="flex items-center gap-2.5 text-xs text-gray-200 min-w-0 pr-2">
                  {selectedMusicTrack ? (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={selectedMusicTrack.coverUrl}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover border border-white/20 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5 text-[#FF4668] shrink-0" />
                          <span className="font-bold text-white truncate">
                            {selectedMusicTrack.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 truncate block">
                          {selectedMusicTrack.artist}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Music className="w-4 h-4 text-[#FF4668] shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold text-white block">Add Music / Sound</span>
                        <span className="text-[10px] text-gray-400 block truncate">
                          Bhojpuri, Hindi, Punjabi & JioSaavn search
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {selectedMusicTrack && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMusicTrack(null);
                      }}
                      className="p-1 rounded-full text-gray-400 hover:text-white"
                      title="Remove music"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className="text-[11px] text-[#00E5FF] font-semibold">
                    {selectedMusicTrack ? 'Change' : 'Select'}
                  </span>
                </div>
              </div>

              {/* Instagram Style Music Trimmer & Volume Mixer (when music track selected) */}
              {selectedMusicTrack && (
                <div className="p-3.5 border-b border-white/5 bg-black/25">
                  <MusicTrimmerMixer
                    track={selectedMusicTrack}
                    audioStartTime={trimStart}
                    onChangeStartTime={setTrimStart}
                    clipDuration={clipDuration}
                    onChangeClipDuration={setClipDuration}
                    originalVolume={originalAudioVolume}
                    onChangeOriginalVolume={(v) => {
                      setOriginalAudioVolume(v);
                      if (videoRef.current) {
                        videoRef.current.volume = v / 100;
                      }
                    }}
                    musicVolume={musicVolume}
                    onChangeMusicVolume={setMusicVolume}
                    hasOriginalAudio={mediaType === 'video'}
                    onChangeTrack={() => setIsMusicSelectorOpen(true)}
                    onRemoveTrack={() => setSelectedMusicTrack(null)}
                  />
                </div>
              )}

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

      {/* Indian Music Library Selector Modal (Bhojpuri, Hindi, Punjabi & JioSaavn search) */}
      <MusicSelectorModal
        isOpen={isMusicSelectorOpen}
        onClose={() => setIsMusicSelectorOpen(false)}
        onSelectMusic={(track) => {
          setSelectedMusicTrack(track);
          if (track) {
            setSelectedAudio({
              title: track.title,
              artist: track.artist,
              isCommercial: true,
              rightsHolder: track.album || track.artist,
            });
            showToast(`🎵 Attached: ${track.title} (${track.artist})`);
          } else {
            showToast('Sound removed');
          }
        }}
        currentSelectedMusic={selectedMusicTrack}
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

      {/* Cover / Thumbnail Scrubber Modal (Exact Instagram Style) */}
      {showCoverPickerModal && mediaType === 'video' && (
        <div
          id="instagram-cover-picker-dialog"
          className="fixed inset-0 z-[140] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowCoverPickerModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#161a26] text-white rounded-3xl p-5 border border-white/15 shadow-2xl space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#FF8A00]" />
                <span>Select Cover Frame</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  captureFrameAsCover(coverFrameTime);
                  setShowCoverPickerModal(false);
                }}
                className="px-4 py-1.5 rounded-full bg-[#0095F6] hover:bg-[#0081d6] text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                Done
              </button>
            </div>

            {/* Frame Preview Canvas / Video */}
            <div className="relative aspect-square max-h-64 mx-auto rounded-2xl overflow-hidden bg-black border border-white/20 flex items-center justify-center shadow-inner">
              <video
                src={mediaUrl}
                playsInline
                muted
                className="w-full h-full object-cover"
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  v.currentTime = coverFrameTime;
                }}
              />
              <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-mono text-white border border-white/20">
                {coverFrameTime.toFixed(1)}s / {(videoDuration || 15).toFixed(0)}s
              </div>
            </div>

            {/* Video Scrubber Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-300 font-semibold">
                <span>Drag scrubber to choose frame</span>
                <span className="font-mono text-[#00E5FF]">{coverFrameTime.toFixed(1)}s</span>
              </div>
              <input
                id="instagram-cover-scrubber-slider"
                type="range"
                min={0}
                max={videoDuration || 15}
                step={0.1}
                value={coverFrameTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCoverFrameTime(val);
                  if (videoRef.current) {
                    videoRef.current.currentTime = val;
                  }
                }}
                className="w-full accent-[#0095F6] h-2 bg-white/20 rounded-full cursor-pointer"
              />
              <p className="text-[11px] text-gray-400">
                The chosen frame will be the primary cover displayed on your profile grid and in feed previews.
              </p>
            </div>

            {/* Quick Presets & Set Frame Action */}
            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setCustomCoverUrl('https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80');
                  showToast('Selected high-res cover poster! 🎨');
                  setShowCoverPickerModal(false);
                }}
                className="text-xs text-[#00E5FF] hover:underline font-semibold"
              >
                Use poster preset
              </button>
              <button
                type="button"
                onClick={() => {
                  captureFrameAsCover(coverFrameTime);
                  setShowCoverPickerModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
              >
                Set This Frame
              </button>
            </div>
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

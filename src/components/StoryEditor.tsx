import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  Type,
  Smile,
  PenTool,
  Music,
  Trash2,
  ChevronRight,
  Volume2,
  VolumeX,
  Sparkles,
  Check,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Move,
  AtSign,
  MapPin,
  Search,
  Play,
  Pause,
  Disc3,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MusicTrack } from '../types';
import { SAMPLE_AUDIO_PREVIEWS } from '../utils/musicApi';

export type FontStyleType = 'classic' | 'modern' | 'neon' | 'serif' | 'strong';
export type HighlightModeType = 'none' | 'solid' | 'soft';

export interface TextOverlayState {
  text: string;
  color: string;
  fontStyle: FontStyleType;
  highlightMode: HighlightModeType;
  textAlign: 'left' | 'center' | 'right';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export type StickerType = 'emoji' | 'mention' | 'location';

export interface StoryStickerItem {
  id: string;
  type: StickerType;
  content: string; // Emoji character or username or location name
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface StoryEditorProps {
  isOpen: boolean;
  mediaUrl?: string | null;
  mediaBlob?: Blob | null;
  mediaType?: 'image' | 'video';
  onClose: () => void;
  onRetake: () => void;
  onPostStory?: (storyData: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption?: string;
    musicTrack?: MusicTrack | null;
    stickers?: string[];
    textOverlay?: string;
  }) => void;
  onDiscard?: () => void;
}

// Curated Royalty-Free Library with playable audio previews
export const ROYALTY_FREE_AUDIO_TRACKS: MusicTrack[] = [
  {
    id: 'rf_lofi_chai',
    title: 'Chai & Chill Beats',
    artist: 'LOKSY Originals',
    album: 'Desi Monsoon Lofi',
    genre: 'Lofi Chill',
    duration: 30,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    audioUrl: SAMPLE_AUDIO_PREVIEWS.hindiLofi,
  },
  {
    id: 'rf_mumbai_monsoon',
    title: 'Mumbai Monsoon Beats',
    artist: 'Desi Beat Lab',
    album: 'Streets of Bombay',
    genre: 'Urban Folk',
    duration: 30,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    audioUrl: SAMPLE_AUDIO_PREVIEWS.bhojpuriBeat,
  },
  {
    id: 'rf_sitar_twilight',
    title: 'Sitar Twilight Melody',
    artist: 'Raga Wave Collective',
    album: 'Classical Heritage',
    genre: 'Ambient Indian',
    duration: 30,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    audioUrl: SAMPLE_AUDIO_PREVIEWS.sitarClassical,
  },
  {
    id: 'rf_acoustic_serenade',
    title: 'Jaipur Acoustic Breeze',
    artist: 'Pink City Strings',
    album: 'Rajasthan Acoustic',
    genre: 'Acoustic Folk',
    duration: 30,
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
    audioUrl: SAMPLE_AUDIO_PREVIEWS.romanticAcoustic,
  },
  {
    id: 'rf_punjabi_dhol',
    title: 'Bhangra Dholak Surge',
    artist: 'Punjab Rhythm Kings',
    album: 'Desi Energy Vol. 1',
    genre: 'Punjabi Folk',
    duration: 30,
    coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&auto=format&fit=crop&q=80',
    audioUrl: SAMPLE_AUDIO_PREVIEWS.punjabiBhangra,
  },
  {
    id: 'rf_dholak_celebration',
    title: 'Festive Dholak Groove',
    artist: 'Folk Vibes India',
    album: 'Carnival Nights',
    genre: 'Festive Dance',
    duration: 30,
    coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
    audioUrl: SAMPLE_AUDIO_PREVIEWS.danceDholak,
  },
];

const RICH_EMOJI_PRESETS = [
  '🔥',
  '❤️',
  '✨',
  '🇮🇳',
  '☕',
  '🎧',
  '🚀',
  '💯',
  '⚡',
  '🎉',
  '🌟',
  '😍',
  '🥳',
  '💃',
  '🍕',
  '📸',
  '🏝️',
  '🕶️',
  '🍿',
  '🎈',
  '🌈',
  '👑',
  '🤙',
  '🧘',
];

const POPULAR_LOCATIONS = [
  'Mumbai, Maharashtra',
  'Bengaluru, Karnataka',
  'New Delhi, India',
  'Goa Beaches 🌴',
  'Jaipur, Rajasthan',
  'Hyderabad, India',
  'Kolkata, West Bengal',
  'London, UK',
  'New York, NY',
];

const TEXT_COLORS = [
  '#FFFFFF',
  '#000000',
  '#FF3040',
  '#FF8A00',
  '#FFD700',
  '#00E676',
  '#0095F6',
  '#9C27B0',
  '#E040FB',
  '#00E5FF',
];

const FONT_STYLES: { id: FontStyleType; label: string; sampleClass: string }[] = [
  { id: 'modern', label: 'Modern', sampleClass: 'font-sans font-black tracking-tight' },
  { id: 'classic', label: 'Classic', sampleClass: 'font-sans font-bold' },
  { id: 'strong', label: 'Strong', sampleClass: 'font-black uppercase tracking-wider' },
  { id: 'serif', label: 'Serif', sampleClass: 'font-serif italic font-bold' },
  { id: 'neon', label: 'Neon', sampleClass: 'font-mono font-bold tracking-widest' },
];

export const StoryEditor: React.FC<StoryEditorProps> = ({
  isOpen,
  mediaUrl,
  mediaBlob,
  mediaType: explicitMediaType,
  onClose,
  onRetake,
  onPostStory,
  onDiscard,
}) => {
  const { currentUser, users, addStory } = useApp();

  // Created Object URL for mediaBlob if provided
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Interactive Text Overlay State
  const [textItem, setTextItem] = useState<TextOverlayState>({
    text: '',
    color: '#FFFFFF',
    fontStyle: 'modern',
    highlightMode: 'soft',
    textAlign: 'center',
    x: 50,
    y: 35,
  });

  // Editor modal overlay open state
  const [isTextEditing, setIsTextEditing] = useState<boolean>(false);
  // Staging state during modal text typing
  const [stagedText, setStagedText] = useState<string>('');
  const [stagedColor, setStagedColor] = useState<string>('#FFFFFF');
  const [stagedFontStyle, setStagedFontStyle] = useState<FontStyleType>('modern');
  const [stagedHighlightMode, setStagedHighlightMode] = useState<HighlightModeType>('soft');
  const [stagedTextAlign, setStagedTextAlign] = useState<'left' | 'center' | 'right'>('center');

  // Text Dragging refs
  const stageRef = useRef<HTMLDivElement | null>(null);
  const isTextDraggingRef = useRef<boolean>(false);
  const textHasMovedRef = useRef<boolean>(false);
  const textDragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    initialX: number;
    initialY: number;
  }>({ pointerX: 0, pointerY: 0, initialX: 50, initialY: 35 });

  // Multiple Draggable Stickers State
  const [stickers, setStickers] = useState<StoryStickerItem[]>([]);
  const [showStickerTray, setShowStickerTray] = useState<boolean>(false);
  const [stickerFilter, setStickerFilter] = useState<string>('');

  // Sticker Dragging State
  const [draggingStickerId, setDraggingStickerId] = useState<string | null>(null);
  const stickerDragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
  }>({ pointerX: 0, pointerY: 0, initialX: 50, initialY: 50, hasMoved: false });

  // Tag Quick Input Dialog State ('mention' | 'location' | null)
  const [activeTagDialog, setActiveTagDialog] = useState<'mention' | 'location' | null>(null);
  const [tagInputValue, setTagInputValue] = useState<string>('');

  // -------------------------------------------------------------
  // MUSIC & AUDIO STATE
  // -------------------------------------------------------------
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [showMusicModal, setShowMusicModal] = useState<boolean>(false);
  const [musicSearchQuery, setMusicSearchQuery] = useState<string>('');
  const [previewPlayingTrackId, setPreviewPlayingTrackId] = useState<string | null>(null);

  // Music Badge Canvas Position & Dragging
  const [musicBadgePos, setMusicBadgePos] = useState<{ x: number; y: number }>({ x: 50, y: 72 });
  const isMusicBadgeDraggingRef = useRef<boolean>(false);
  const musicBadgeHasMovedRef = useRef<boolean>(false);
  const musicBadgeDragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    initialX: number;
    initialY: number;
  }>({ pointerX: 0, pointerY: 0, initialX: 50, initialY: 72 });

  // Audio / Sound state
  const [activeToolToast, setActiveToolToast] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Video element ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Audio playback elements
  const storyAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Generate object URL for blob when passed
  useEffect(() => {
    if (mediaBlob) {
      const url = URL.createObjectURL(mediaBlob);
      setBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setBlobUrl(null);
    }
  }, [mediaBlob]);

  // Resolved media source and media type
  const activeMediaUrl = mediaUrl || blobUrl || '';
  const detectedMediaType = useMemo<'image' | 'video'>(() => {
    if (explicitMediaType) return explicitMediaType;
    if (mediaBlob?.type?.startsWith('video')) return 'video';
    if (activeMediaUrl.startsWith('data:video') || activeMediaUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
      return 'video';
    }
    return 'image';
  }, [explicitMediaType, mediaBlob, activeMediaUrl]);

  // Manage Story Background Music Audio Playback
  useEffect(() => {
    if (!isOpen) {
      if (storyAudioRef.current) {
        storyAudioRef.current.pause();
        storyAudioRef.current = null;
      }
      return;
    }

    if (selectedMusic && !showMusicModal) {
      if (!storyAudioRef.current) {
        storyAudioRef.current = new Audio();
        storyAudioRef.current.loop = true;
        storyAudioRef.current.crossOrigin = 'anonymous';
      }
      const audio = storyAudioRef.current;
      audio.muted = isMuted;
      if (audio.src !== selectedMusic.audioUrl) {
        audio.src = selectedMusic.audioUrl;
      }
      audio.play().catch(() => {
        // Autoplay may be blocked until user interaction
      });
    } else if (storyAudioRef.current) {
      storyAudioRef.current.pause();
    }

    return () => {
      if (storyAudioRef.current) {
        storyAudioRef.current.pause();
      }
    };
  }, [isOpen, selectedMusic, isMuted, showMusicModal]);

  // Handle Mute Toggle Synchronization
  useEffect(() => {
    if (storyAudioRef.current) {
      storyAudioRef.current.muted = isMuted;
    }
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Stop preview audio when modal closes or unmounts
  useEffect(() => {
    if (!showMusicModal && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPreviewPlayingTrackId(null);
    }
  }, [showMusicModal]);

  const showToast = (message: string) => {
    setActiveToolToast(message);
    window.setTimeout(() => {
      setActiveToolToast(null);
    }, 2000);
  };

  // Open Text Editor Overlay
  const openTextEditor = useCallback(() => {
    setStagedText(textItem.text);
    setStagedColor(textItem.color);
    setStagedFontStyle(textItem.fontStyle);
    setStagedHighlightMode(textItem.highlightMode);
    setStagedTextAlign(textItem.textAlign);
    setIsTextEditing(true);
    setShowStickerTray(false);
  }, [textItem]);

  // Confirm Staged Text Overlay
  const confirmTextEditor = () => {
    setTextItem((prev) => ({
      ...prev,
      text: stagedText.trim(),
      color: stagedColor,
      fontStyle: stagedFontStyle,
      highlightMode: stagedHighlightMode,
      textAlign: stagedTextAlign,
    }));
    setIsTextEditing(false);
  };

  // Cycle Highlight Mode (none -> solid -> soft)
  const cycleHighlightMode = () => {
    setStagedHighlightMode((curr) => {
      if (curr === 'none') return 'solid';
      if (curr === 'solid') return 'soft';
      return 'none';
    });
  };

  // Cycle Text Align
  const cycleTextAlign = () => {
    setStagedTextAlign((curr) => {
      if (curr === 'left') return 'center';
      if (curr === 'center') return 'right';
      return 'left';
    });
  };

  // Dragging Handlers for Canvas Text Overlay
  const handleTextPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isTextDraggingRef.current = true;
    textHasMovedRef.current = false;

    textDragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initialX: textItem.x,
      initialY: textItem.y,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleTextPointerMove = (e: React.PointerEvent) => {
    if (!isTextDraggingRef.current) return;
    const deltaX = e.clientX - textDragStartRef.current.pointerX;
    const deltaY = e.clientY - textDragStartRef.current.pointerY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      textHasMovedRef.current = true;
    }

    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const percentDeltaX = (deltaX / rect.width) * 100;
    const percentDeltaY = (deltaY / rect.height) * 100;

    const newX = Math.max(12, Math.min(88, textDragStartRef.current.initialX + percentDeltaX));
    const newY = Math.max(10, Math.min(88, textDragStartRef.current.initialY + percentDeltaY));

    setTextItem((prev) => ({
      ...prev,
      x: newX,
      y: newY,
    }));
  };

  const handleTextPointerUp = (e: React.PointerEvent) => {
    if (!isTextDraggingRef.current) return;
    isTextDraggingRef.current = false;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (!textHasMovedRef.current) {
      openTextEditor();
    }
  };

  // -------------------------------------------------------------
  // STICKER CREATION & DRAGGING LOGIC
  // -------------------------------------------------------------
  const addStickerToCanvas = (type: StickerType, content: string) => {
    const newId = `sticker_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const offset = (stickers.length % 5) * 4 - 8;
    const newSticker: StoryStickerItem = {
      id: newId,
      type,
      content,
      x: Math.min(80, Math.max(20, 50 + offset)),
      y: Math.min(80, Math.max(20, 55 + offset)),
    };

    setStickers((prev) => [...prev, newSticker]);
    setShowStickerTray(false);
    showToast(type === 'emoji' ? `Added ${content} to story` : `Added ${content}`);
  };

  const removeStickerFromCanvas = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  // Sticker Pointer Dragging
  const handleStickerPointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    const current = stickers.find((s) => s.id === id);
    if (!current) return;

    setDraggingStickerId(id);
    stickerDragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initialX: current.x,
      initialY: current.y,
      hasMoved: false,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleStickerPointerMove = (e: React.PointerEvent, id: string) => {
    if (draggingStickerId !== id) return;
    const deltaX = e.clientX - stickerDragStartRef.current.pointerX;
    const deltaY = e.clientY - stickerDragStartRef.current.pointerY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      stickerDragStartRef.current.hasMoved = true;
    }

    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const percentDeltaX = (deltaX / rect.width) * 100;
    const percentDeltaY = (deltaY / rect.height) * 100;

    const newX = Math.max(10, Math.min(90, stickerDragStartRef.current.initialX + percentDeltaX));
    const newY = Math.max(10, Math.min(90, stickerDragStartRef.current.initialY + percentDeltaY));

    setStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, x: newX, y: newY } : s))
    );
  };

  const handleStickerPointerUp = (e: React.PointerEvent, id: string) => {
    if (draggingStickerId !== id) return;
    setDraggingStickerId(null);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // -------------------------------------------------------------
  // MUSIC BADGE DRAGGING HANDLERS
  // -------------------------------------------------------------
  const handleMusicBadgePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isMusicBadgeDraggingRef.current = true;
    musicBadgeHasMovedRef.current = false;

    musicBadgeDragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initialX: musicBadgePos.x,
      initialY: musicBadgePos.y,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleMusicBadgePointerMove = (e: React.PointerEvent) => {
    if (!isMusicBadgeDraggingRef.current) return;
    const deltaX = e.clientX - musicBadgeDragStartRef.current.pointerX;
    const deltaY = e.clientY - musicBadgeDragStartRef.current.pointerY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      musicBadgeHasMovedRef.current = true;
    }

    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const percentDeltaX = (deltaX / rect.width) * 100;
    const percentDeltaY = (deltaY / rect.height) * 100;

    const newX = Math.max(15, Math.min(85, musicBadgeDragStartRef.current.initialX + percentDeltaX));
    const newY = Math.max(10, Math.min(88, musicBadgeDragStartRef.current.initialY + percentDeltaY));

    setMusicBadgePos({ x: newX, y: newY });
  };

  const handleMusicBadgePointerUp = (e: React.PointerEvent) => {
    if (!isMusicBadgeDraggingRef.current) return;
    isMusicBadgeDraggingRef.current = false;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // If simply tapped, reopen the music picker to change song
    if (!musicBadgeHasMovedRef.current) {
      setShowMusicModal(true);
    }
  };

  // -------------------------------------------------------------
  // MUSIC PREVIEW & SELECT HANDLERS
  // -------------------------------------------------------------
  const handleTogglePreviewPlay = (track: MusicTrack, e: React.MouseEvent) => {
    e.stopPropagation();

    if (previewPlayingTrackId === track.id) {
      // Stop preview
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPreviewPlayingTrackId(null);
    } else {
      // Start preview
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio();
        previewAudioRef.current.crossOrigin = 'anonymous';
      }
      const pAudio = previewAudioRef.current;
      pAudio.src = track.audioUrl;
      pAudio.volume = 0.85;
      pAudio.onended = () => setPreviewPlayingTrackId(null);
      pAudio.play().catch(() => {});
      setPreviewPlayingTrackId(track.id);
    }
  };

  const handleSelectMusicTrack = (track: MusicTrack) => {
    // Stop modal preview audio
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPreviewPlayingTrackId(null);
    }

    setSelectedMusic(track);
    setShowMusicModal(false);
    showToast(`Attached "${track.title}" to Story 🎵`);
  };

  const handleRemoveMusicTrack = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (storyAudioRef.current) {
      storyAudioRef.current.pause();
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setSelectedMusic(null);
    setPreviewPlayingTrackId(null);
    showToast('Music track removed from story');
  };

  // Confirm Tag Modal (Mention / Location)
  const confirmTagDialog = () => {
    const trimmed = tagInputValue.trim();
    if (!trimmed) {
      setActiveTagDialog(null);
      return;
    }

    if (activeTagDialog === 'mention') {
      const cleanUsername = trimmed.startsWith('@') ? trimmed.substring(1) : trimmed;
      addStickerToCanvas('mention', `@${cleanUsername}`);
    } else if (activeTagDialog === 'location') {
      addStickerToCanvas('location', trimmed);
    }

    setTagInputValue('');
    setActiveTagDialog(null);
  };

  const handleDiscard = () => {
    if (storyAudioRef.current) {
      storyAudioRef.current.pause();
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    if (onDiscard) {
      onDiscard();
    } else {
      onClose();
    }
  };

  const handlePublishStory = () => {
    if (!activeMediaUrl) return;

    if (storyAudioRef.current) {
      storyAudioRef.current.pause();
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    const stickerStrings = stickers.map((s) => s.content);

    if (onPostStory) {
      onPostStory({
        mediaUrl: activeMediaUrl,
        mediaType: detectedMediaType,
        caption: textItem.text || (stickerStrings.length > 0 ? stickerStrings.join(' ') : undefined),
        musicTrack: selectedMusic,
        stickers: stickerStrings.length > 0 ? stickerStrings : undefined,
        textOverlay: textItem.text || undefined,
      });
    } else if (addStory) {
      addStory(
        activeMediaUrl,
        textItem.text || (stickerStrings.length > 0 ? stickerStrings.join(' ') : (selectedMusic ? `🎵 ${selectedMusic.title}` : '')),
        selectedMusic || undefined,
        {
          audioStartTime: 0,
          clipDuration: 15,
          originalVolume: detectedMediaType === 'video' && !isMuted ? 100 : 0,
          musicVolume: isMuted ? 0 : 85,
          mediaType: detectedMediaType,
        }
      );
    }
    onClose();
  };

  // Helper for computing dynamic text styles
  const getTextDisplayClasses = (fontStyle: FontStyleType, highlightMode: HighlightModeType) => {
    const fontObj = FONT_STYLES.find((f) => f.id === fontStyle) || FONT_STYLES[0];
    let highlightClasses = '';

    if (highlightMode === 'none') {
      highlightClasses = 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]';
    } else if (highlightMode === 'solid') {
      highlightClasses = 'px-3.5 py-1.5 rounded-xl shadow-2xl';
    } else if (highlightMode === 'soft') {
      highlightClasses = 'px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shadow-xl';
    }

    return `${fontObj.sampleClass} ${highlightClasses}`;
  };

  // Helper to determine solid background contrast
  const getSolidBackgroundStyle = (color: string, highlightMode: HighlightModeType) => {
    if (highlightMode !== 'solid') return {};
    if (color === '#000000') {
      return { backgroundColor: '#FFFFFF', color: '#000000' };
    }
    if (color === '#FFFFFF') {
      return { backgroundColor: '#000000', color: '#FFFFFF' };
    }
    return { backgroundColor: color, color: '#FFFFFF' };
  };

  // Filtered royalty-free tracks in music picker
  const filteredMusicTracks = useMemo(() => {
    const query = musicSearchQuery.toLowerCase().trim();
    if (!query) return ROYALTY_FREE_AUDIO_TRACKS;
    return ROYALTY_FREE_AUDIO_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.artist.toLowerCase().includes(query) ||
        (t.genre && t.genre.toLowerCase().includes(query))
    );
  }, [musicSearchQuery]);

  // Suggested users for mention tag
  const suggestedUsers = useMemo(() => {
    const query = tagInputValue.toLowerCase().replace(/^@/, '');
    if (!query) return users.slice(0, 6);
    return users
      .filter(
        (u) =>
          u.username.toLowerCase().includes(query) ||
          u.name.toLowerCase().includes(query)
      )
      .slice(0, 6);
  }, [users, tagInputValue]);

  if (!isOpen || !activeMediaUrl) return null;

  return (
    <div
      id="loksy-story-editor-modal"
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between select-none overflow-hidden touch-none"
    >
      {/* 9:16 Mobile-First Canvas Container */}
      <div className="relative w-full h-full max-w-md mx-auto flex flex-col items-center justify-between bg-black overflow-hidden shadow-2xl">
        
        {/* Top Action Bar */}
        <div className="w-full flex items-center justify-between px-4 py-3 z-30 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
          {/* Back/Retake Button */}
          <button
            type="button"
            id="story-editor-retake-btn"
            onClick={onRetake}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md text-white text-xs font-semibold active:scale-95 transition-all cursor-pointer border border-white/15"
            title="Retake (Back to Camera)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retake</span>
          </button>

          {/* Editor Tool Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Sound Mute/Unmute Toggle (Video or Attached Music) */}
            <button
              type="button"
              id="story-editor-sound-btn"
              onClick={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                showToast(nextMuted ? 'Sound muted' : 'Sound unmuted');
              }}
              className="p-2 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md text-white active:scale-90 transition-all cursor-pointer border border-white/15"
              title={isMuted ? 'Unmute Story Sound' : 'Mute Story Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Interactive Text Tool */}
            <button
              type="button"
              id="story-editor-text-btn"
              onClick={openTextEditor}
              className={`p-2 rounded-full backdrop-blur-md text-white active:scale-90 transition-all cursor-pointer border border-white/15 ${
                textItem.text ? 'bg-[#0095F6] border-[#0095F6]' : 'bg-black/50 hover:bg-black/75'
              }`}
              title="Add / Edit Text"
            >
              <Type className="w-4 h-4" />
            </button>

            {/* Interactive Sticker Tray Toggle */}
            <button
              type="button"
              id="story-editor-sticker-btn"
              onClick={() => setShowStickerTray((prev) => !prev)}
              className={`p-2 rounded-full backdrop-blur-md text-white active:scale-90 transition-all cursor-pointer border border-white/15 ${
                showStickerTray || stickers.length > 0
                  ? 'bg-gradient-to-tr from-pink-600 to-amber-500 border-white/30 shadow-lg'
                  : 'bg-black/50 hover:bg-black/75'
              }`}
              title="Stickers & Tags"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Draw Tool Placeholder */}
            <button
              type="button"
              id="story-editor-draw-btn"
              onClick={() => showToast('Draw mode ready 🎨')}
              className="p-2 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md text-white active:scale-90 transition-all cursor-pointer border border-white/15"
              title="Draw Tool"
            >
              <PenTool className="w-4 h-4" />
            </button>

            {/* Music Tool Button (Opens Audio Picker) */}
            <button
              type="button"
              id="story-editor-music-btn"
              onClick={() => setShowMusicModal(true)}
              className={`p-2 rounded-full backdrop-blur-md text-white active:scale-90 transition-all cursor-pointer border border-white/15 ${
                selectedMusic
                  ? 'bg-gradient-to-tr from-[#FF007A] via-[#7928CA] to-[#0070F3] border-white/40 shadow-lg animate-pulse'
                  : 'bg-black/50 hover:bg-black/75'
              }`}
              title="Attach Music Audio"
            >
              <Music className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 9:16 Aspect Ratio Media Stage */}
        <div
          ref={stageRef}
          id="story-editor-stage"
          className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none"
        >
          {detectedMediaType === 'video' ? (
            <video
              ref={videoRef}
              src={activeMediaUrl}
              playsInline
              autoPlay
              loop
              muted={isMuted}
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : (
            <img
              src={activeMediaUrl}
              alt="Story Preview"
              className="w-full h-full object-cover pointer-events-none"
            />
          )}

          {/* Draggable Interactive Text Element */}
          {textItem.text && !isTextEditing && (
            <div
              id="story-editor-draggable-text"
              onPointerDown={handleTextPointerDown}
              onPointerMove={handleTextPointerMove}
              onPointerUp={handleTextPointerUp}
              onPointerCancel={handleTextPointerUp}
              style={{
                left: `${textItem.x}%`,
                top: `${textItem.y}%`,
                transform: 'translate(-50%, -50%)',
                color: textItem.highlightMode === 'solid' ? undefined : textItem.color,
                textAlign: textItem.textAlign,
                ...getSolidBackgroundStyle(textItem.color, textItem.highlightMode),
              }}
              className={`absolute z-30 cursor-grab active:cursor-grabbing select-none active:scale-105 transition-transform max-w-[85%] group ${getTextDisplayClasses(
                textItem.fontStyle,
                textItem.highlightMode
              )}`}
              title="Drag anywhere to position • Tap to edit"
            >
              <p className="text-xl md:text-2xl font-bold break-words leading-snug">
                {textItem.text}
              </p>

              {/* Subtle Drag Handle Indicator on Hover/Focus */}
              <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 bg-white/30 backdrop-blur-md rounded-full p-1 transition-opacity pointer-events-none">
                <Move className="w-3 h-3 text-white" />
              </div>
            </div>
          )}

          {/* DRAGGABLE ANIMATED MUSIC BADGE ON CANVAS */}
          {selectedMusic && (
            <div
              id="story-editor-draggable-music-badge"
              onPointerDown={handleMusicBadgePointerDown}
              onPointerMove={handleMusicBadgePointerMove}
              onPointerUp={handleMusicBadgePointerUp}
              onPointerCancel={handleMusicBadgePointerUp}
              style={{
                left: `${musicBadgePos.x}%`,
                top: `${musicBadgePos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-30 cursor-grab active:cursor-grabbing select-none group active:scale-105 transition-transform"
              title="Drag music badge anywhere • Tap to change track"
            >
              <div className="relative flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-black/75 hover:bg-black/85 backdrop-blur-xl border border-white/20 text-white shadow-2xl max-w-[240px]">
                {/* Album Cover Thumbnail */}
                <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/20 shadow-md">
                  <img
                    src={selectedMusic.coverUrl}
                    alt={selectedMusic.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Disc3 className="w-4 h-4 text-white/90 animate-spin" style={{ animationDuration: '4s' }} />
                  </div>
                </div>

                {/* Track Title & Artist */}
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-xs font-bold truncate text-white leading-tight">
                    {selectedMusic.title}
                  </p>
                  <p className="text-[10px] text-zinc-300 truncate">
                    {selectedMusic.artist}
                  </p>
                </div>

                {/* Animated Equalizer Wave Bars */}
                <div className="flex items-end gap-0.5 h-3.5 px-0.5 shrink-0" title="Audio playing">
                  <span className="w-0.5 bg-[#00E5FF] rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-full" />
                  <span className="w-0.5 bg-[#00E5FF] rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.2s] h-2/3" />
                  <span className="w-0.5 bg-[#00E5FF] rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.4s] h-4/5" />
                  <span className="w-0.5 bg-[#00E5FF] rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.1s] h-1/2" />
                </div>

                {/* Remove Music Track Button on Hover */}
                <button
                  type="button"
                  onClick={handleRemoveMusicTrack}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer border border-white/20"
                  title="Remove music track"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Draggable Canvas Stickers & Tags */}
          {stickers.map((item) => (
            <div
              key={item.id}
              id={`story-sticker-${item.id}`}
              onPointerDown={(e) => handleStickerPointerDown(e, item.id)}
              onPointerMove={(e) => handleStickerPointerMove(e, item.id)}
              onPointerUp={(e) => handleStickerPointerUp(e, item.id)}
              onPointerCancel={(e) => handleStickerPointerUp(e, item.id)}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute z-30 cursor-grab active:cursor-grabbing select-none group transition-transform ${
                draggingStickerId === item.id ? 'scale-110 z-40' : 'hover:scale-105'
              }`}
              title="Drag anywhere • Tap 'X' to remove"
            >
              {item.type === 'emoji' && (
                <div className="relative p-1">
                  <span className="text-6xl drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)] block">
                    {item.content}
                  </span>
                  {/* Delete Button on Hover */}
                  <button
                    type="button"
                    onClick={(e) => removeStickerFromCanvas(item.id, e)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black/75 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
                    title="Remove sticker"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {item.type === 'mention' && (
                <div className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-black font-bold text-sm shadow-2xl border-2 border-[#FF4668]">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#FF8A00] to-[#FF4668] text-white flex items-center justify-center text-[10px] font-black">
                    @
                  </div>
                  <span className="tracking-tight">{item.content}</span>
                  <button
                    type="button"
                    onClick={(e) => removeStickerFromCanvas(item.id, e)}
                    className="ml-1 w-4 h-4 rounded-full bg-zinc-200 hover:bg-red-500 hover:text-white flex items-center justify-center text-zinc-600 transition-colors cursor-pointer"
                    title="Remove mention"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}

              {item.type === 'location' && (
                <div className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white font-bold text-sm shadow-2xl border border-white/25">
                  <MapPin className="w-4 h-4 text-[#00E5FF] shrink-0 animate-pulse" />
                  <span className="truncate max-w-[200px] tracking-tight">{item.content}</span>
                  <button
                    type="button"
                    onClick={(e) => removeStickerFromCanvas(item.id, e)}
                    className="ml-1 w-4 h-4 rounded-full bg-white/20 hover:bg-red-500 flex items-center justify-center text-white transition-colors cursor-pointer"
                    title="Remove location"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* ============================================================ */}
          {/* AUDIO PICKER MODAL (ROYALTY-FREE TRACKS)                     */}
          {/* ============================================================ */}
          {showMusicModal && (
            <div
              id="story-editor-music-modal"
              className="absolute inset-0 bg-black/90 backdrop-blur-xl z-50 flex flex-col justify-between p-4 animate-fade-in"
            >
              {/* Header */}
              <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF007A] to-[#7928CA] flex items-center justify-center text-white shadow-md">
                    <Music className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm leading-tight">Add Music to Story</h3>
                    <p className="text-[10px] text-zinc-400">Royalty-Free & Licensed Desi Audio</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMusicModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="my-3">
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 focus-within:border-[#0095F6] transition-colors">
                  <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    type="text"
                    value={musicSearchQuery}
                    onChange={(e) => setMusicSearchQuery(e.target.value)}
                    placeholder="Search songs, artists, or genres..."
                    className="w-full bg-transparent border-none outline-none text-white text-xs placeholder:text-zinc-500"
                  />
                  {musicSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMusicSearchQuery('')}
                      className="text-zinc-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Currently Selected Track Info Banner if any */}
              {selectedMusic && (
                <div className="mb-2 p-2.5 rounded-xl bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={selectedMusic.coverUrl}
                      alt={selectedMusic.title}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block">
                        Attached Track
                      </span>
                      <p className="text-xs font-bold text-white truncate">{selectedMusic.title}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveMusicTrack}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-red-500/80 text-white text-[10px] font-bold transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Tracks List */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[58vh]">
                {filteredMusicTracks.map((track) => {
                  const isCurrent = selectedMusic?.id === track.id;
                  const isPreviewPlaying = previewPlayingTrackId === track.id;

                  return (
                    <div
                      key={track.id}
                      onClick={() => handleSelectMusicTrack(track)}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border ${
                        isCurrent
                          ? 'bg-purple-600/25 border-purple-500/60 shadow-lg'
                          : 'bg-white/5 hover:bg-white/10 border-white/10'
                      }`}
                    >
                      {/* Left: Cover & Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/15">
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                          {/* Play / Pause Preview Button */}
                          <button
                            type="button"
                            onClick={(e) => handleTogglePreviewPlay(track, e)}
                            className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                            title={isPreviewPlaying ? 'Pause preview' : 'Play preview'}
                          >
                            {isPreviewPlaying ? (
                              <Pause className="w-4 h-4 fill-white text-white" />
                            ) : (
                              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                            )}
                          </button>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-white truncate">{track.title}</p>
                            {isCurrent && (
                              <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                          <span className="inline-block mt-0.5 text-[9px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                            {track.genre || 'Royalty-Free'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Select Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isCurrent ? (
                          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow-md">
                            <Check className="w-3.5 h-3.5" />
                            <span>Attached</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectMusicTrack(track);
                            }}
                            className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white text-white hover:text-black text-xs font-bold transition-all active:scale-95"
                          >
                            Use
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredMusicTracks.length === 0 && (
                  <div className="py-12 text-center text-zinc-500 text-xs">
                    No tracks found matching "{musicSearchQuery}"
                  </div>
                )}
              </div>

              {/* Modal Footer Note */}
              <div className="pt-2 text-center text-[10px] text-zinc-500">
                Tap track to attach to story • Previews play in 30-second clips
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* INTERACTIVE STICKER TRAY (BOTTOM SHEET)                      */}
          {/* ============================================================ */}
          {showStickerTray && (
            <div
              id="story-editor-sticker-tray"
              className="absolute inset-x-0 bottom-0 max-h-[78%] rounded-t-3xl bg-zinc-950/95 backdrop-blur-2xl border-t border-white/15 p-4 z-40 shadow-2xl flex flex-col transition-all animate-fade-in"
            >
              {/* Bottom Sheet Pull Handle */}
              <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-3" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-white text-sm font-bold">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>Stickers & Interactive Tags</span>
                </div>
                <button
                  type="button"
                  id="story-editor-close-sticker-tray-btn"
                  onClick={() => setShowStickerTray(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* INTERACTIVE TAGS ROW */}
              <div className="mb-4">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                  Interactive Tags
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* @Mention Tag Button */}
                  <button
                    type="button"
                    id="sticker-tag-mention-btn"
                    onClick={() => {
                      setShowStickerTray(false);
                      setTagInputValue('');
                      setActiveTagDialog('mention');
                    }}
                    className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-gradient-to-r from-[#FF8A00]/20 to-[#FF4668]/20 hover:from-[#FF8A00]/30 hover:to-[#FF4668]/30 border border-[#FF4668]/40 text-white font-bold text-xs shadow-md active:scale-95 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#FF8A00] to-[#FF4668] text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
                      <AtSign className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-sm font-extrabold text-white">@ MENTION</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Tag friends in story</span>
                    </div>
                  </button>

                  {/* 📍 Location Tag Button */}
                  <button
                    type="button"
                    id="sticker-tag-location-btn"
                    onClick={() => {
                      setShowStickerTray(false);
                      setTagInputValue('');
                      setActiveTagDialog('location');
                    }}
                    className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-gradient-to-r from-[#0095F6]/20 to-[#00E5FF]/20 hover:from-[#0095F6]/30 hover:to-[#00E5FF]/30 border border-[#0095F6]/40 text-white font-bold text-xs shadow-md active:scale-95 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#0095F6] to-[#00E5FF] text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-sm font-extrabold text-white">📍 LOCATION</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Add city or venue</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* EMOJI STICKERS GRID */}
              <div className="flex-1 overflow-y-auto">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                  Popular Story Stickers
                </label>
                <div className="grid grid-cols-6 gap-2 text-center pb-2">
                  {RICH_EMOJI_PRESETS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => addStickerToCanvas('emoji', emoji)}
                      className="text-3xl p-2 rounded-2xl hover:bg-white/10 active:scale-125 transition-transform cursor-pointer flex items-center justify-center select-none"
                      title={`Add ${emoji}`}
                    >
                      <span>{emoji}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* QUICK INPUT DIALOG FOR TAGS (@MENTION / 📍LOCATION)         */}
          {/* ============================================================ */}
          {activeTagDialog && (
            <div
              id="story-editor-tag-modal"
              className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-between p-5 animate-fade-in"
            >
              {/* Header */}
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeTagDialog === 'mention' ? (
                    <AtSign className="w-5 h-5 text-[#FF4668]" />
                  ) : (
                    <MapPin className="w-5 h-5 text-[#00E5FF]" />
                  )}
                  <span className="text-white font-bold text-sm">
                    {activeTagDialog === 'mention' ? 'Mention Someone' : 'Add Location'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTagDialog(null)}
                    className="p-1.5 text-zinc-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    id="story-tag-done-btn"
                    onClick={confirmTagDialog}
                    className="px-4 py-1.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    Done
                  </button>
                </div>
              </div>

              {/* Input Area */}
              <div className="w-full max-w-sm my-auto flex flex-col items-center">
                <div className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md shadow-inner">
                  {activeTagDialog === 'mention' ? (
                    <span className="text-xl font-black text-[#FF4668]">@</span>
                  ) : (
                    <MapPin className="w-5 h-5 text-[#00E5FF] shrink-0" />
                  )}
                  <input
                    type="text"
                    autoFocus
                    value={tagInputValue}
                    onChange={(e) => setTagInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        confirmTagDialog();
                      }
                    }}
                    placeholder={
                      activeTagDialog === 'mention'
                        ? 'Type username...'
                        : 'Search city or place...'
                    }
                    className="w-full bg-transparent border-none outline-none text-white text-lg font-bold placeholder:text-zinc-500"
                  />
                </div>

                {/* Suggestions Pills */}
                {activeTagDialog === 'mention' ? (
                  <div className="w-full mt-4 flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                    <span className="text-[11px] text-zinc-400 font-semibold uppercase px-1">
                      Suggested Creators
                    </span>
                    {suggestedUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          addStickerToCanvas('mention', `@${u.username}`);
                          setActiveTagDialog(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors cursor-pointer"
                      >
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover border border-white/20"
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold text-white leading-none">@{u.username}</p>
                          <p className="text-[10px] text-zinc-400">{u.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="w-full mt-4">
                    <span className="text-[11px] text-zinc-400 font-semibold uppercase block mb-2 px-1">
                      Popular Locations
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
                      {POPULAR_LOCATIONS.map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => {
                            addStickerToCanvas('location', loc);
                            setActiveTagDialog(null);
                          }}
                          className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-colors cursor-pointer"
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full text-center pb-2 text-[11px] text-zinc-500">
                Press Enter or tap Done to add tag to story
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* FULL INTERACTIVE TEXT TOOL OVERLAY                           */}
          {/* ============================================================ */}
          {isTextEditing && (
            <div
              id="story-editor-text-overlay-modal"
              className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-between p-4 animate-fade-in"
            >
              {/* Modal Header Controls */}
              <div className="w-full flex items-center justify-between pt-2">
                {/* Formatting Controls: Text Align & Background Highlight */}
                <div className="flex items-center gap-2">
                  {/* Text Align Toggle */}
                  <button
                    type="button"
                    onClick={cycleTextAlign}
                    className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white active:scale-95 transition-all cursor-pointer"
                    title={`Align: ${stagedTextAlign}`}
                  >
                    {stagedTextAlign === 'left' ? (
                      <AlignLeft className="w-4 h-4" />
                    ) : stagedTextAlign === 'right' ? (
                      <AlignRight className="w-4 h-4" />
                    ) : (
                      <AlignCenter className="w-4 h-4" />
                    )}
                  </button>

                  {/* Background Highlight Mode Toggle (none / solid / soft) */}
                  <button
                    type="button"
                    onClick={cycleHighlightMode}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      stagedHighlightMode === 'solid'
                        ? 'bg-white text-black border-white'
                        : stagedHighlightMode === 'soft'
                        ? 'bg-white/20 text-white border-white/40 backdrop-blur-md'
                        : 'bg-transparent text-white border-white/20 hover:bg-white/10'
                    }`}
                    title="Highlight style: None, Solid, or Translucent"
                  >
                    <span className="font-extrabold font-serif">A</span>
                    <span className="text-[10px] uppercase font-mono tracking-wider">
                      {stagedHighlightMode}
                    </span>
                  </button>
                </div>

                {/* Done Confirm Button */}
                <button
                  type="button"
                  id="story-editor-text-done-btn"
                  onClick={confirmTextEditor}
                  className="px-5 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 active:scale-95 transition-all shadow-lg cursor-pointer"
                >
                  Done
                </button>
              </div>

              {/* Text Input Center Area */}
              <div className="w-full my-auto flex flex-col items-center justify-center px-4">
                <div
                  className={`w-full max-w-sm rounded-2xl transition-all ${
                    stagedHighlightMode === 'soft'
                      ? 'bg-black/60 backdrop-blur-md border border-white/20 p-4'
                      : stagedHighlightMode === 'solid'
                      ? 'p-4 rounded-xl'
                      : 'p-2'
                  }`}
                  style={getSolidBackgroundStyle(stagedColor, stagedHighlightMode)}
                >
                  <input
                    type="text"
                    autoFocus
                    value={stagedText}
                    onChange={(e) => setStagedText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        confirmTextEditor();
                      }
                    }}
                    placeholder="Type something..."
                    className={`w-full bg-transparent border-none outline-none text-2xl md:text-3xl font-bold placeholder:text-zinc-500 ${
                      FONT_STYLES.find((f) => f.id === stagedFontStyle)?.sampleClass || ''
                    }`}
                    style={{
                      color: stagedHighlightMode === 'solid' ? undefined : stagedColor,
                      textAlign: stagedTextAlign,
                    }}
                  />
                </div>
              </div>

              {/* Bottom Formatting Toolbar: Font Styles & Colors */}
              <div className="w-full flex flex-col gap-3 pb-4">
                {/* Font Style Pills Carousel */}
                <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 px-2 no-scrollbar">
                  {FONT_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setStagedFontStyle(style.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        stagedFontStyle === style.id
                          ? 'bg-white text-black shadow-md scale-105'
                          : 'bg-white/15 text-white/80 hover:bg-white/25 hover:text-white'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>

                {/* Color Swatches */}
                <div className="flex items-center justify-center gap-2.5 overflow-x-auto py-1 px-2 no-scrollbar">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setStagedColor(c)}
                      className={`w-7 h-7 rounded-full shrink-0 border-2 transition-transform cursor-pointer ${
                        stagedColor === c
                          ? 'scale-125 border-white shadow-md'
                          : 'border-white/20 hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ephemeral Toast Notification */}
          {activeToolToast && (
            <div className="absolute top-20 px-4 py-1.5 rounded-full bg-white/90 text-black text-xs font-semibold shadow-lg backdrop-blur-sm animate-fade-in pointer-events-none z-40">
              {activeToolToast}
            </div>
          )}
        </div>

        {/* Bottom Bar: Discard & Instagram-Style 'Your Story' / Next */}
        <div className="w-full px-4 py-4 z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex items-center justify-between gap-3">
          
          {/* Discard Button */}
          <button
            type="button"
            id="story-editor-discard-btn"
            onClick={handleDiscard}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold transition-all cursor-pointer border border-white/15 shrink-0"
            title="Discard Story"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">Discard</span>
          </button>

          {/* Actions: 'Your Story' & 'Next' */}
          <div className="flex items-center gap-2.5">
            {/* Instagram-Style 'Your Story' Button */}
            <button
              type="button"
              id="story-editor-publish-your-story-btn"
              onClick={handlePublishStory}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md active:scale-95 transition-all cursor-pointer group"
              title="Share instantly to Your Story"
            >
              <div className="relative w-6 h-6 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0">
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="text-white text-xs font-bold tracking-tight">Your Story</span>
            </button>

            {/* Bright Next Button */}
            <button
              type="button"
              id="story-editor-next-btn"
              onClick={handlePublishStory}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-white text-black hover:bg-zinc-100 font-bold text-xs shadow-lg active:scale-95 transition-transform cursor-pointer shrink-0"
              title="Publish Story"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, X, AlertCircle, Check, Video, Camera, Image as ImageIcon } from 'lucide-react';

export interface StoryCameraProps {
  isOpen: boolean;
  onClose: () => void;
  onCapturePhoto?: (dataUrl: string) => void;
  onCaptureVideo?: (videoBlob: Blob) => void;
}

const MAX_RECORD_SECONDS = 15;
const LONG_PRESS_THRESHOLD_MS = 300;

export const StoryCamera: React.FC<StoryCameraProps> = ({
  isOpen,
  onClose,
  onCapturePhoto,
  onCaptureVideo,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordProgress, setRecordProgress] = useState<number>(0); // 0 to 100
  const [recordDurationSeconds, setRecordDurationSeconds] = useState<number>(0);

  const longPressTimerRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const recordStartTimeRef = useRef<number | null>(null);
  const isPressingRef = useRef<boolean>(false);
  const hasStartedRecordingRef = useRef<boolean>(false);
  const isTouchRef = useRef<boolean>(false);

  const stopCamera = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (recordingIntervalRef.current) {
      window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsRecording(false);
    setRecordProgress(0);
    setRecordDurationSeconds(0);
    isPressingRef.current = false;
    hasStartedRecordingRef.current = false;
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCapturedPhoto(null);
    setIsRecording(false);
    setRecordProgress(0);
    setRecordDurationSeconds(0);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: true,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback without audio constraint if microphone is unavailable or blocked
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } },
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setHasPermission(true);
      setErrorMsg('');
    } catch (err: unknown) {
      console.error('Camera stream error:', err);
      setHasPermission(false);
      const errorObj = err as { name?: string };
      if (errorObj?.name === 'NotAllowedError' || errorObj?.name === 'PermissionDeniedError') {
        setErrorMsg('Camera and microphone permissions were denied. Please allow access in browser settings.');
      } else if (errorObj?.name === 'NotFoundError' || errorObj?.name === 'DevicesNotFoundError') {
        setErrorMsg('No camera or microphone device found on this device.');
      } else {
        setErrorMsg('Unable to access camera. Please check device permissions and try again.');
      }
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedPhoto(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // 1. Shutter Action: Take Photo via Canvas
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror user-facing camera capture
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    if (onCapturePhoto) {
      onCapturePhoto(dataUrl);
      onClose();
    } else {
      setCapturedPhoto(dataUrl);
    }
  }, [facingMode, onCapturePhoto, onClose]);

  // 2. Stop Video Recording
  const stopRecording = useCallback(() => {
    if (recordingIntervalRef.current) {
      window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping MediaRecorder:', err);
      }
    }
    setIsRecording(false);
    setRecordProgress(0);
    setRecordDurationSeconds(0);
  }, []);

  // 2. Start Video Recording
  const startRecording = useCallback(() => {
    if (!streamRef.current || isRecording) return;
    recordedChunksRef.current = [];

    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : 'video/webm';

      const recorder = new MediaRecorder(streamRef.current, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        if (onCaptureVideo) {
          onCaptureVideo(blob);
          onClose();
        }
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      recordStartTimeRef.current = Date.now();

      // Progress animation & 15s max limit
      recordingIntervalRef.current = window.setInterval(() => {
        if (!recordStartTimeRef.current) return;
        const elapsed = (Date.now() - recordStartTimeRef.current) / 1000;
        const progress = Math.min(100, (elapsed / MAX_RECORD_SECONDS) * 100);
        setRecordProgress(progress);
        setRecordDurationSeconds(Math.min(MAX_RECORD_SECONDS, elapsed));

        if (elapsed >= MAX_RECORD_SECONDS) {
          stopRecording();
        }
      }, 50);
    } catch (err) {
      console.error('Failed to start MediaRecorder:', err);
      setIsRecording(false);
      hasStartedRecordingRef.current = false;
    }
  }, [isRecording, onCaptureVideo, onClose, stopRecording]);

  // Handle Shutter Press Start (Touch or Mouse, 300ms threshold)
  const handleShutterStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasPermission === false || capturedPhoto) return;
    if (isPressingRef.current) return;

    isPressingRef.current = true;
    hasStartedRecordingRef.current = false;

    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // 300ms hold -> Start Video Recording
    longPressTimerRef.current = window.setTimeout(() => {
      if (isPressingRef.current) {
        hasStartedRecordingRef.current = true;
        startRecording();
      }
    }, LONG_PRESS_THRESHOLD_MS);
  }, [hasPermission, capturedPhoto, startRecording]);

  // Handle Shutter Press Release (Touch or Mouse)
  const handleShutterEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isPressingRef.current) return;
    isPressingRef.current = false;

    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Check if recording is in progress or was triggered
    if (isRecording || hasStartedRecordingRef.current || (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording')) {
      stopRecording();
    } else {
      // Tap (< 300ms threshold) -> Take photo
      takePhoto();
    }
    hasStartedRecordingRef.current = false;
  }, [isRecording, stopRecording, takePhoto]);

  // Handle Press Cancel (Touch Cancel or Mouse Leave)
  const handleShutterCancel = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isPressingRef.current) return;
    isPressingRef.current = false;

    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isRecording || hasStartedRecordingRef.current || (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording')) {
      stopRecording();
    }
    hasStartedRecordingRef.current = false;
  }, [isRecording, stopRecording]);

  // Handle file selection from phone gallery
  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      stopCamera();
      if (onCaptureVideo) {
        onCaptureVideo(file);
      }
      onClose();
    } else {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string;
        if (result && onCapturePhoto) {
          stopCamera();
          onCapturePhoto(result);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset file input value to allow re-selecting same file
    e.target.value = '';
  };

  if (!isOpen) return null;

  // SVG circular ring calculations (15-second progress)
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (recordProgress / 100) * ringCircumference;

  return (
    <div
      id="loksy-story-camera-overlay"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between select-none overflow-hidden touch-none"
      style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
    >
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between px-4 py-3 z-30 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        <button
          type="button"
          id="camera-close-btn"
          onClick={onClose}
          className="p-2.5 text-white bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full active:scale-90 transition-all cursor-pointer border border-white/15"
          title="Close Camera"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {isRecording ? (
            <div
              id="camera-recording-badge"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/90 border border-red-400/40 text-white text-xs font-mono font-bold shadow-lg shadow-red-600/40 animate-pulse"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
              </span>
              <span>{recordDurationSeconds.toFixed(1)}s / 15.0s</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md text-white text-xs font-semibold tracking-wider uppercase shadow-md">
              <Camera className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>LOKSY Camera</span>
            </div>
          )}
        </div>

        <button
          type="button"
          id="camera-flip-btn"
          onClick={toggleFacingMode}
          disabled={Boolean(capturedPhoto) || isRecording}
          className="p-2.5 text-white bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full active:scale-90 transition-all cursor-pointer border border-white/15 disabled:opacity-30 disabled:pointer-events-none"
          title="Flip Camera (Front/Back)"
        >
          <RefreshCw className={`w-5 h-5 ${isRecording ? 'opacity-30' : ''}`} />
        </button>
      </div>

      {/* 9:16 Camera Viewfinder Stage */}
      <div className="relative w-full h-full flex items-center justify-center bg-zinc-950 overflow-hidden">
        {/* Top 15-Second Recording Progress Bar */}
        {isRecording && (
          <div className="absolute top-0 inset-x-0 h-1.5 bg-white/20 z-40">
            <div
              className="h-full bg-gradient-to-r from-red-500 via-rose-500 to-red-600 transition-all duration-75 ease-linear shadow-[0_0_10px_rgba(239,68,68,0.8)]"
              style={{ width: `${recordProgress}%` }}
            />
          </div>
        )}

        {/* Screen Center/Corner Blinking RED DOT while recording */}
        {isRecording && (
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-red-500/40 text-white shadow-xl animate-fade-in">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600 shadow-[0_0_8px_#ef4444]" />
            </span>
            <span className="text-[11px] font-bold tracking-widest text-red-400 uppercase">REC</span>
          </div>
        )}

        {hasPermission === false ? (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm text-white z-20">
            <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4 shadow-lg shadow-red-500/10">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-base font-bold mb-2">Camera & Mic Access Required</h3>
            <p className="text-xs text-zinc-300 mb-5 leading-relaxed">{errorMsg}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="camera-retry-btn"
                onClick={startCamera}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 via-pink-600 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white rounded-full text-xs font-bold shadow-xl active:scale-95 transition-transform cursor-pointer"
              >
                Allow & Try Again
              </button>
              <button
                type="button"
                id="camera-perm-gallery-btn"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-full text-xs font-bold shadow-xl active:scale-95 transition-transform cursor-pointer flex items-center gap-1.5"
                title="Pick Photo or Video from Gallery"
              >
                <ImageIcon className="w-4 h-4 text-pink-400" />
                <span>Gallery</span>
              </button>
            </div>
          </div>
        ) : capturedPhoto ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img
              src={capturedPhoto}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />
          </div>
        )}
      </div>

      {/* Bottom Shutter Dock & Progress Indicator */}
      <div className="w-full pb-8 pt-4 flex flex-col items-center justify-center z-30 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        {capturedPhoto ? (
          <div className="flex items-center gap-6">
            <button
              type="button"
              id="camera-retake-btn"
              onClick={() => setCapturedPhoto(null)}
              className="px-6 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold backdrop-blur-md active:scale-95 transition-all cursor-pointer border border-white/20"
            >
              Retake
            </button>
            <button
              type="button"
              id="camera-use-photo-btn"
              onClick={() => {
                if (capturedPhoto && onCapturePhoto) {
                  onCapturePhoto(capturedPhoto);
                  onClose();
                }
              }}
              className="px-7 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-600 hover:opacity-90 text-white text-xs font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Use Photo</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full">
            {/* Hidden File Input for Phone Gallery selection */}
            <input
              ref={fileInputRef}
              type="file"
              id="story-camera-gallery-input"
              accept="image/*,video/*"
              onChange={handleGalleryFileChange}
              className="hidden"
            />

            {/* Bottom Controls Row: Gallery Button | Shutter Button | Flip Button */}
            <div className="w-full max-w-xs flex items-center justify-between px-3">
              {/* Phone Gallery Picker Button */}
              <button
                type="button"
                id="camera-gallery-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isRecording}
                className="flex flex-col items-center gap-1 group p-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                title="Choose Photo or Video from Gallery"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500/25 via-pink-500/25 to-purple-500/25 border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:border-white/50 transition-colors">
                  <ImageIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-bold text-zinc-300 group-hover:text-white tracking-wide">
                  Gallery
                </span>
              </button>

              {/* Shutter Button with Animated 15s Progress Ring */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* Circular SVG 15-second Progress Ring */}
                <svg className="absolute inset-0 w-28 h-28 -rotate-90 pointer-events-none">
                  {/* Background Ring Track */}
                  <circle
                    cx="56"
                    cy="56"
                    r={ringRadius}
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth={isRecording ? '5' : '3'}
                    fill="none"
                  />
                  {/* Active Progress Ring */}
                  {isRecording && (
                    <circle
                      cx="56"
                      cy="56"
                      r={ringRadius}
                      stroke="#FF3040"
                      strokeWidth="5"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-75 ease-linear"
                    />
                  )}
                </svg>

                {/* Shutter Button Core (Touch & Mouse with ContextMenu prevention) */}
                <button
                  type="button"
                  id="camera-shutter-btn"
                  onTouchStart={(e) => {
                    isTouchRef.current = true;
                    handleShutterStart(e);
                  }}
                  onTouchEnd={(e) => {
                    handleShutterEnd(e);
                    setTimeout(() => {
                      isTouchRef.current = false;
                    }, 400);
                  }}
                  onTouchCancel={handleShutterCancel}
                  onTouchMove={(e) => {
                    // Prevent touch drag scrolling or browser context gesture
                    e.preventDefault();
                  }}
                  onMouseDown={(e) => {
                    if (isTouchRef.current) return;
                    if (e.button !== 0) return;
                    handleShutterStart(e);
                  }}
                  onMouseUp={(e) => {
                    if (isTouchRef.current) return;
                    handleShutterEnd(e);
                  }}
                  onMouseLeave={(e) => {
                    if (isTouchRef.current) return;
                    handleShutterCancel(e);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                  disabled={hasPermission === false}
                  style={{ touchAction: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}
                  className={`relative rounded-full flex items-center justify-center cursor-pointer select-none transition-all duration-200 outline-none ${
                    isRecording
                      ? 'w-18 h-18 bg-red-600 scale-110 shadow-2xl shadow-red-500/60 ring-4 ring-red-500/30'
                      : 'w-20 h-20 bg-white hover:bg-zinc-100 active:scale-95 shadow-xl'
                  } disabled:opacity-30 disabled:pointer-events-none`}
                  title="Tap for photo • Hold 300ms for 15s video"
                >
                  <div
                    className={`transition-all duration-200 ${
                      isRecording
                        ? 'w-6 h-6 bg-white rounded-md'
                        : 'w-16 h-16 rounded-full border-2 border-zinc-900/10'
                    }`}
                  />
                </button>
              </div>

              {/* Camera Flip Button */}
              <button
                type="button"
                id="camera-bottom-flip-btn"
                onClick={toggleFacingMode}
                disabled={isRecording || hasPermission === false}
                className="flex flex-col items-center gap-1 group p-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                title="Flip Front / Back Camera"
              >
                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:border-white/40 transition-colors">
                  <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                </div>
                <span className="text-[10px] font-bold text-zinc-300 group-hover:text-white tracking-wide">
                  Flip
                </span>
              </button>
            </div>

            {/* Instruction Tip */}
            <p className="text-[11px] text-zinc-400 font-medium tracking-wide">
              {isRecording ? (
                <span className="text-red-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  Recording video... Release finger to finish
                </span>
              ) : (
                'Tap shutter for photo • Hold for video • Or pick from Gallery'
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

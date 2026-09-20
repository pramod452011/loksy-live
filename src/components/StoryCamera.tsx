import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, X, AlertCircle, Check, Video, Camera } from 'lucide-react';

export interface StoryCameraProps {
  isOpen: boolean;
  onClose: () => void;
  onCapturePhoto?: (dataUrl: string) => void;
  onCaptureVideo?: (videoBlob: Blob) => void;
}

const MAX_RECORD_SECONDS = 15;
const LONG_PRESS_THRESHOLD_MS = 350;

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
    }
  }, [isRecording, onCaptureVideo, onClose, stopRecording]);

  // Handle Shutter Press (Tap for Photo, Long Press for Video)
  const handleShutterPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (hasPermission === false || capturedPhoto) return;

    isPressingRef.current = true;
    const startTime = Date.now();

    // Start long-press timer
    longPressTimerRef.current = window.setTimeout(() => {
      if (isPressingRef.current) {
        startRecording();
      }
    }, LONG_PRESS_THRESHOLD_MS);

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleShutterPointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!isPressingRef.current) return;
    isPressingRef.current = false;

    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isRecording) {
      // Stopped holding -> finish video recording
      stopRecording();
    } else {
      // Released before long-press threshold -> tap = capture photo
      takePhoto();
    }

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleShutterPointerCancel = () => {
    isPressingRef.current = false;
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isRecording) {
      stopRecording();
    }
  };

  if (!isOpen) return null;

  // SVG circular ring calculations
  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (recordProgress / 100) * ringCircumference;

  return (
    <div
      id="loksy-story-camera-overlay"
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between select-none overflow-hidden touch-none"
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
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/90 border border-red-400/30 text-white text-xs font-mono font-bold shadow-lg animate-pulse"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
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
        {hasPermission === false ? (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm text-white z-20">
            <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4 shadow-lg shadow-red-500/10">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-base font-bold mb-2">Camera & Mic Access Required</h3>
            <p className="text-xs text-zinc-300 mb-5 leading-relaxed">{errorMsg}</p>
            <button
              type="button"
              id="camera-retry-btn"
              onClick={startCamera}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 via-pink-600 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white rounded-full text-xs font-bold shadow-xl active:scale-95 transition-transform cursor-pointer"
            >
              Allow & Try Again
            </button>
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
          <div className="flex flex-col items-center gap-3">
            {/* Shutter Button with Animated 15s Progress Ring */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Circular SVG Progress Ring for Long-Press Recording */}
              <svg className="absolute inset-0 w-24 h-24 -rotate-90 pointer-events-none">
                {/* Background Ring Track */}
                <circle
                  cx="48"
                  cy="48"
                  r={ringRadius}
                  stroke="rgba(255, 255, 255, 0.25)"
                  strokeWidth={isRecording ? '5' : '3'}
                  fill="none"
                />
                {/* Active Progress Ring */}
                {isRecording && (
                  <circle
                    cx="48"
                    cy="48"
                    r={ringRadius}
                    stroke="#FF3040"
                    strokeWidth="5"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-75"
                  />
                )}
              </svg>

              {/* Shutter Button Core */}
              <button
                type="button"
                id="camera-shutter-btn"
                onPointerDown={handleShutterPointerDown}
                onPointerUp={handleShutterPointerUp}
                onPointerCancel={handleShutterPointerCancel}
                disabled={hasPermission === false}
                className={`relative rounded-full flex items-center justify-center cursor-pointer select-none transition-all duration-200 outline-none ${
                  isRecording
                    ? 'w-16 h-16 bg-red-600 scale-110 shadow-2xl shadow-red-500/50'
                    : 'w-18 h-18 bg-white hover:bg-zinc-100 active:scale-95 shadow-xl'
                } disabled:opacity-30 disabled:pointer-events-none`}
                title="Tap to take photo, Hold to record video (max 15s)"
              >
                <div
                  className={`transition-all duration-200 ${
                    isRecording
                      ? 'w-6 h-6 bg-white rounded-sm'
                      : 'w-14 h-14 rounded-full border-2 border-zinc-900/10'
                  }`}
                />
              </button>
            </div>

            {/* Instruction Tip */}
            <p className="text-[11px] text-zinc-400 font-medium tracking-wide">
              {isRecording ? (
                <span className="text-red-400 font-semibold">Recording... Release to finish</span>
              ) : (
                'Tap for photo • Hold for video (15s)'
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

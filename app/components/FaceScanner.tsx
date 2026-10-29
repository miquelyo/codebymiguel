'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

interface FaceScannerProps {
  onFaceDetected: (descriptor: Float32Array, imageBase64: string) => void;
  onCancel: () => void;
  title?: string;
  subtitle?: string;
}

export default function FaceScanner({
  onFaceDetected,
  onCancel,
  title = 'Verifikasi Biometrik Wajah',
  subtitle = 'Arahkan pandangan tepat ke kamera',
}: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isDetectingRef = useRef(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [statusText, setStatusText] = useState('Memuat model AI...');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  // Rotation preference: loaded from localStorage if user previously rotated
  const [rotation, setRotation] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('codebymiguel_camera_rotation');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if ([0, 90, 180, 270].includes(parsed)) return parsed;
      }
    }
    return 0;
  });
  const rotationRef = useRef<number>(rotation);

  const [validProgress, setValidProgress] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    rotationRef.current = rotation;
    if (typeof window !== 'undefined') {
      localStorage.setItem('codebymiguel_camera_rotation', String(rotation));
    }
  }, [rotation]);

  // ─── Stop Detection & Video ───────────────────────────────────

  const stopDetectionLoop = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    isDetectingRef.current = false;
  }, []);

  const stopVideo = useCallback(() => {
    stopDetectionLoop();
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
    setIsCameraActive(false);
  }, [stopDetectionLoop]);

  // ─── Image Capture Helper ─────────────────────────────────────

  const captureImage = (
    video: HTMLVideoElement,
    isUserFacing: boolean,
    rotDeg: number = 0
  ): string => {
    const canvas = document.createElement('canvas');
    const vW = video.videoWidth || 640;
    const vH = video.videoHeight || 480;

    const is90or270 = rotDeg === 90 || rotDeg === 270;
    canvas.width = is90or270 ? vH : vW;
    canvas.height = is90or270 ? vW : vH;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (rotDeg !== 0) {
        ctx.rotate((rotDeg * Math.PI) / 180);
      }
      if (isUserFacing) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, -vW / 2, -vH / 2, vW, vH);
      ctx.restore();
    }
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // ─── Detection Loop ───────────────────────────────────────────

  const startDetectionLoop = useCallback(() => {
    stopDetectionLoop();

    let validFrames = 0;
    let lastCenter = { x: 0, y: 0 };

    detectionIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || isDetectingRef.current) return;

      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      const displaySize = { width: video.videoWidth, height: video.videoHeight };

      if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
        faceapi.matchDimensions(canvas, displaySize);
      }

      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        isDetectingRef.current = true;

        const detectorOptions = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.45,
        });

        let detections: any = null;

        if (faceapi.nets.faceLandmark68TinyNet.isLoaded) {
          const landmarkTask = faceapi
            .detectSingleFace(video, detectorOptions)
            .withFaceLandmarks(true);

          if (faceapi.nets.faceRecognitionNet.isLoaded) {
            detections = await landmarkTask.withFaceDescriptor();
          } else {
            detections = await landmarkTask;
          }
        } else {
          detections = await faceapi.detectSingleFace(video, detectorOptions);
        }

        if (!videoRef.current) return;

        if (detections && canvasRef.current) {
          const resized = faceapi.resizeResults(detections, displaySize);
          faceapi.draw.drawDetections(canvasRef.current, resized);
          if (resized.landmarks) {
            faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
          }
        }

        if (!detections) {
          validFrames = 0;
          setValidProgress(0);
          setStatusText('Posisikan wajah Anda di dalam bingkai');
          return;
        }

        const box = detections.detection?.box || detections.box;
        if (!box) return;

        const score = detections.detection?.score ?? 0.8;
        if (score < 0.4) {
          validFrames = 0;
          setValidProgress(0);
          setStatusText('Wajah kurang jelas. Pastikan pencahayaan cukup.');
          return;
        }

        const faceWidthRatio = box.width / video.videoWidth;
        if (faceWidthRatio < 0.15) {
          validFrames = 0;
          setValidProgress(0);
          setStatusText('Wajah terlalu jauh. Mohon dekatkan ke kamera.');
          return;
        }

        const currCenter = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        const distance = Math.hypot(currCenter.x - lastCenter.x, currCenter.y - lastCenter.y);
        lastCenter = currCenter;

        const maxAllowedMove = Math.max(50, box.width * 0.28);
        if (validFrames > 0 && distance > maxAllowedMove) {
          validFrames = 0;
          setValidProgress(0);
          setStatusText('Anda bergerak. Harap diam sejenak dan tatap kamera.');
          return;
        }

        validFrames++;
        const targetFrames = 3;
        const progress = Math.min(validFrames / targetFrames, 1);
        setValidProgress(progress);

        if (validFrames < targetFrames) {
          setStatusText(`Wajah terdeteksi! Tahan posisi... (${validFrames}/${targetFrames})`);
          return;
        }

        setStatusText('Wajah terverifikasi! Memproses...');
        stopDetectionLoop();

        const imageBase64 = captureImage(video, facingMode === 'user', rotationRef.current);
        const descriptor = detections.descriptor || new Float32Array(128);

        stopVideo();
        onFaceDetected(descriptor, imageBase64);
      } catch (err) {
        console.error('Detection error:', err);
      } finally {
        isDetectingRef.current = false;
      }
    }, 350);
  }, [facingMode, onFaceDetected, stopDetectionLoop, stopVideo]);

  // ─── Camera MediaStream Setup ─────────────────────────────────

  const startCamera = useCallback(
    async (facing: 'user' | 'environment') => {
      stopVideo();
      setCameraError(null);
      setStatusText('Mengaktifkan kamera...');

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        const errorMsg =
          'Akses kamera membutuhkan koneksi aman (HTTPS). Pastikan situs dibuka dengan https://';
        setCameraError(errorMsg);
        setStatusText(errorMsg);
        return;
      }

      // Constraints with graceful fallbacks
      const constraintsList: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 720 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        {
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 640 },
          },
          audio: false,
        },
        {
          video: { facingMode: { ideal: facing } },
          audio: false,
        },
        {
          video: { facingMode: facing },
          audio: false,
        },
        { video: true, audio: false },
      ];

      let stream: MediaStream | null = null;
      let lastError: any = null;

      for (const constraints of constraintsList) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (err: any) {
          lastError = err;
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') break;
        }
      }

      if (!stream) {
        const msg =
          lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError'
            ? 'Izin kamera ditolak. Harap izinkan akses kamera di pengaturan browser.'
            : 'Kamera tidak ditemukan atau tidak dapat diakses.';
        setCameraError(msg);
        setStatusText(msg);
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.muted = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');

        try {
          await video.play();
        } catch {
          video.onloadedmetadata = () => {
            video.play().catch(console.warn);
          };
        }

        setIsCameraActive(true);
        setStatusText('Posisikan wajah Anda di dalam bingkai');
        startDetectionLoop();
      }
    },
    [startDetectionLoop, stopVideo]
  );

  // ─── Load AI Models ───────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ]);

        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL).catch((e) => {
          console.warn('Optional recognition model failed to load:', e);
        });

        if (isMounted) {
          setIsModelLoaded(true);
          startCamera(facingMode);
        }
      } catch (error) {
        console.error('Error loading face-api models', error);
        if (isMounted) {
          setIsModelLoaded(true);
          setStatusText('Modul AI otomatis tidak dapat dimuat. Anda dapat mengambil foto manual.');
          startCamera(facingMode);
        }
      }
    };

    loadModels();

    return () => {
      isMounted = false;
      stopVideo();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Camera Switch & Rotation ─────────────────────────────────

  const handleToggleCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleRotateCamera = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // ─── Manual Fallback Capture ──────────────────────────────────

  const handleManualCapture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    stopDetectionLoop();
    setStatusText('Mengambil foto...');
    const imageBase64 = captureImage(video, facingMode === 'user', rotationRef.current);
    stopVideo();
    onFaceDetected(new Float32Array(128), imageBase64);
  };

  // Shared video/canvas transform style:
  // scaleX(-1) mirror for selfie camera + rotation in degrees
  const transformCss = [
    facingMode === 'user' ? 'scaleX(-1)' : '',
    rotation !== 0 ? `rotate(${rotation}deg)` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const mediaStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transformOrigin: 'center center',
    transform: transformCss || undefined,
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4">
      <div className="bg-white border border-zinc-200 rounded-3xl p-4 sm:p-6 shadow-2xl max-w-md w-full relative overflow-y-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3.5 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="truncate">
              <h3
                className="text-sm sm:text-base font-bold text-zinc-900 truncate font-heading"
              >
                {title}
              </h3>
              <p className="text-[11px] text-zinc-500 truncate">{subtitle}</p>
            </div>
          </div>

          {/* Controls: Rotate, Flip, Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isCameraActive && (
              <>
                {/* Rotate Button (0, 90, 180, 270) */}
                <button
                  type="button"
                  onClick={handleRotateCamera}
                  className="p-2 sm:p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors flex items-center gap-1 text-xs font-semibold border border-zinc-200 cursor-pointer"
                  title={`Putar Kamera (Saat ini: ${rotation}°)`}
                >
                  <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="text-[10px] text-cyan-700 font-bold">{rotation}°</span>
                  <span className="hidden sm:inline">Putar</span>
                </button>

                {/* Flip Camera Button */}
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className="p-2 sm:p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors flex items-center gap-1 text-xs font-semibold border border-zinc-200 cursor-pointer"
                  title="Ganti Kamera Depan/Belakang"
                >
                  <svg className="w-4 h-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  <span className="hidden sm:inline">Ganti</span>
                </button>
              </>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                stopVideo();
                onCancel();
              }}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Tutup"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Video & Scanner Container */}
        <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden mb-3 border border-indigo-500/30 shadow-inner flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            webkit-playsinline="true"
            style={mediaStyle}
            className="z-10"
          />
          <canvas
            ref={canvasRef}
            style={{ ...mediaStyle, pointerEvents: 'none' }}
            className="z-20"
          />

          {/* Futuristic laser scanline */}
          <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06b6d4] animate-laser z-25 pointer-events-none" />

          {/* Silhouette Face Guide Oval */}
          {isCameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-25">
              <div
                className={`w-38 h-48 sm:w-50 sm:h-64 rounded-[50%] border-2 transition-all duration-300 ${
                  validProgress > 0
                    ? 'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.7)] scale-102 bg-emerald-500/10'
                    : 'border-cyan-400/50 border-dashed shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                }`}
              />
            </div>
          )}

          {/* Loading or Error Overlay */}
          {(!isModelLoaded || !isCameraActive) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xs p-6 z-30 text-center">
              {cameraError ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-rose-600 font-medium max-w-xs">{cameraError}</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                  <span className="text-xs font-medium text-zinc-500 animate-pulse">{statusText}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Rotation quick hint */}
        {rotation !== 0 && (
          <p className="text-[10px] text-cyan-600 font-semibold text-center mb-2">
            Orientasi disesuaikan: {rotation}° (Tersimpan otomatis)
          </p>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className="bg-emerald-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${validProgress * 100}%` }}
          />
        </div>

        {/* Status Text Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4 px-2 py-2 rounded-xl bg-zinc-50 border border-zinc-100 text-center">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              validProgress > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <p className="text-xs font-medium text-zinc-700 truncate">{statusText}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isCameraActive && (
            <button
              type="button"
              onClick={handleManualCapture}
              className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <circle cx="12" cy="13" r="3" strokeWidth={2} />
              </svg>
              <span>Ambil Foto Manual</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              stopVideo();
              onCancel();
            }}
            className="py-2.5 px-5 rounded-xl bg-zinc-100 text-zinc-600 hover:text-zinc-900 font-semibold hover:bg-zinc-200 transition-colors text-xs cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

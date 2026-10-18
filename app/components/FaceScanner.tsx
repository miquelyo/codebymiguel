'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

interface FaceScannerProps {
  onFaceDetected: (descriptor: Float32Array, imageBase64: string) => void;
  onCancel: () => void;
}

export default function FaceScanner({ onFaceDetected, onCancel }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isDetectingRef = useRef(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [statusText, setStatusText] = useState('Memuat model AI...');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [validProgress, setValidProgress] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

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

  const captureImage = (video: HTMLVideoElement, isUserFacing: boolean): string => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (isUserFacing) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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

      // Ensure video frame is ready and has valid dimensions
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

        // Use TinyFaceDetector: ultra-lightweight & fast for mobile devices
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

        // Draw bounding box & landmarks
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

        // Confidence check
        const score = detections.detection?.score ?? 0.8;
        if (score < 0.4) {
          validFrames = 0;
          setValidProgress(0);
          setStatusText('Wajah kurang jelas. Pastikan pencahayaan cukup.');
          return;
        }

        // Distance check (relative to video width to support 9:16 portrait on mobile)
        const faceWidthRatio = box.width / video.videoWidth;
        if (faceWidthRatio < 0.15) {
          validFrames = 0;
          setValidProgress(0);
          setStatusText('Wajah terlalu jauh. Mohon dekatkan ke kamera.');
          return;
        }

        // Movement check: forgiving for natural handheld phone shake
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

        // Complete & Capture
        setStatusText('Wajah terverifikasi! Memproses absensi...');
        stopDetectionLoop();

        const imageBase64 = captureImage(video, facingMode === 'user');
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

      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = 'Akses kamera membutuhkan koneksi aman (HTTPS). Pastikan situs dibuka dengan https://';
        setCameraError(errorMsg);
        setStatusText(errorMsg);
        return;
      }

      // Constraints cascade to guarantee camera starts across any mobile device
      const constraintsList: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        },
        {
          video: { facingMode: facing },
          audio: false,
        },
        {
          video: { facingMode: { ideal: facing } },
          audio: false,
        },
        {
          video: true,
          audio: false,
        },
      ];

      let stream: MediaStream | null = null;
      let lastError: any = null;

      for (const constraints of constraintsList) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (err: any) {
          lastError = err;
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            break;
          }
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
          // Play might require loadedmetadata on some mobile devices
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
        // Tiny Face Detector + Tiny Landmarks (loads in ~270KB total, lightning fast on mobile)
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ]);

        // Background load recognition if available without blocking camera preview
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
          // Still allow camera to start so manual capture can be used
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
  }, []); // Run once on mount

  // ─── Camera Switch ────────────────────────────────────────────

  const handleToggleCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // ─── Manual Fallback Capture ──────────────────────────────────

  const handleManualCapture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    stopDetectionLoop();
    setStatusText('Mengambil foto...');
    const imageBase64 = captureImage(video, facingMode === 'user');
    stopVideo();
    onFaceDetected(new Float32Array(128), imageBase64);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-background/80 backdrop-blur-md p-3 sm:p-4">
      <div className="glass-panel border border-border/80 rounded-3xl p-4 sm:p-6 shadow-2xl max-w-md w-full relative overflow-y-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-3">
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
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                Verifikasi Biometrik Wajah
              </h3>
              <p className="text-[11px] text-muted">Arahkan pandangan tepat ke kamera</p>
            </div>
          </div>

          {/* Camera Flip Button */}
          {isCameraActive && (
            <button
              type="button"
              onClick={handleToggleCamera}
              className="p-2 sm:p-2.5 rounded-xl bg-surface-hover hover:bg-border text-foreground transition-colors flex items-center gap-1.5 text-xs font-semibold border border-border/80 cursor-pointer shrink-0"
              title="Ganti Kamera Depan/Belakang"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">Ganti</span>
            </button>
          )}
        </div>

        {/* Video & Scanner Container */}
        <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden mb-3 border border-indigo-500/30 shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            webkit-playsinline="true"
            className={`w-full h-full object-cover relative z-10 ${
              facingMode === 'user' ? 'scale-x-[-1]' : ''
            }`}
          />
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 z-20 w-full h-full object-cover pointer-events-none ${
              facingMode === 'user' ? 'scale-x-[-1]' : ''
            }`}
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/90 backdrop-blur-xs p-6 z-30 text-center">
              {cameraError ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-danger font-medium max-w-xs">{cameraError}</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                  <span className="text-xs font-medium text-muted animate-pulse">{statusText}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface-hover h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className="bg-emerald-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${validProgress * 100}%` }}
          />
        </div>

        {/* Status Text Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4 px-2 py-2 rounded-xl bg-surface-hover/70 text-center">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              validProgress > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <p className="text-xs font-medium text-foreground truncate">{statusText}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isCameraActive && (
            <button
              type="button"
              onClick={handleManualCapture}
              className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs shadow-sm"
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
            className="py-2.5 px-5 rounded-xl bg-surface-hover text-muted hover:text-foreground font-semibold hover:bg-border transition-colors text-xs"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

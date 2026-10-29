'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

interface FaceScannerProps {
  onFaceDetected: (descriptor: Float32Array, imageBase64: string) => void;
  onCancel: () => void;
  title?: string;
  subtitle?: string;
}

/* ─── Biometric Quality Analysis Helpers ───────────────────────── */

interface QualityAnalysisResult {
  passed: boolean;
  message: string;
  indicator: 'neutral' | 'warning' | 'error' | 'success';
}

function analyzeFaceLighting(
  video: HTMLVideoElement,
  box: { x: number; y: number; width: number; height: number }
): { isTooDark: boolean; isTooBright: boolean; isLowContrast: boolean; avgLum: number } {
  try {
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 48;
    sampleCanvas.height = 48;
    const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { isTooDark: false, isTooBright: false, isLowContrast: false, avgLum: 128 };

    const sx = Math.max(0, box.x);
    const sy = Math.max(0, box.y);
    const sw = Math.min(video.videoWidth - sx, box.width);
    const sh = Math.min(video.videoHeight - sy, box.height);

    if (sw <= 0 || sh <= 0) {
      return { isTooDark: false, isTooBright: false, isLowContrast: false, avgLum: 128 };
    }

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, 48, 48);
    const imgData = ctx.getImageData(0, 0, 48, 48).data;

    let totalLum = 0;
    let minLum = 255;
    let maxLum = 0;

    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLum += lum;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }

    const count = imgData.length / 4;
    const avgLum = totalLum / count;
    const isTooDark = avgLum < 65; // Cahaya terlalu redup / gelap
    const isTooBright = avgLum > 225; // Overexposed / silau
    const isLowContrast = maxLum - minLum < 38; // Silhouette / backlight

    return { isTooDark, isTooBright, isLowContrast, avgLum };
  } catch {
    return { isTooDark: false, isTooBright: false, isLowContrast: false, avgLum: 128 };
  }
}

function analyzeGlassesAndAccessories(
  video: HTMLVideoElement,
  landmarks: faceapi.FaceLandmarks68
): { hasGlassesOrObstruction: boolean; reason?: string } {
  try {
    const pts = landmarks.positions;
    if (!pts || pts.length < 68) return { hasGlassesOrObstruction: false };

    // 1. Eye Openness & Occlusion Check (EAR: Eye Aspect Ratio)
    // Left eye: 36..41
    const lH1 = Math.hypot(pts[37].x - pts[41].x, pts[37].y - pts[41].y);
    const lH2 = Math.hypot(pts[38].x - pts[40].x, pts[38].y - pts[40].y);
    const lW = Math.hypot(pts[36].x - pts[39].x, pts[36].y - pts[39].y);
    const leftEAR = (lH1 + lH2) / (2 * Math.max(1, lW));

    // Right eye: 42..47
    const rH1 = Math.hypot(pts[43].x - pts[47].x, pts[43].y - pts[47].y);
    const rH2 = Math.hypot(pts[44].x - pts[46].x, pts[44].y - pts[46].y);
    const rW = Math.hypot(pts[42].x - pts[45].x, pts[42].y - pts[45].y);
    const rightEAR = (rH1 + rH2) / (2 * Math.max(1, rW));

    // If eye ratio is too small, eyes are closed, covered by dark sunglasses or hair
    if (leftEAR < 0.15 || rightEAR < 0.15) {
      return {
        hasGlassesOrObstruction: true,
        reason: 'Mata tidak terlihat jelas. Buka mata Anda & jangan tutupi wajah.',
      };
    }

    // 2. Optical Glasses Frame Bridge Detection across the Nose Bridge
    // Region between inner corners of the eyes: landmark 39 (left) to 42 (right) & nose bridge 27
    const p39 = pts[39];
    const p42 = pts[42];
    const p27 = pts[27];

    const bridgeW = Math.abs(p42.x - p39.x);
    const bridgeH = Math.max(12, Math.abs(pts[28].y - p27.y) * 2.2);
    const bridgeX = Math.min(p39.x, p42.x);
    const bridgeY = p27.y - 4;

    if (bridgeW > 10 && bridgeH > 8 && video.videoWidth > 0) {
      const bCanvas = document.createElement('canvas');
      bCanvas.width = 28;
      bCanvas.height = 14;
      const bCtx = bCanvas.getContext('2d', { willReadFrequently: true });

      if (bCtx) {
        bCtx.drawImage(
          video,
          Math.max(0, bridgeX),
          Math.max(0, bridgeY),
          bridgeW,
          bridgeH,
          0,
          0,
          28,
          14
        );
        const bPixels = bCtx.getImageData(0, 0, 28, 14).data;

        let edgeCount = 0;
        let minLum = 255;
        let maxLum = 0;

        for (let y = 1; y < 13; y++) {
          for (let x = 1; x < 27; x++) {
            const idx = (y * 28 + x) * 4;
            const lum = 0.299 * bPixels[idx] + 0.587 * bPixels[idx + 1] + 0.114 * bPixels[idx + 2];
            if (lum < minLum) minLum = lum;
            if (lum > maxLum) maxLum = lum;

            const idxL = (y * 28 + (x - 1)) * 4;
            const idxR = (y * 28 + (x + 1)) * 4;
            const idxU = ((y - 1) * 28 + x) * 4;
            const idxD = ((y + 1) * 28 + x) * 4;
            const lumL = 0.299 * bPixels[idxL] + 0.587 * bPixels[idxL + 1] + 0.114 * bPixels[idxL + 2];
            const lumR = 0.299 * bPixels[idxR] + 0.587 * bPixels[idxR + 1] + 0.114 * bPixels[idxR + 2];
            const lumU = 0.299 * bPixels[idxU] + 0.587 * bPixels[idxU + 1] + 0.114 * bPixels[idxU + 2];
            const lumD = 0.299 * bPixels[idxD] + 0.587 * bPixels[idxD + 1] + 0.114 * bPixels[idxD + 2];

            const grad = Math.abs(lumR - lumL) + Math.abs(lumD - lumU);
            if (grad > 52) edgeCount++;
          }
        }

        const edgeDensity = edgeCount / (26 * 12);
        const contrast = maxLum - minLum;

        // Distinct frame bridge detected across the nasal bridge
        if (edgeDensity > 0.14 && contrast > 80) {
          return {
            hasGlassesOrObstruction: true,
            reason: 'Kacamata / aksesoris terdeteksi. Harap lepas kacamata Anda!',
          };
        }
      }
    }

    // 3. Eyeglass Frame Edge Density around the Left Eye Socket
    // Region from eyebrow 19 down to below eye 41
    const eyeBoxW = Math.abs(pts[39].x - pts[36].x) * 1.35;
    const eyeBoxH = Math.abs(pts[41].y - pts[19].y) * 1.25;
    const eyeBoxX = pts[36].x - eyeBoxW * 0.15;
    const eyeBoxY = pts[19].y;

    if (eyeBoxW > 14 && eyeBoxH > 14) {
      const eCanvas = document.createElement('canvas');
      eCanvas.width = 28;
      eCanvas.height = 28;
      const eCtx = eCanvas.getContext('2d', { willReadFrequently: true });

      if (eCtx) {
        eCtx.drawImage(
          video,
          Math.max(0, eyeBoxX),
          Math.max(0, eyeBoxY),
          eyeBoxW,
          eyeBoxH,
          0,
          0,
          28,
          28
        );
        const eData = eCtx.getImageData(0, 0, 28, 28).data;
        let sharpEdges = 0;

        for (let y = 1; y < 27; y++) {
          for (let x = 1; x < 27; x++) {
            const idx = (y * 28 + x) * 4;
            const idxR = (y * 28 + (x + 1)) * 4;
            const idxD = ((y + 1) * 28 + x) * 4;
            const lum = 0.299 * eData[idx] + 0.587 * eData[idx + 1] + 0.114 * eData[idx + 2];
            const lumR = 0.299 * eData[idxR] + 0.587 * eData[idxR + 1] + 0.114 * eData[idxR + 2];
            const lumD = 0.299 * eData[idxD] + 0.587 * eData[idxD + 1] + 0.114 * eData[idxD + 2];
            const grad = Math.abs(lumR - lum) + Math.abs(lumD - lum);
            if (grad > 56) sharpEdges++;
          }
        }

        const eyeEdgeDensity = sharpEdges / (26 * 26);
        if (eyeEdgeDensity > 0.22) {
          return {
            hasGlassesOrObstruction: true,
            reason: 'Bingkai kacamata terdeteksi di sekitar mata. Harap lepas kacamata!',
          };
        }
      }
    }

    return { hasGlassesOrObstruction: false };
  } catch {
    return { hasGlassesOrObstruction: false };
  }
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
  const animationFrameRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [statusText, setStatusText] = useState('Mengaktifkan kamera & sensor biometrik...');
  const [statusType, setStatusType] = useState<'neutral' | 'warning' | 'error' | 'success'>('neutral');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Rotation: saved in localStorage, default 0°
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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
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
    return canvas.toDataURL('image/jpeg', 0.88);
  };

  // ─── Ultra-Fast Biometric Detection Loop ──────────────────────

  const startDetectionLoop = useCallback(() => {
    stopDetectionLoop();

    let validFrames = 0;
    const targetFrames = 4; // ~600ms of stable, verified frames
    let lastCheckTime = 0;

    // Lightweight detector options (224 is ultra fast on mobile, executes in <15ms)
    const detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.5,
    });

    const loop = async (timestamp: number) => {
      if (!isMountedRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Throttle detection to ~130ms intervals to keep CPU/GPU cold and snappy
      if (video && canvas && timestamp - lastCheckTime > 130 && !isDetectingRef.current) {
        lastCheckTime = timestamp;

        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          const displaySize = { width: video.videoWidth, height: video.videoHeight };

          if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
            faceapi.matchDimensions(canvas, displaySize);
          }

          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

          try {
            isDetectingRef.current = true;

            // Only detect face + landmarks (no heavy 6MB ResNet recognition!)
            const detections = await faceapi
              .detectSingleFace(video, detectorOptions)
              .withFaceLandmarks(true);

            if (!isMountedRef.current || !videoRef.current) return;

            // Draw clean subtle landmarks guide
            if (detections && canvasRef.current) {
              const resized = faceapi.resizeResults(detections, displaySize);
              if (resized.landmarks) {
                faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
              }
            }

            if (!detections) {
              validFrames = 0;
              setValidProgress(0);
              setStatusText('Posisikan wajah Anda di dalam bingkai');
              setStatusType('neutral');
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            const box = detections.detection.box;
            const score = detections.detection.score ?? 0.8;

            // 1. Confidence check
            if (score < 0.5) {
              validFrames = 0;
              setValidProgress(0);
              setStatusText('Wajah kurang jelas. Mohon hadapkan langsung ke kamera.');
              setStatusType('warning');
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            // 2. Lighting & Brightness Analysis
            const lighting = analyzeFaceLighting(video, box);
            if (lighting.isTooDark) {
              validFrames = 0;
              setValidProgress(0);
              setStatusText('Pencahayaan terlalu gelap! Harap pindah ke tempat yang lebih terang.');
              setStatusType('error');
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }
            if (lighting.isTooBright) {
              validFrames = 0;
              setValidProgress(0);
              setStatusText('Cahaya terlalu silau / backlight. Hindari sumber cahaya langsung.');
              setStatusType('warning');
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }
            if (lighting.isLowContrast) {
              validFrames = 0;
              setValidProgress(0);
              setStatusText('Wajah kurang jelas / tertutup bayangan. Sesuaikan pencahayaan.');
              setStatusType('warning');
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            // 3. Glasses & Accessories Obstruction Check
            const glassesCheck = analyzeGlassesAndAccessories(video, detections.landmarks);
            if (glassesCheck.hasGlassesOrObstruction) {
              validFrames = 0;
              setValidProgress(0);
              setStatusText(
                glassesCheck.reason ||
                  'Kacamata / aksesoris terdeteksi! Harap lepas kacamata & aksesoris wajah.'
              );
              setStatusType('error');
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            // 4. Head Pose & Alignment Check (Pitch, Yaw, Tilt)
            const pts = detections.landmarks.positions;
            const pLeftEye = pts[36];
            const pRightEye = pts[45];
            const eyeSlope = Math.abs((pRightEye.y - pLeftEye.y) / Math.max(1, pRightEye.x - pLeftEye.x));

            if (eyeSlope > 0.18) {
              validFrames = 0;
              setValidProgress(0);
              setStatusText('Posisikan kepala tegak lurus (tidak miring).');
              setStatusType('warning');
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            // Yaw: nose tip relative to jaw edges
            const pNoseTip = pts[30];
            const pJawLeft = pts[0];
            const pJawRight = pts[16];
            const distLeft = Math.abs(pNoseTip.x - pJawLeft.x);
            const distRight = Math.abs(pJawRight.x - pNoseTip.x);
            const yawRatio = distLeft / Math.max(1, distRight);

            if (yawRatio < 0.58 || yawRatio > 1.72) {
              validFrames = 0;
              setValidProgress(0);
              setStatusText('Hadapkan wajah lurus ke depan kamera.');
              setStatusType('warning');
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            // 5. Distance and Centering
            const faceWidthRatio = box.width / video.videoWidth;
            if (faceWidthRatio < 0.22) {
              validFrames = 0;
              setValidProgress(0);
              setStatusText('Wajah terlalu jauh. Mohon dekatkan ke kamera.');
              setStatusType('warning');
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }
            if (faceWidthRatio > 0.72) {
              validFrames = 0;
              setValidProgress(0);
              setStatusText('Wajah terlalu dekat. Mundurkan sedikit.');
              setStatusType('warning');
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            const faceCenterX = box.x + box.width / 2;
            const faceCenterY = box.y + box.height / 2;
            const relX = faceCenterX / video.videoWidth;
            const relY = faceCenterY / video.videoHeight;

            if (relX < 0.22 || relX > 0.78 || relY < 0.16 || relY > 0.84) {
              validFrames = 0;
              setValidProgress(0);
              setStatusText('Posisikan wajah tepat di tengah bingkai.');
              setStatusType('warning');
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            // ─── All Conditions Met! Increment Auto-Verification ───
            validFrames++;
            const progress = Math.min(validFrames / targetFrames, 1);
            setValidProgress(progress);
            setStatusType('success');

            if (validFrames < targetFrames) {
              setStatusText(`Wajah terverifikasi! Tahan posisi... (${Math.round(progress * 100)}%)`);
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            // ─── Verification Complete: Automatic Capture ─────────
            setStatusText('✅ Verifikasi Sukses! Mengambil presensi...');
            stopDetectionLoop();

            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate([60, 40, 60]);
              } catch {}
            }

            const imageBase64 = captureImage(video, facingMode === 'user', rotationRef.current);
            stopVideo();
            onFaceDetected(new Float32Array(128), imageBase64);
            return;
          } catch (err) {
            console.error('Detection error:', err);
          } finally {
            isDetectingRef.current = false;
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  }, [facingMode, onFaceDetected, stopDetectionLoop, stopVideo]);

  // ─── Camera MediaStream Setup ─────────────────────────────────

  const startCamera = useCallback(
    async (facing: 'user' | 'environment') => {
      stopVideo();
      setCameraError(null);
      setStatusText('Menyalakan kamera...');
      setStatusType('neutral');

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        const errorMsg =
          'Akses kamera membutuhkan koneksi aman (HTTPS). Pastikan situs dibuka dengan https://';
        setCameraError(errorMsg);
        setStatusText(errorMsg);
        setStatusType('error');
        return;
      }

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
            ? 'Izin kamera ditolak. Harap izinkan akses kamera di browser.'
            : 'Kamera tidak ditemukan atau tidak dapat diakses.';
        setCameraError(msg);
        setStatusText(msg);
        setStatusType('error');
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
        setStatusType('neutral');
        startDetectionLoop();
      }
    },
    [startDetectionLoop, stopVideo]
  );

  // ─── Instant AI Model Loading (Only 270KB Lightweight Models!) ──

  useEffect(() => {
    isMountedRef.current = true;

    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        // Only load lightweight models: TinyFaceDetector (193KB) + TinyLandmarks (77KB)
        // No heavy 6.4MB ResNet-34 faceRecognitionNet!
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ]);

        if (isMountedRef.current) {
          setIsModelLoaded(true);
          startCamera(facingMode);
        }
      } catch (error) {
        console.error('Error loading face-api models', error);
        if (isMountedRef.current) {
          setIsModelLoaded(true);
          setStatusText('Kamera siap digunakan.');
          startCamera(facingMode);
        }
      }
    };

    loadModels();

    return () => {
      isMountedRef.current = false;
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4">
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
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 truncate font-heading">
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

        {/* Video & Scanner Viewport */}
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
                className={`w-40 h-52 sm:w-52 sm:h-68 rounded-[50%] border-2 transition-all duration-200 ${
                  validProgress > 0
                    ? 'border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.9)] scale-102 bg-emerald-500/15'
                    : statusType === 'error'
                    ? 'border-rose-400/80 border-dashed shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                    : statusType === 'warning'
                    ? 'border-amber-400/80 border-dashed shadow-[0_0_20px_rgba(251,191,36,0.3)]'
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

        {/* Biometric Requirements Badges */}
        <div className="grid grid-cols-3 gap-1.5 mb-2.5 text-[10px] text-zinc-500 text-center">
          <div className="py-1 px-1.5 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center gap-1">
            <span>💡</span>
            <span className="font-medium">Cahaya Terang</span>
          </div>
          <div className="py-1 px-1.5 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center gap-1">
            <span>👓</span>
            <span className="font-medium">Tanpa Kacamata</span>
          </div>
          <div className="py-1 px-1.5 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center gap-1">
            <span>👤</span>
            <span className="font-medium">Wajah Lurus</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mb-2.5">
          <div
            className={`h-full transition-all duration-200 ease-out ${
              validProgress >= 1
                ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]'
                : validProgress > 0
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                : 'bg-zinc-200'
            }`}
            style={{ width: `${validProgress * 100}%` }}
          />
        </div>

        {/* Real-Time Live Status Feedback */}
        <div
          className={`flex items-center justify-center gap-2 mb-3.5 px-3 py-2.5 rounded-xl border text-center transition-colors ${
            statusType === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusType === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : statusType === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-zinc-50 border-zinc-100 text-zinc-700'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              statusType === 'success'
                ? 'bg-emerald-500 animate-pulse'
                : statusType === 'error'
                ? 'bg-rose-500'
                : statusType === 'warning'
                ? 'bg-amber-500'
                : 'bg-cyan-500 animate-pulse'
            }`}
          />
          <p className="text-xs font-semibold leading-snug">{statusText}</p>
        </div>

        {/* Only Cancel Button: No Manual Capture Button! */}
        <button
          type="button"
          onClick={() => {
            stopVideo();
            onCancel();
          }}
          className="w-full py-2.5 px-5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 font-semibold transition-colors text-xs cursor-pointer"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

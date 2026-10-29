'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

interface FaceScannerProps {
  onFaceDetected: (descriptor: Float32Array, imageBase64: string) => void;
  onCancel: () => void;
  title?: string;
  subtitle?: string;
}

/* ─── Biometric Diagnostic State ─────────────────────────────── */

interface DiagnosticState {
  lighting: 'good' | 'dark' | 'bright' | 'contrast';
  accessories: 'clean' | 'glasses' | 'eyes_covered';
  pose: 'aligned' | 'tilted' | 'turned' | 'distance' | 'offcenter';
  stillness: 'still' | 'moving';
  summaryMessage: string;
  isReadyForCapture: boolean;
}

/* ─── Biometric Quality Analysis Helpers ───────────────────────── */

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
    const isTooDark = avgLum < 60; // Cahaya terlalu redup / gelap
    const isTooBright = avgLum > 230; // Overexposed / silau
    const isLowContrast = maxLum - minLum < 34; // Silhouette / backlight

    return { isTooDark, isTooBright, isLowContrast, avgLum };
  } catch {
    return { isTooDark: false, isTooBright: false, isLowContrast: false, avgLum: 128 };
  }
}

/**
 * Universal Multi-Scale Glasses & Accessories Detector
 * Accurately detects glasses (thick frames, thin metal frames, wireframes, sunglasses)
 * at ANY distance (close, medium, or far) on both desktop webcams and mobile devices.
 *
 * Checks:
 * 1. Eye Openness & Occlusion (EAR)
 * 2. Entire Eye-Band Dark Frame Pixel Ratio
 * 3. Nasal Bridge Frame Bar & Gradient (Between eyes 39 & 42)
 * 4. Upper Eyeglass Rim (In gap between eyebrows and upper eyelids)
 * 5. Lower Eyeglass Rim (Below eyes / Upper cheek)
 * 6. Eye Band vs Cheek Relative Edge Variance
 */
function analyzeGlassesAndAccessories(
  video: HTMLVideoElement,
  landmarks: faceapi.FaceLandmarks68
): { hasGlassesOrObstruction: boolean; reason?: string } {
  try {
    const pts = landmarks.positions;
    if (!pts || pts.length < 68) return { hasGlassesOrObstruction: false };

    // Scale invariant base: inter-ocular distance (outer left eye 36 to outer right eye 45)
    const eyeDist = Math.hypot(pts[45].x - pts[36].x, pts[45].y - pts[36].y);
    if (eyeDist < 15 || video.videoWidth <= 0 || video.videoHeight <= 0) {
      return { hasGlassesOrObstruction: false };
    }

    // ── 1. Eye Openness & Occlusion Check (EAR: Eye Aspect Ratio) ──
    const lH1 = Math.hypot(pts[37].x - pts[41].x, pts[37].y - pts[41].y);
    const lH2 = Math.hypot(pts[38].x - pts[40].x, pts[38].y - pts[40].y);
    const lW = Math.hypot(pts[36].x - pts[39].x, pts[36].y - pts[39].y);
    const leftEAR = (lH1 + lH2) / (2 * Math.max(1, lW));

    const rH1 = Math.hypot(pts[43].x - pts[47].x, pts[43].y - pts[47].y);
    const rH2 = Math.hypot(pts[44].x - pts[46].x, pts[44].y - pts[46].y);
    const rW = Math.hypot(pts[42].x - pts[45].x, pts[42].y - pts[45].y);
    const rightEAR = (rH1 + rH2) / (2 * Math.max(1, rW));

    if (leftEAR < 0.14 || rightEAR < 0.14) {
      return {
        hasGlassesOrObstruction: true,
        reason: 'Mata tidak terlihat jelas / terpejam. Buka mata Anda & jangan tutupi wajah.',
      };
    }

    // ── 2. Full Eye-Band Dark Frame Pixel Ratio & Global Edge Density ──
    // Box spanning from left temple to right temple, eyebrow to upper cheek
    const bandX = Math.max(0, pts[36].x - 0.22 * eyeDist);
    const bandY = Math.max(0, Math.min(pts[19].y, pts[24].y) - 0.08 * eyeDist);
    const bandW = Math.min(video.videoWidth - bandX, (pts[45].x - pts[36].x) + 0.44 * eyeDist);
    const bandH = Math.min(
      video.videoHeight - bandY,
      Math.max(pts[41].y, pts[46].y) - bandY + 0.24 * eyeDist
    );

    if (bandW > 20 && bandH > 10) {
      const bandCanvas = document.createElement('canvas');
      bandCanvas.width = 64;
      bandCanvas.height = 32;
      const bandCtx = bandCanvas.getContext('2d', { willReadFrequently: true });

      if (bandCtx) {
        bandCtx.drawImage(video, bandX, bandY, bandW, bandH, 0, 0, 64, 32);
        const bData = bandCtx.getImageData(0, 0, 64, 32).data;

        let darkPixels = 0;
        let edgePixels = 0;
        let lumSum = 0;
        let lumArray: number[] = [];

        for (let y = 1; y < 31; y++) {
          for (let x = 1; x < 63; x++) {
            const idx = (y * 64 + x) * 4;
            const lum = 0.299 * bData[idx] + 0.587 * bData[idx + 1] + 0.114 * bData[idx + 2];
            lumArray.push(lum);
            lumSum += lum;

            // Dark frame pixels (plastic, tortoise, dark metal frames)
            if (lum < 84) darkPixels++;

            const idxL = (y * 64 + (x - 1)) * 4;
            const idxR = (y * 64 + (x + 1)) * 4;
            const idxU = ((y - 1) * 64 + x) * 4;
            const idxD = ((y + 1) * 64 + x) * 4;
            const lumL = 0.299 * bData[idxL] + 0.587 * bData[idxL + 1] + 0.114 * bData[idxL + 2];
            const lumR = 0.299 * bData[idxR] + 0.587 * bData[idxR + 1] + 0.114 * bData[idxR + 2];
            const lumU = 0.299 * bData[idxU] + 0.587 * bData[idxU + 1] + 0.114 * bData[idxU + 2];
            const lumD = 0.299 * bData[idxD] + 0.587 * bData[idxD + 1] + 0.114 * bData[idxD + 2];

            const grad = Math.abs(lumR - lumL) + Math.abs(lumD - lumU);
            if (grad > 26) edgePixels++;
          }
        }

        const totalSampled = lumArray.length;
        const darkRatio = darkPixels / totalSampled;
        const edgeRatio = edgePixels / totalSampled;

        // Dark glasses frame detection:
        // On bare skin, eyebrows & pupils only occupy ~5-7% of this large band.
        // Thick glasses frames push dark pixels to > 11.5% and edge density to > 7.5%!
        if (darkRatio > 0.115 && edgeRatio > 0.072) {
          return {
            hasGlassesOrObstruction: true,
            reason: 'Kacamata terdeteksi di wajah! Harap lepas kacamata Anda.',
          };
        }
      }
    }

    // ── 3. Nasal Bridge Frame Analysis (Between Inner Corners 39 & 42) ──
    const p39 = pts[39];
    const p42 = pts[42];
    const p27 = pts[27];

    const bridgeX = Math.min(p39.x, p42.x);
    const bridgeW = Math.abs(p42.x - p39.x);
    const bridgeY = p27.y - 0.15 * eyeDist;
    const bridgeH = Math.max(10, 0.32 * eyeDist);

    if (bridgeW > 6 && bridgeH > 6) {
      const bCanvas = document.createElement('canvas');
      bCanvas.width = 32;
      bCanvas.height = 18;
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
          32,
          18
        );
        const bPixels = bCtx.getImageData(0, 0, 32, 18).data;

        let edgeCount = 0;
        let sumLum = 0;
        let lumValues: number[] = [];
        let minLum = 255;
        let maxLum = 0;

        for (let y = 1; y < 17; y++) {
          for (let x = 1; x < 31; x++) {
            const idx = (y * 32 + x) * 4;
            const lum = 0.299 * bPixels[idx] + 0.587 * bPixels[idx + 1] + 0.114 * bPixels[idx + 2];
            lumValues.push(lum);
            sumLum += lum;
            if (lum < minLum) minLum = lum;
            if (lum > maxLum) maxLum = lum;

            const idxL = (y * 32 + (x - 1)) * 4;
            const idxR = (y * 32 + (x + 1)) * 4;
            const idxU = ((y - 1) * 32 + x) * 4;
            const idxD = ((y + 1) * 32 + x) * 4;
            const lumL = 0.299 * bPixels[idxL] + 0.587 * bPixels[idxL + 1] + 0.114 * bPixels[idxL + 2];
            const lumR = 0.299 * bPixels[idxR] + 0.587 * bPixels[idxR + 1] + 0.114 * bPixels[idxR + 2];
            const lumU = 0.299 * bPixels[idxU] + 0.587 * bPixels[idxU + 1] + 0.114 * bPixels[idxU + 2];
            const lumD = 0.299 * bPixels[idxD] + 0.587 * bPixels[idxD + 1] + 0.114 * bPixels[idxD + 2];

            const grad = Math.abs(lumR - lumL) + Math.abs(lumD - lumU);
            if (grad > 26) edgeCount++;
          }
        }

        const count = lumValues.length;
        const avgLum = sumLum / count;
        let variance = 0;
        for (const l of lumValues) {
          variance += Math.pow(l - avgLum, 2);
        }
        const stdDev = Math.sqrt(variance / count);
        const edgeRatio = edgeCount / count;
        const contrast = maxLum - minLum;

        // Bridge frame detected:
        if ((edgeRatio > 0.065 && contrast > 30) || stdDev > 15.0) {
          return {
            hasGlassesOrObstruction: true,
            reason: 'Kacamata / aksesoris terdeteksi di hidung. Harap lepas kacamata!',
          };
        }
      }
    }

    // ── 4. Upper Eyeglass Rim (Gap between Eyebrows and Eyelids) ──
    const leftGapY = (pts[19].y + pts[37].y) / 2;
    const leftGapH = Math.max(8, Math.abs(pts[37].y - pts[19].y) * 1.3);
    const leftGapW = Math.abs(pts[39].x - pts[36].x) * 1.05;
    const leftGapX = Math.min(pts[36].x, pts[39].x);

    const rightGapY = (pts[24].y + pts[44].y) / 2;
    const rightGapH = Math.max(8, Math.abs(pts[44].y - pts[24].y) * 1.3);
    const rightGapW = Math.abs(pts[45].x - pts[42].x) * 1.05;
    const rightGapX = Math.min(pts[42].x, pts[45].x);

    if (leftGapW > 8 && rightGapW > 8) {
      const gCanvas = document.createElement('canvas');
      gCanvas.width = 48;
      gCanvas.height = 14;
      const gCtx = gCanvas.getContext('2d', { willReadFrequently: true });

      if (gCtx) {
        gCtx.drawImage(
          video,
          Math.max(0, leftGapX),
          Math.max(0, leftGapY - leftGapH / 2),
          leftGapW,
          leftGapH,
          0,
          0,
          24,
          14
        );
        gCtx.drawImage(
          video,
          Math.max(0, rightGapX),
          Math.max(0, rightGapY - rightGapH / 2),
          rightGapW,
          rightGapH,
          24,
          0,
          24,
          14
        );

        const gPixels = gCtx.getImageData(0, 0, 48, 14).data;
        let horizontalEdges = 0;

        for (let y = 1; y < 13; y++) {
          for (let x = 1; x < 47; x++) {
            const idxU = ((y - 1) * 48 + x) * 4;
            const idxD = ((y + 1) * 48 + x) * 4;
            const lumU = 0.299 * gPixels[idxU] + 0.587 * gPixels[idxU + 1] + 0.114 * gPixels[idxU + 2];
            const lumD = 0.299 * gPixels[idxD] + 0.587 * gPixels[idxD + 1] + 0.114 * gPixels[idxD + 2];
            if (Math.abs(lumD - lumU) > 28) {
              horizontalEdges++;
            }
          }
        }

        const rimEdgeRatio = horizontalEdges / (46 * 12);
        if (rimEdgeRatio > 0.075) {
          return {
            hasGlassesOrObstruction: true,
            reason: 'Bingkai kacamata terdeteksi di atas mata. Harap lepas kacamata!',
          };
        }
      }
    }

    // ── 5. Lower Eyeglass Rim (Below Eyes / Cheekbone Rim) ──
    const lowerRimY = Math.max(pts[40].y, pts[41].y) + 2;
    const lowerRimH = Math.max(8, 0.20 * eyeDist);
    const lowerRimW = Math.abs(pts[39].x - pts[36].x) * 1.15;
    const lowerRimX = pts[36].x - 0.05 * eyeDist;

    if (lowerRimW > 8 && lowerRimH > 6) {
      const lCanvas = document.createElement('canvas');
      lCanvas.width = 28;
      lCanvas.height = 14;
      const lCtx = lCanvas.getContext('2d', { willReadFrequently: true });

      if (lCtx) {
        lCtx.drawImage(
          video,
          Math.max(0, lowerRimX),
          Math.max(0, lowerRimY),
          lowerRimW,
          lowerRimH,
          0,
          0,
          28,
          14
        );
        const lPixels = lCtx.getImageData(0, 0, 28, 14).data;
        let lowerEdges = 0;
        let minLum = 255;
        let maxLum = 0;

        for (let y = 1; y < 13; y++) {
          for (let x = 1; x < 27; x++) {
            const idx = (y * 28 + x) * 4;
            const lum = 0.299 * lPixels[idx] + 0.587 * lPixels[idx + 1] + 0.114 * lPixels[idx + 2];
            if (lum < minLum) minLum = lum;
            if (lum > maxLum) maxLum = lum;

            const idxU = ((y - 1) * 28 + x) * 4;
            const idxD = ((y + 1) * 28 + x) * 4;
            const lumU = 0.299 * lPixels[idxU] + 0.587 * lPixels[idxU + 1] + 0.114 * lPixels[idxU + 2];
            const lumD = 0.299 * lPixels[idxD] + 0.587 * lPixels[idxD + 1] + 0.114 * lPixels[idxD + 2];
            if (Math.abs(lumD - lumU) > 28) lowerEdges++;
          }
        }

        const lowerEdgeRatio = lowerEdges / (26 * 12);
        if (lowerEdgeRatio > 0.085 && maxLum - minLum > 35) {
          return {
            hasGlassesOrObstruction: true,
            reason: 'Bingkai kacamata terdeteksi di pipi. Harap lepas kacamata!',
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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Diagnostics HUD Checklist
  const [diagnostics, setDiagnostics] = useState<DiagnosticState>({
    lighting: 'good',
    accessories: 'clean',
    pose: 'aligned',
    stillness: 'still',
    summaryMessage: 'Mengaktifkan kamera & sensor biometrik...',
    isReadyForCapture: false,
  });

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
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  // ─── Ultra-Fast Biometric Detection Loop ──────────────────────

  const startDetectionLoop = useCallback(() => {
    stopDetectionLoop();

    let stillFrames = 0;
    const targetStillFrames = 10; // ~1.4 seconds of sustained stillness required!
    let lastCheckTime = 0;
    let prevCenter = { x: 0, y: 0 };
    let prevWidth = 0;

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
              stillFrames = 0;
              setValidProgress(0);
              prevCenter = { x: 0, y: 0 };
              prevWidth = 0;
              setDiagnostics({
                lighting: 'good',
                accessories: 'clean',
                pose: 'offcenter',
                stillness: 'still',
                summaryMessage: 'Posisikan wajah Anda tepat di dalam bingkai',
                isReadyForCapture: false,
              });
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            const box = detections.detection.box;
            const score = detections.detection.score ?? 0.8;

            // 1. Confidence check
            if (score < 0.5) {
              stillFrames = 0;
              setValidProgress(0);
              setDiagnostics({
                lighting: 'good',
                accessories: 'clean',
                pose: 'distance',
                stillness: 'still',
                summaryMessage: 'Wajah kurang jelas. Tatap langsung ke lensa kamera.',
                isReadyForCapture: false,
              });
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            // 2. Lighting & Brightness Analysis
            const lighting = analyzeFaceLighting(video, box);
            if (lighting.isTooDark) {
              stillFrames = 0;
              setValidProgress(0);
              setDiagnostics({
                lighting: 'dark',
                accessories: 'clean',
                pose: 'aligned',
                stillness: 'still',
                summaryMessage: 'Pencahayaan terlalu gelap! Harap pindah ke tempat lebih terang.',
                isReadyForCapture: false,
              });
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }
            if (lighting.isTooBright) {
              stillFrames = 0;
              setValidProgress(0);
              setDiagnostics({
                lighting: 'bright',
                accessories: 'clean',
                pose: 'aligned',
                stillness: 'still',
                summaryMessage: 'Cahaya terlalu silau / backlight! Hindari cahaya langsung.',
                isReadyForCapture: false,
              });
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }
            if (lighting.isLowContrast) {
              stillFrames = 0;
              setValidProgress(0);
              setDiagnostics({
                lighting: 'contrast',
                accessories: 'clean',
                pose: 'aligned',
                stillness: 'still',
                summaryMessage: 'Wajah tertutup bayangan / siluet. Sesuaikan pencahayaan.',
                isReadyForCapture: false,
              });
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            // 3. Head Pose: Tilt & Yaw Alignment
            const pts = detections.landmarks.positions;
            const pLeftEye = pts[36];
            const pRightEye = pts[45];
            const eyeSlope = Math.abs((pRightEye.y - pLeftEye.y) / Math.max(1, pRightEye.x - pLeftEye.x));

            if (eyeSlope > 0.16) {
              stillFrames = 0;
              setValidProgress(0);
              setDiagnostics({
                lighting: 'good',
                accessories: 'clean',
                pose: 'tilted',
                stillness: 'still',
                summaryMessage: 'Posisikan kepala tegak lurus (tidak miring).',
                isReadyForCapture: false,
              });
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
              stillFrames = 0;
              setValidProgress(0);
              setDiagnostics({
                lighting: 'good',
                accessories: 'clean',
                pose: 'turned',
                stillness: 'still',
                summaryMessage: 'Hadapkan wajah lurus ke depan kamera.',
                isReadyForCapture: false,
              });
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            // 4. Strict Distance & Oval Guide Fitting (Fix for Sitting Far Away!)
            // In a square viewport with object-fit: cover, the visible area is min(videoWidth, videoHeight).
            const visibleDim = Math.min(video.videoWidth, video.videoHeight);
            const faceRatio = box.width / visibleDim;

            // The oval guide covers ~55% - 70% of the visible container.
            // Face MUST fill between 38% and 78% of the visible frame!
            if (faceRatio < 0.38) {
              stillFrames = 0;
              setValidProgress(0);
              setDiagnostics({
                lighting: 'good',
                accessories: 'clean',
                pose: 'distance',
                stillness: 'still',
                summaryMessage: '⚠️ Wajah terlalu jauh! Dekatkan wajah hingga pas di dalam bingkai oval.',
                isReadyForCapture: false,
              });
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }
            if (faceRatio > 0.82) {
              stillFrames = 0;
              setValidProgress(0);
              setDiagnostics({
                lighting: 'good',
                accessories: 'clean',
                pose: 'distance',
                stillness: 'still',
                summaryMessage: '⚠️ Wajah terlalu dekat! Mundurkan wajah sedikit.',
                isReadyForCapture: false,
              });
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            // Centering relative to visible square viewport
            const faceCenterX = box.x + box.width / 2;
            const faceCenterY = box.y + box.height / 2;
            const cropOffsetX = (video.videoWidth - visibleDim) / 2;
            const cropOffsetY = (video.videoHeight - visibleDim) / 2;
            const relVisibleX = (faceCenterX - cropOffsetX) / visibleDim;
            const relVisibleY = (faceCenterY - cropOffsetY) / visibleDim;

            if (relVisibleX < 0.24 || relVisibleX > 0.76 || relVisibleY < 0.18 || relVisibleY > 0.82) {
              stillFrames = 0;
              setValidProgress(0);
              setDiagnostics({
                lighting: 'good',
                accessories: 'clean',
                pose: 'offcenter',
                stillness: 'still',
                summaryMessage: 'Posisikan wajah tepat di tengah bingkai oval.',
                isReadyForCapture: false,
              });
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            // 5. Glasses & Accessories Obstruction Check (Multi-Layer Universal)
            const glassesCheck = analyzeGlassesAndAccessories(video, detections.landmarks);
            if (glassesCheck.hasGlassesOrObstruction) {
              stillFrames = 0;
              setValidProgress(0);
              setDiagnostics({
                lighting: 'good',
                accessories: 'glasses',
                pose: 'aligned',
                stillness: 'still',
                summaryMessage:
                  glassesCheck.reason ||
                  'Kacamata / aksesoris terdeteksi! Harap lepas kacamata & aksesoris wajah.',
                isReadyForCapture: false,
              });
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            // 6. Strict Stillness / Movement Verification
            const currCenter = { x: faceCenterX, y: faceCenterY };
            const currWidth = box.width;

            let isMoving = false;
            if (prevWidth > 0) {
              const moveDist = Math.hypot(currCenter.x - prevCenter.x, currCenter.y - prevCenter.y);
              const moveRatio = moveDist / currWidth;
              const sizeDeltaRatio = Math.abs(currWidth - prevWidth) / currWidth;

              if (moveRatio > 0.035 || sizeDeltaRatio > 0.04) {
                isMoving = true;
              }
            }

            prevCenter = currCenter;
            prevWidth = currWidth;

            if (isMoving) {
              stillFrames = Math.max(0, stillFrames - 2);
              const progress = Math.min(stillFrames / targetStillFrames, 1);
              setValidProgress(progress);

              setDiagnostics({
                lighting: 'good',
                accessories: 'clean',
                pose: 'aligned',
                stillness: 'moving',
                summaryMessage: '⚠️ Wajah masih bergerak. Harap diam dan tatap kamera!',
                isReadyForCapture: false,
              });
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            // ── ALL BIOMETRIC CHECKS PASSED & USER IS STEADY! ──
            stillFrames++;
            const progress = Math.min(stillFrames / targetStillFrames, 1);
            setValidProgress(progress);

            const isComplete = stillFrames >= targetStillFrames;

            setDiagnostics({
              lighting: 'good',
              accessories: 'clean',
              pose: 'aligned',
              stillness: 'still',
              summaryMessage: isComplete
                ? '✅ Verifikasi Berhasil! Mengambil presensi...'
                : `Wajah terverifikasi! Diam & tahan posisi... (${Math.round(progress * 100)}%)`,
              isReadyForCapture: isComplete,
            });

            if (!isComplete) {
              isDetectingRef.current = false;
              animationFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            // ── Automatic Snapshot Capture ─────────────────────
            stopDetectionLoop();

            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate([70, 30, 70]);
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
      setDiagnostics((prev) => ({
        ...prev,
        summaryMessage: 'Menyalakan kamera...',
      }));

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        const errorMsg =
          'Akses kamera membutuhkan koneksi aman (HTTPS). Pastikan situs dibuka dengan https://';
        setCameraError(errorMsg);
        setDiagnostics((prev) => ({
          ...prev,
          summaryMessage: errorMsg,
        }));
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
        setDiagnostics((prev) => ({ ...prev, summaryMessage: msg }));
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
        setDiagnostics((prev) => ({
          ...prev,
          summaryMessage: 'Posisikan wajah Anda di dalam bingkai',
        }));
        startDetectionLoop();
      }
    },
    [startDetectionLoop, stopVideo]
  );

  // ─── Instant AI Model Loading (270KB Total) ───────────────────

  useEffect(() => {
    isMountedRef.current = true;

    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
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

  // Determine overall status tone
  const isError =
    diagnostics.lighting !== 'good' || diagnostics.accessories !== 'clean';
  const isWarning =
    !isError && (diagnostics.pose !== 'aligned' || diagnostics.stillness === 'moving');
  const isVerified =
    !isError && !isWarning && validProgress > 0;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-3 sm:p-4">
      <div className="bg-white border border-zinc-200/90 rounded-[28px] sm:rounded-[34px] p-4 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.5)] max-w-md w-full relative overflow-y-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3.5 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
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
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 truncate font-heading tracking-tight">
                {title}
              </h3>
              <p className="text-[11px] text-zinc-500 truncate">{subtitle}</p>
            </div>
          </div>

          {/* Controls: Rotate, Flip, Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isCameraActive && (
              <>
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
                </button>

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
                </button>
              </>
            )}

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

        {/* Viewport & Cyber-HUD Scanner */}
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

          {/* Sci-Fi Target Reticle Overlay */}
          {isCameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-25">
              {/* Corner HUD Brackets */}
              <div className="w-48 h-60 sm:w-60 sm:h-74 relative flex items-center justify-center">
                <div
                  className={`absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 transition-colors duration-300 ${
                    isVerified
                      ? 'border-emerald-400'
                      : isError
                      ? 'border-rose-500'
                      : isWarning
                      ? 'border-amber-400'
                      : 'border-cyan-400'
                  }`}
                />
                <div
                  className={`absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 transition-colors duration-300 ${
                    isVerified
                      ? 'border-emerald-400'
                      : isError
                      ? 'border-rose-500'
                      : isWarning
                      ? 'border-amber-400'
                      : 'border-cyan-400'
                  }`}
                />
                <div
                  className={`absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 transition-colors duration-300 ${
                    isVerified
                      ? 'border-emerald-400'
                      : isError
                      ? 'border-rose-500'
                      : isWarning
                      ? 'border-amber-400'
                      : 'border-cyan-400'
                  }`}
                />
                <div
                  className={`absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 transition-colors duration-300 ${
                    isVerified
                      ? 'border-emerald-400'
                      : isError
                      ? 'border-rose-500'
                      : isWarning
                      ? 'border-amber-400'
                      : 'border-cyan-400'
                  }`}
                />

                {/* Central Biometric Oval */}
                <div
                  className={`w-full h-full rounded-[50%] border-2 transition-all duration-300 ${
                    isVerified
                      ? 'border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.85)] scale-102 bg-emerald-500/15'
                      : isError
                      ? 'border-rose-500/90 border-dashed shadow-[0_0_25px_rgba(244,63,94,0.45)] bg-rose-500/10'
                      : isWarning
                      ? 'border-amber-400/90 border-dashed shadow-[0_0_20px_rgba(251,191,36,0.35)]'
                      : 'border-cyan-400/60 border-dashed shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                  }`}
                />
              </div>
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
                  <span className="text-xs font-medium text-zinc-500 animate-pulse">
                    {diagnostics.summaryMessage}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Real-Time Diagnostic HUD Checklist (2x2 Grid - Never Truncated) ── */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          {/* 1. Lighting Indicator */}
          <div
            className={`py-2 px-2.5 rounded-xl border flex items-center gap-2 transition-colors ${
              diagnostics.lighting === 'good'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            <span className="text-sm">{diagnostics.lighting === 'good' ? '💡' : '🌑'}</span>
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-400 font-medium leading-none mb-0.5">Cahaya</p>
              <p className="font-bold text-[11px] truncate">
                {diagnostics.lighting === 'good'
                  ? 'Terang & Jelas'
                  : diagnostics.lighting === 'dark'
                  ? 'Terlalu Gelap'
                  : 'Silau / Backlight'}
              </p>
            </div>
          </div>

          {/* 2. Accessories / Glasses Indicator */}
          <div
            className={`py-2 px-2.5 rounded-xl border flex items-center gap-2 transition-colors ${
              diagnostics.accessories === 'clean'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            <span className="text-sm">{diagnostics.accessories === 'clean' ? '👓' : '🚫'}</span>
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-400 font-medium leading-none mb-0.5">Aksesoris</p>
              <p className="font-bold text-[11px] truncate">
                {diagnostics.accessories === 'clean' ? 'Bebas Kacamata' : 'Ada Kacamata!'}
              </p>
            </div>
          </div>

          {/* 3. Head Pose & Distance Indicator */}
          <div
            className={`py-2 px-2.5 rounded-xl border flex items-center gap-2 transition-colors ${
              diagnostics.pose === 'aligned'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <span className="text-sm">{diagnostics.pose === 'aligned' ? '👤' : '⚠️'}</span>
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-400 font-medium leading-none mb-0.5">Posisi</p>
              <p className="font-bold text-[11px] truncate">
                {diagnostics.pose === 'aligned'
                  ? 'Pas di Bingkai'
                  : diagnostics.pose === 'distance'
                  ? 'Jarak Kurang Pas'
                  : diagnostics.pose === 'tilted'
                  ? 'Kepala Miring'
                  : diagnostics.pose === 'turned'
                  ? 'Wajah Menoleh'
                  : 'Kurang Tengah'}
              </p>
            </div>
          </div>

          {/* 4. Stillness / Stability Indicator */}
          <div
            className={`py-2 px-2.5 rounded-xl border flex items-center gap-2 transition-colors ${
              diagnostics.stillness === 'still'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <span className="text-sm">{diagnostics.stillness === 'still' ? '🛑' : '🔄'}</span>
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-400 font-medium leading-none mb-0.5">Kestabilan</p>
              <p className="font-bold text-[11px] truncate">
                {diagnostics.stillness === 'still' ? 'Wajah Diam' : 'Wajah Bergerak'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar (Glows green when holding steady) */}
        <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden mb-2.5 border border-zinc-200/50">
          <div
            className={`h-full transition-all duration-150 ease-out ${
              validProgress >= 1
                ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]'
                : validProgress > 0
                ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500'
                : 'bg-zinc-200'
            }`}
            style={{ width: `${validProgress * 100}%` }}
          />
        </div>

        {/* Dynamic Animated Alert Banner */}
        <div
          className={`flex items-center justify-center gap-2 mb-3.5 px-3.5 py-2.5 rounded-2xl border text-center transition-all ${
            isVerified
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
              : isError
              ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-sm animate-pulse'
              : isWarning
              ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
              : 'bg-zinc-50 border-zinc-200 text-zinc-700'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              isVerified
                ? 'bg-emerald-500 animate-pulse'
                : isError
                ? 'bg-rose-500'
                : isWarning
                ? 'bg-amber-500'
                : 'bg-cyan-500 animate-pulse'
            }`}
          />
          <p className="text-xs font-bold leading-snug">{diagnostics.summaryMessage}</p>
        </div>

        {/* Only Cancel Button: 100% Automatic Scan */}
        <button
          type="button"
          onClick={() => {
            stopVideo();
            onCancel();
          }}
          className="w-full py-2.5 px-5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold transition-colors text-xs cursor-pointer"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

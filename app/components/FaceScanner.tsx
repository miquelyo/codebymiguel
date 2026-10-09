'use client';

import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

interface FaceScannerProps {
  onFaceDetected: (descriptor: Float32Array, imageBase64: string) => void;
  onCancel: () => void;
}

export default function FaceScanner({ onFaceDetected, onCancel }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [statusText, setStatusText] = useState('Memuat model AI...');

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        ]);
        setIsModelLoaded(true);
        setStatusText('Model siap, mengaktifkan kamera...');
        startVideo();
      } catch (error) {
        console.error('Error loading face-api models', error);
        setStatusText('Gagal memuat model wajah.');
      }
    };
    loadModels();

    return () => {
      stopVideo();
    };
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error('Kamera gagal diakses:', err);
        setStatusText('Izin kamera ditolak atau kamera tidak ditemukan.');
      });
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleVideoPlay = () => {
    setStatusText('Posisikan wajah Anda di depan kamera');
    
    let validFrames = 0;
    let lastCenter = { x: 0, y: 0 };
    
    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || isDetecting) return;

      const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      
      if (displaySize.width === 0 || displaySize.height === 0) {
        setIsDetecting(false);
        return;
      }

      if (canvasRef.current.width !== displaySize.width) {
        faceapi.matchDimensions(canvasRef.current, displaySize);
      }
      
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      try {
        setIsDetecting(true);
        const detections = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender()
          .withFaceDescriptor();

        if (detections) {
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        }

        if (!detections) {
          validFrames = 0;
          setStatusText('Wajah tidak terdeteksi. Posisikan wajah tepat di depan kamera.');
          setIsDetecting(false);
          return;
        }

        // Check confidence score (accessories, lighting)
        if (detections.detection.score < 0.75) {
          validFrames = 0;
          setStatusText('Wajah kurang jelas. Mohon lepaskan aksesoris (kacamata/masker) atau cari tempat terang.');
          setIsDetecting(false);
          return;
        }

        const box = detections.detection.box;
        const videoArea = videoRef.current.videoWidth * videoRef.current.videoHeight;
        const faceArea = box.width * box.height;

        if (videoArea > 0 && faceArea / videoArea < 0.05) {
          validFrames = 0;
          setStatusText('Wajah terlalu jauh. Mohon dekatkan wajah ke kamera.');
          setIsDetecting(false);
          return;
        }

        // Check movement
        const currCenter = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        const distance = Math.hypot(currCenter.x - lastCenter.x, currCenter.y - lastCenter.y);
        lastCenter = currCenter;

        if (validFrames > 0 && distance > 25) {
          validFrames = 0;
          setStatusText('Anda bergerak. Harap diam sejenak dan tatap kamera.');
          setIsDetecting(false);
          return;
        }
        
        // Safely extract expressions and age
        const expressions = detections.expressions || {};
        const maxExpression = Object.keys(expressions).length > 0
          ? Object.keys(expressions).reduce((a, b) => 
              (expressions as any)[a] > (expressions as any)[b] ? a : b
            )
          : 'neutral';
        
        const age = detections.age ? Math.round(detections.age) : '?';
        const gender = detections.gender || 'unknown';
        
        validFrames++;

        if (validFrames < 5) {
          setStatusText(`Wajah terdeteksi! Tahan posisi Anda... (${validFrames}/4)`);
          setIsDetecting(false);
          return;
        }

        setStatusText(`Memproses absensi... (${age} thn, ${gender}, ${maxExpression})`);
        clearInterval(interval);
        
        // Capture image
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctxImg = canvas.getContext('2d');
        if (ctxImg) {
          ctxImg.translate(canvas.width, 0);
          ctxImg.scale(-1, 1);
          ctxImg.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        }
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
        
        stopVideo();
        onFaceDetected(detections.descriptor, imageBase64);
        setIsDetecting(false);
      } catch (err) {
        console.error("Detection error:", err);
        setIsDetecting(false);
      }
    }, 600);

    return () => clearInterval(interval);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl max-w-md w-full">
        <h3 className="text-lg font-bold text-foreground mb-4">Verifikasi Wajah</h3>
        <div className="relative w-full aspect-square sm:aspect-video bg-black rounded-xl overflow-hidden mb-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            onPlay={handleVideoPlay}
            className="w-full h-full object-cover relative z-10 scale-x-[-1]"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-20 w-full h-full object-cover pointer-events-none scale-x-[-1]"
          />
          {!isModelLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-hover/80 z-30">
              <span className="text-sm font-medium text-muted animate-pulse">{statusText}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-center text-muted mb-6">{statusText}</p>
        <button
          onClick={() => {
            stopVideo();
            onCancel();
          }}
          className="w-full py-3 rounded-xl bg-surface-hover text-foreground font-semibold hover:bg-border transition-colors"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

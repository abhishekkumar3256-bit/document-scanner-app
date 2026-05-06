import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Check, RefreshCw } from 'lucide-react';

interface ScannerProps {
  onCapture: (blob: Blob) => void;
}

export default function Scanner({ onCapture }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('Could not access camera. Please check permissions.');
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            onCapture(blob);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  return (
    <div className="relative h-full bg-black flex flex-col">
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-white mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
              <div className="w-full h-full border-2 border-white/50 rounded-lg relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1"></div>
              </div>
            </div>
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-scan"></div>
          </div>
          
          <div className="p-8 flex items-center justify-between bg-black/80 backdrop-blur-md">
            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
              <X className="w-6 h-6 text-white" />
            </div>
            
            <button 
              onClick={captureImage}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 border-2 border-black rounded-full"></div>
            </button>
            
            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
          </div>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-150px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(150px); opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

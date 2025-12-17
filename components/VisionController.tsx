import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    Hands: any;
  }
}

type VisionStatus = 'init' | 'detected' | 'waiting' | 'error';

interface VisionControllerProps {
  onHandUpdate: (factor: number) => void;
  lang: 'en' | 'zh';
}

const STATUS_TEXT = {
  en: {
    init: "Initializing Camera...",
    detected: "Hand Detected",
    waiting: "Waiting for Hand...",
    error: "Camera Error (Check Permissions)"
  },
  zh: {
    init: "正在初始化摄像头...",
    detected: "已检测到手势",
    waiting: "等待手势输入...",
    error: "摄像头错误 (请检查权限)"
  }
};

const VisionController: React.FC<VisionControllerProps> = ({ onHandUpdate, lang }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<VisionStatus>('init');
  const requestRef = useRef<number>(0);
  const handsRef = useRef<any>(null);

  useEffect(() => {
    // MediaPipe Hands Initialization
    const initHands = async () => {
      if (!window.Hands) {
        setTimeout(initHands, 500); // Retry if script not loaded
        return;
      }

      try {
        const hands = new window.Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults(onResults);
        handsRef.current = hands;
        
        startCamera();
      } catch (e) {
        console.error("Failed to init Hands:", e);
        setStatus('error');
      }
    };

    const onResults = (results: any) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        setStatus('detected');
        const landmarks = results.multiHandLandmarks[0];
        
        // Thumb Tip (4) and Index Tip (8)
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const wrist = landmarks[0];
        const indexBase = landmarks[5];

        // Euclidean distances
        const dx = thumbTip.x - indexTip.x;
        const dy = thumbTip.y - indexTip.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Normalize by palm size (Wrist to Index Base)
        const pdx = wrist.x - indexBase.x;
        const pdy = wrist.y - indexBase.y;
        const palmSize = Math.sqrt(pdx * pdx + pdy * pdy);

        // Calculate Factor: 
        // Normal palmSize is ~0.15 - 0.25 in screen coords usually
        // Open hand pinch distance is often > palmSize
        // Closed pinch is < 0.2 * palmSize
        
        let rawFactor = dist / (palmSize || 0.1);
        
        // Map rough range [0.2, 1.2] to [0, 1]
        let factor = (rawFactor - 0.2) / 1.0;
        
        // Clamp
        if (factor > 1.0) factor = 1.0;
        if (factor < 0.0) factor = 0.0;

        onHandUpdate(factor);
      } else {
        setStatus('waiting');
        // Smoothly return to open state if hand is lost
        onHandUpdate(1.0);
      }
    };

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus('error');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Must wait for data loaded to start processing loop
          videoRef.current.onloadeddata = () => {
            videoRef.current?.play();
            processVideo();
          };
        }
      } catch (err) {
        console.error("Camera permission denied:", err);
        setStatus('error');
      }
    };

    const processVideo = async () => {
      if (videoRef.current && handsRef.current && status !== 'error') {
        // Only send if video is ready
        if (videoRef.current.readyState >= 2) {
          try {
            await handsRef.current.send({ image: videoRef.current });
          } catch(e) {
            // ignore transient send errors
          }
        }
      }
      requestRef.current = requestAnimationFrame(processVideo);
    };

    initHands();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (handsRef.current) handsRef.current.close();
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once

  return (
    <div className="absolute top-4 right-4 z-20 w-32 pointer-events-none">
      {/* Hidden video element for processing */}
      <video 
        ref={videoRef} 
        className="w-full h-auto rounded border border-gray-700 opacity-0 absolute top-0 left-0 pointer-events-none" 
        playsInline 
        muted 
      />
      
      {/* Status Badge */}
      <div className={`
        text-[10px] text-right mt-1 font-mono uppercase tracking-widest px-2 py-1 rounded inline-block float-right backdrop-blur-md border border-white/10
        ${status === 'error' ? 'text-red-400 bg-red-900/20' : 
          status === 'detected' ? 'text-cyan-400 bg-cyan-900/20 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 
          'text-gray-400 bg-black/50'}
      `}>
        {STATUS_TEXT[lang][status]}
      </div>
    </div>
  );
};

export default VisionController;
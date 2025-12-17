import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import ParticleSystem from './components/ParticleSystem';
import VisionController from './components/VisionController';
import { audioService } from './services/audioService';
import { AudioData, ShapeType } from './types';

// Translations
const UI_TEXT = {
  en: {
    title: "Cosmic Ink",
    subtitle: "Digital Art Installation",
    source: "Audio Source",
    resume: "Resume",
    pause: "Pause",
    stop: "Stop",
    auto: "Loop",
    size: "Size",
    sensitivity: "React",
    palette: "Palette",
    instr: "Upload audio to begin. Use hand gestures to interact.",
    shapes: {
      [ShapeType.NEBULA]: 'Nebula',
      [ShapeType.HEART]: 'Heart',
      [ShapeType.FLOWER]: 'Lotus',
      [ShapeType.SATURN]: 'Saturn',
      [ShapeType.CAKE]: 'Cake',
      [ShapeType.FIREWORKS]: 'Fireworks',
      [ShapeType.SPIRAL]: 'Spiral',
      [ShapeType.LEMNISCATE]: 'Infinity',
      [ShapeType.KOCH]: 'Fractal',
      [ShapeType.ASTROID]: 'Astroid',
      [ShapeType.BUTTERFLY]: 'Butterfly',
      [ShapeType.CATENOID]: 'Catenoid',
      [ShapeType.ROSE]: 'Rose',
    },
    enter: "ENTER EXHIBITION",
    permission: "Camera Access Required",
    fullscreen: "FS",
    morph: "Morph"
  },
  zh: {
    title: "水墨银河",
    subtitle: "数字交互艺术展",
    source: "音频源",
    resume: "播放",
    pause: "暂停",
    stop: "停止",
    auto: "自动",
    size: "粒径",
    sensitivity: "反馈",
    palette: "色板",
    instr: "上传音乐开启体验，使用手势控制粒子形态。",
    shapes: {
      [ShapeType.NEBULA]: '太极',
      [ShapeType.HEART]: '本心',
      [ShapeType.FLOWER]: '莲华',
      [ShapeType.SATURN]: '光环',
      [ShapeType.CAKE]: '礼赞',
      [ShapeType.FIREWORKS]: '花火',
      [ShapeType.SPIRAL]: '螺旋',
      [ShapeType.LEMNISCATE]: '无极',
      [ShapeType.KOCH]: '冰晶',
      [ShapeType.ASTROID]: '星芒',
      [ShapeType.BUTTERFLY]: '庄周',
      [ShapeType.CATENOID]: '悬链',
      [ShapeType.ROSE]: '玫瑰',
    },
    enter: "进入展厅",
    permission: "需开启摄像头权限",
    fullscreen: "全屏",
    morph: "幻化"
  }
};

function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentShape, setCurrentShape] = useState<ShapeType>(ShapeType.NEBULA);
  const [isAutoMorph, setIsAutoMorph] = useState(false);
  const [audioData, setAudioData] = useState<AudioData>({ bass: 0, mid: 0, treble: 0 });
  const [handFactor, setHandFactor] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMusicLoaded, setIsMusicLoaded] = useState(false);
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  
  // Menu Visibility
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  // Configuration
  const [count] = useState(20000); 
  const [size, setSize] = useState(15.0);
  const [sensitivity, setSensitivity] = useState(1.5);
  // Default Palette: Champagne Gold & Glacial Blue
  const [colors, setColors] = useState({
    a: '#FFFFFF', // Starlight
    b: '#A5C9CA', // Glacial Blue
    c: '#F2E8C4', // Champagne Gold
  });

  // Auto switch to Warm theme when Heart is selected
  useEffect(() => {
    if (currentShape === ShapeType.HEART) {
       setColors({
         a: '#2A0A0A', // Dark Crimson
         b: '#FF4D4D', // Red
         c: '#FFD700'  // Gold
       });
    }
  }, [currentShape]);

  // Audio Loop
  useEffect(() => {
    let animationFrameId: number;
    const analyze = () => {
      if (isPlaying) {
        setAudioData(audioService.getFrequencyData());
      } else {
        setAudioData(prev => ({
            bass: prev.bass * 0.9,
            mid: prev.mid * 0.9,
            treble: prev.treble * 0.9
        }));
      }
      animationFrameId = requestAnimationFrame(analyze);
    };
    analyze();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  // Auto Morph Loop
  useEffect(() => {
    if (!isAutoMorph) return;
    const interval = setInterval(() => {
      const allShapes = Object.values(ShapeType);
      const nextShapes = allShapes.filter(s => s !== currentShape);
      setCurrentShape(nextShapes[Math.floor(Math.random() * nextShapes.length)]);
    }, 10000); 
    return () => clearInterval(interval);
  }, [isAutoMorph, currentShape]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await audioService.init(e.target.files[0]);
      setIsPlaying(true);
      setIsMusicLoaded(true);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audioService.pause();
      setIsPlaying(false);
    } else {
      audioService.play();
      setIsPlaying(true);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
  };

  const t = UI_TEXT[lang];
  // Use Script font for English, Chinese Calligraphy for Chinese
  const titleFont = lang === 'zh' ? 'font-chinese' : 'font-script';
  // Also use script font for body headers in English for that "Engraver" feel
  const headerFont = lang === 'zh' ? 'font-chinese' : 'font-script';
  const bodyFont = lang === 'zh' ? 'font-chinese' : 'font-montserrat';

  // --- START SCREEN ---
  if (!hasStarted) {
    return (
      <div className={`w-full h-screen relative overflow-hidden flex flex-col items-center justify-center text-center select-none bg-black`}>
         {/* Deep Space Background */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0B1026_0%,#050505_80%)]"></div>
         
         <div className="z-10 space-y-12 animate-fade-in-up flex flex-col items-center">
            <h1 className={`text-6xl md:text-9xl tracking-[0.1em] text-[#E0E0E0] ${titleFont} drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]`}>
              {t.title}
            </h1>
            <p className={`text-xl md:text-3xl tracking-[0.3em] text-gray-400 uppercase ${headerFont} font-light`}>
              {t.subtitle}
            </p>
            
            <button 
              onClick={() => setHasStarted(true)}
              className={`px-16 py-5 border border-white/20 text-[#E0E0E0] rounded-sm hover:bg-white/5 hover:border-white/50 transition-all duration-700 tracking-[0.2em] text-lg uppercase ${bodyFont} animate-pulse`}
            >
              {t.enter}
            </button>
            
            <div className={`text-xs text-gray-600 tracking-widest ${bodyFont} mt-10`}>
               {t.permission}
            </div>
         </div>
      </div>
    );
  }

  // --- MAIN APP ---
  return (
    <div className={`w-full h-screen relative overflow-hidden bg-[#050505] text-[#E0E0E0] selection:bg-white/20`}>
      
      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 35], fov: 50 }} dpr={[1, 2]}>
          <color attach="background" args={['#050505']} />
          <ambientLight intensity={0.5} />
          
          <Suspense fallback={null}>
            <ParticleSystem 
              count={count} 
              currentShape={currentShape}
              audioData={audioData}
              handFactor={handFactor}
              colors={colors}
              size={size}
              sensitivity={sensitivity}
            />
            <Stars radius={150} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
          </Suspense>

          <EffectComposer>
            {/* Subtle Bloom for elegance */}
            <Bloom luminanceThreshold={0.3} mipmapBlur intensity={0.8} radius={0.5} />
            {/* Vignette for cinematic focus */}
            <Vignette eskil={false} offset={0.1} darkness={0.6} />
          </EffectComposer>

          <OrbitControls enableZoom={true} enablePan={false} autoRotate={!isPlaying} autoRotateSpeed={0.3} minDistance={10} maxDistance={100} />
        </Canvas>
      </div>

      {/* --- UI LAYER --- */}
      
      {/* Top Header */}
      <div className="absolute top-8 left-8 z-30 flex items-center gap-6 pointer-events-none select-none">
        <h2 className={`${titleFont} text-4xl md:text-5xl tracking-[0.1em] text-white/80 drop-shadow-md`}>{t.title}</h2>
        <div className="h-px w-16 bg-white/20"></div>
        <button onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')} className={`${bodyFont} pointer-events-auto text-xs font-bold tracking-widest text-gray-400 hover:text-white transition-colors uppercase`}>
           {lang === 'en' ? 'EN / 中文' : '中文 / EN'}
        </button>
      </div>

      {/* Vision Controller (Top Right) */}
      <VisionController onHandUpdate={setHandFactor} lang={lang} />

      {/* Floating Control Deck (Bottom Center) */}
      {/* Container wraps the toggle button and the deck */}
      <div className="absolute bottom-0 left-0 w-full flex flex-col items-center z-30 pb-6 pointer-events-none">
         
         {/* Toggle Button */}
         <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`pointer-events-auto mb-4 w-10 h-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 ${!isMenuOpen ? 'translate-y-[10px]' : ''}`}
         >
            <svg className={`w-5 h-5 transition-transform duration-500 ${isMenuOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" />
            </svg>
         </button>

         {/* The Deck */}
         <div className={`
             pointer-events-auto w-[92%] max-w-6xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] origin-bottom
             backdrop-blur-xl bg-[#0f172a]/40 border border-white/10 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.6)]
             flex flex-col md:flex-row items-center p-6 gap-8
             ${isMenuOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-[120%] opacity-0 scale-95'}
         `}>
            
            {/* 1. Playback Controls */}
            <div className="flex flex-col gap-3 min-w-[140px] border-r border-white/10 pr-6 w-full md:w-auto">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center overflow-hidden hover:bg-white/10 transition-colors relative group">
                     <input type="file" accept="audio/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                     <svg className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                  </div>
                  
                  {isMusicLoaded && (
                    <button onClick={handlePlayPause} className="w-12 h-12 rounded-full bg-white/10 border border-white/5 flex items-center justify-center hover:bg-white/20 transition-colors">
                       {isPlaying ? (
                         <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                       ) : (
                         <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                       )}
                    </button>
                  )}
               </div>
               <span className={`${bodyFont} text-xs tracking-widest text-gray-400 uppercase font-medium`}>{t.source}</span>
            </div>

            {/* 2. Shape Selector */}
            <div className="flex-1 w-full overflow-hidden flex flex-col gap-2">
               <div className="flex justify-between items-center">
                 <span className={`${bodyFont} text-xs tracking-widest text-gray-400 uppercase font-medium`}>{t.morph}</span>
                 <button onClick={() => setIsAutoMorph(!isAutoMorph)} className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded border transition-colors ${isAutoMorph ? 'border-amber-200/50 text-amber-200 bg-amber-900/20' : 'border-white/10 text-gray-500 hover:text-white'}`}>
                   {t.auto}
                 </button>
               </div>
               
               <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-hide mask-fade-sides">
                  {Object.values(ShapeType).map(shape => (
                     <button 
                       key={shape}
                       onClick={() => { setCurrentShape(shape); setIsAutoMorph(false); }}
                       className={`whitespace-nowrap px-6 py-3 rounded-full tracking-wider uppercase border transition-all duration-300 ${headerFont}
                         ${currentShape === shape 
                           ? 'bg-white/10 border-white/40 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)] scale-105 text-lg' 
                           : 'border-transparent text-gray-500 hover:text-gray-200 hover:bg-white/5 text-base'}`
                       }
                     >
                       {t.shapes[shape]}
                     </button>
                  ))}
               </div>
            </div>

            {/* 3. Fine Tuning (Sliders) */}
            <div className="flex flex-col gap-5 w-full md:w-[220px] border-l border-white/10 pl-8">
               <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-400 uppercase tracking-widest font-medium">
                    <span className={bodyFont}>{t.size}</span>
                    <span className="text-white/60 font-mono">{size.toFixed(0)}</span>
                  </div>
                  <input type="range" min="1" max="40" step="0.5" value={size} onChange={e => setSize(parseFloat(e.target.value))} />
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-400 uppercase tracking-widest font-medium">
                    <span className={bodyFont}>{t.sensitivity}</span>
                    <span className="text-white/60 font-mono">{sensitivity.toFixed(1)}</span>
                  </div>
                  <input type="range" min="0" max="5" step="0.1" value={sensitivity} onChange={e => setSensitivity(parseFloat(e.target.value))} />
               </div>
            </div>

            {/* 4. Colors */}
            <div className="flex flex-col gap-3 w-full md:w-auto pl-2 border-l border-white/10 md:border-none md:pl-0">
                <span className={`${bodyFont} text-xs tracking-widest text-gray-400 uppercase font-medium`}>{t.palette}</span>
                <div className="flex gap-4">
                  {[
                    { k: 'a', c: colors.a },
                    { k: 'b', c: colors.b },
                    { k: 'c', c: colors.c }
                  ].map((item) => (
                     <div key={item.k} className="w-8 h-8 rounded-full overflow-hidden relative border border-white/20 cursor-pointer hover:scale-110 hover:border-white/60 transition-all shadow-lg">
                        <input type="color" value={item.c} onChange={(e) => setColors(p => ({...p, [item.k]: e.target.value}))} />
                     </div>
                  ))}
                </div>
            </div>
            
            {/* Fullscreen Icon */}
            <button onClick={toggleFullscreen} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </button>
         </div>

      </div>

    </div>
  );
}

export default App;
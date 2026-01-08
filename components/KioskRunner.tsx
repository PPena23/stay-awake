
import React, { useEffect, useState, useRef } from 'react';
import { AppSettings } from '../types';

interface KioskRunnerProps {
  settings: AppSettings;
  onExit: () => void;
}

const KioskRunner: React.FC<KioskRunnerProps> = ({ settings, onExit }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
  const wakeLockRef = useRef<any>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  // Função para simular interação real no navegador
  const simulateActivity = () => {
    // Dispara um evento de movimento de mouse sintético
    const event = new MouseEvent('mousemove', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: Math.random() * window.innerWidth,
      clientY: Math.random() * window.innerHeight
    });
    window.dispatchEvent(event);
    
    // Dispara um evento de scroll minúsculo e volta
    window.scrollBy(0, 1);
    window.scrollBy(0, -1);
    
    setLastActivity(Date.now());
  };

  // 1. Wake Lock API (Manter tela ligada via software)
  useEffect(() => {
    if (!settings.wakeLockActive) return;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          setWakeLockEnabled(true);
          
          document.addEventListener('visibilitychange', async () => {
            if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
              wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
            }
          });
        }
      } catch (err: any) {
        console.error(`Erro WakeLock: ${err.message}`);
      }
    };

    requestWakeLock();
    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, [settings.wakeLockActive]);

  // 2. Coração de Atividade (Eventos Sintéticos a cada 30 segundos)
  useEffect(() => {
    const heartbeat = setInterval(simulateActivity, 30000);
    return () => clearInterval(heartbeat);
  }, []);

  // 3. Jitter de Pixel (Movimento Físico da Tela a cada 2 minutos)
  useEffect(() => {
    if (!settings.pixelJitter) return;

    const interval = setInterval(() => {
      // Move 1 pixel alternadamente
      setOffset(prev => ({
        x: prev.x === 0 ? 1 : 0,
        y: prev.y === 0 ? 1 : 0
      }));
      simulateActivity(); // Reforça a atividade no momento do pulo
    }, 120000); // 2 minutos (2 * 60 * 1000)

    return () => clearInterval(interval);
  }, [settings.pixelJitter]);

  return (
    <div 
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-black"
      style={{ 
        padding: '2px',
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: 'transform 0.1s ease-in-out'
      }}
    >
      {/* 4. Hack de Vídeo (Obrigatório para TVs LG) */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="fixed opacity-[0.01] w-1 h-1 pointer-events-none"
      >
        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
      </video>

      {/* Conteúdo Principal */}
      {settings.url ? (
        <iframe
          src={settings.url}
          className="w-full h-full border-none rounded-sm"
          title="Kiosk Content"
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <p className="text-2xl font-bold uppercase tracking-widest">Aguardando URL...</p>
        </div>
      )}

      {/* Status Bar (Discreta) */}
      <div className="absolute bottom-4 left-4 flex items-center space-x-3 opacity-5 hover:opacity-100 transition-opacity duration-500">
         <div className="bg-black/90 px-4 py-2 rounded-xl border border-white/10 flex items-center space-x-3 shadow-2xl">
            <div className={`w-2 h-2 rounded-full ${wakeLockEnabled ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} />
            <div className="flex flex-col">
              <span className="text-[9px] text-white/40 font-bold uppercase tracking-tighter">Status Atividade</span>
              <span className="text-[10px] text-white font-mono leading-none">
                {new Date(lastActivity).toLocaleTimeString()}
              </span>
            </div>
         </div>
         <button 
           onClick={onExit}
           className="bg-white/10 hover:bg-red-600 text-white text-[10px] px-4 py-2 rounded-xl border border-white/10 transition-all font-bold"
         >
           SAIR
         </button>
      </div>
      
      {/* Cursor Virtual (Simula movimento visual na tela) */}
      <div 
        className="absolute w-2 h-2 bg-blue-500/20 rounded-full blur-[1px] pointer-events-none"
        style={{
          top: `${Math.random() * 80 + 10}%`,
          left: `${Math.random() * 80 + 10}%`,
          transition: 'all 1.5s ease-in-out'
        }}
      />
    </div>
  );
};

export default KioskRunner;

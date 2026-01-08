
import React, { useEffect, useState, useRef } from 'react';
import { AppSettings } from '../types';

interface KioskRunnerProps {
  settings: AppSettings;
  onExit: () => void;
}

const KioskRunner: React.FC<KioskRunnerProps> = ({ settings, onExit }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0, rotate: 0 });
  const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [breathingOpacity, setBreathingOpacity] = useState(0.01);
  const wakeLockRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // 1. Simulação de Atividade (Mouse + Scroll + LocalStorage)
  const performActivity = () => {
    // Eventos de Mouse
    const event = new MouseEvent('mousemove', {
      view: window, bubbles: true, cancelable: true,
      clientX: Math.random() * window.innerWidth,
      clientY: Math.random() * window.innerHeight
    });
    window.dispatchEvent(event);
    
    // Forçar escrita no disco (ajuda em alguns firmwares de TV)
    localStorage.setItem('webos_keepalive', Date.now().toString());
    
    window.focus();
    setLastUpdate(Date.now());
  };

  // 2. Heartbeat de Áudio - PULSOS (Mais eficaz que tom contínuo)
  useEffect(() => {
    const playPulse = () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1, ctx.currentTime); 
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } catch (e) { console.debug("Audio pulse failed"); }
    };

    // Pulsa a cada 20 segundos
    const interval = setInterval(playPulse, 20000);
    return () => clearInterval(interval);
  }, []);

  // 3. Efeito de Respiração (Muda 100% dos pixels da tela levemente)
  useEffect(() => {
    let step = 0.001;
    const interval = setInterval(() => {
      setBreathingOpacity(prev => {
        if (prev >= 0.02) step = -0.001;
        if (prev <= 0.005) step = 0.001;
        return prev + step;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // 4. Wake Lock API com Re-solicitação Agressiva
  useEffect(() => {
    if (!settings.wakeLockActive) return;
    const requestLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          setWakeLockEnabled(true);
        }
      } catch (e) { setWakeLockEnabled(false); }
    };
    
    requestLock();
    const interval = setInterval(requestLock, 60000); // Tenta renovar a cada minuto
    return () => {
      clearInterval(interval);
      wakeLockRef.current?.release();
    };
  }, [settings.wakeLockActive]);

  // 5. Jitter de Movimento e Rotação (A cada 2 minutos)
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setOffset(prev => ({
        x: prev.x === 0 ? 3 : 0,
        y: prev.y === 0 ? 3 : 0,
        rotate: prev.rotate === 0 ? 0.05 : 0 // Rotação mínima de 0.05 graus
      }));

      setCursorPos({
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80
      });

      performActivity();
    }, 120000);

    const activityInterval = setInterval(performActivity, 10000);
    return () => {
      clearInterval(moveInterval);
      clearInterval(activityInterval);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      
      {/* CAMADA DE RESPIRAÇÃO: Um overlay que muda de opacidade constantemente */}
      <div 
        className="fixed inset-0 pointer-events-none z-[60] bg-white transition-opacity duration-1000"
        style={{ opacity: breathingOpacity }}
      />

      {/* VÍDEO HACK: Ocupando 100% mas quase invisível */}
      <video 
        autoPlay loop muted playsInline 
        className="fixed inset-0 w-full h-full object-cover opacity-[0.01] pointer-events-none z-0"
      >
        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
      </video>

      {/* CONTEÚDO COM JITTER E ROTAÇÃO */}
      <div 
        className="relative w-full h-full z-10 transition-all duration-700 ease-in-out"
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.rotate}deg)`,
          width: '101%', // Ligeiramente maior para a rotação não mostrar bordas pretas
          height: '101%',
          left: '-0.5%',
          top: '-0.5%'
        }}
      >
        {settings.url ? (
          <iframe
            src={settings.url}
            className="w-full h-full border-none"
            title="Kiosk Content"
            id="kiosk-iframe"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white/20">
            <p className="text-xl">CARREGANDO...</p>
          </div>
        )}
      </div>

      {/* CURSOR FANTASMA ANIMADO */}
      <div 
        className="absolute w-8 h-8 bg-white/5 rounded-full border border-white/5 pointer-events-none z-50 blur-[4px] animate-pulse"
        style={{ 
          left: `${cursorPos.x}%`, 
          top: `${cursorPos.y}%`,
          transition: 'all 5s ease-in-out' 
        }}
      />

      {/* STATUS DISCRETO */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 opacity-0 hover:opacity-100 transition-opacity z-[100]">
        <div className="bg-black/60 px-3 py-1 rounded-full text-[8px] font-mono text-white/40">
          WAKE_LOCK: {wakeLockEnabled ? 'ACTIVE' : 'FAIL'} | {new Date(lastUpdate).toLocaleTimeString()}
        </div>
        <button onClick={onExit} className="bg-white/10 text-white/40 px-3 py-1 rounded-full text-[8px]">SAIR</button>
      </div>
    </div>
  );
};

export default KioskRunner;

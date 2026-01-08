
import React, { useEffect, useState, useRef } from 'react';
import { AppSettings } from '../types';

interface KioskRunnerProps {
  settings: AppSettings;
  onExit: () => void;
}

const KioskRunner: React.FC<KioskRunnerProps> = ({ settings, onExit }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const wakeLockRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // 1. Simulação de Atividade Agressiva
  const performActivity = () => {
    // Eventos sintéticos para o motor do navegador
    const event = new MouseEvent('mousemove', {
      view: window, bubbles: true, cancelable: true,
      clientX: Math.random() * window.innerWidth,
      clientY: Math.random() * window.innerHeight
    });
    window.dispatchEvent(event);
    
    // Pequeno scroll imperceptível
    window.scrollBy(0, 1);
    window.scrollBy(0, -1);
    
    // Mudar o título da página (alguns sistemas monitoram isso)
    document.title = `KeepAlive [${new Date().getSeconds()}]`;
    setLastUpdate(Date.now());
  };

  // 2. Heartbeat de Canvas (Mantém a GPU acordada)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const render = () => {
      frame++;
      // Desenha um único pixel mudando de cor a cada frame
      ctx.fillStyle = `rgba(255,255,255,${(frame % 2) * 0.01})`;
      ctx.fillRect(0, 0, 1, 1);
      requestAnimationFrame(render);
    };
    render();
  }, []);

  // 3. Wake Lock API
  useEffect(() => {
    if (!settings.wakeLockActive) return;
    const requestLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          setWakeLockEnabled(true);
        }
      } catch (e) { console.error(e); }
    };
    requestLock();
    return () => { wakeLockRef.current?.release(); };
  }, [settings.wakeLockActive]);

  // 4. O MOVIMENTO SOLICITADO (A cada 2 minutos)
  useEffect(() => {
    const interval = setInterval(() => {
      // 1px de jitter no conteúdo
      setOffset(prev => ({
        x: prev.x === 0 ? 2 : 0, // Usando 2px para maior eficácia
        y: prev.y === 0 ? 2 : 0
      }));

      // Move o "Cursor Fantasma" 1px
      setCursorPos(prev => ({
        x: prev.x + (Math.random() > 0.5 ? 0.1 : -0.1),
        y: prev.y + (Math.random() > 0.5 ? 0.1 : -0.1)
      }));

      performActivity();
    }, 120000); // Exatos 2 minutos

    // Atividade secundária mais frequente (30s)
    const subInterval = setInterval(performActivity, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(subInterval);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Canvas Invisível para manter GPU ativa */}
      <canvas ref={canvasRef} width="1" height="1" className="fixed top-0 left-0 opacity-0 pointer-events-none" />

      {/* VÍDEO HACK: Tela cheia com opacidade quase zero é mais eficaz na LG */}
      <video 
        autoPlay loop muted playsInline 
        className="fixed inset-0 w-full h-full object-cover opacity-[0.005] pointer-events-none z-0"
      >
        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
      </video>

      {/* CONTEÚDO COM JITTER */}
      <div 
        className="relative w-full h-full z-10 transition-transform duration-500 ease-in-out"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        {settings.url ? (
          <iframe
            src={settings.url}
            className="w-full h-full border-none"
            title="Kiosk Content"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white/20">
            <p className="text-xl animate-pulse">CARREGANDO DASHBOARD...</p>
          </div>
        )}
      </div>

      {/* CURSOR FANTASMA (Simula o ponteiro do controle Magic) */}
      <div 
        className="absolute w-4 h-4 bg-white/10 rounded-full border border-white/5 pointer-events-none z-50 blur-[1px]"
        style={{ 
          left: `${cursorPos.x}%`, 
          top: `${cursorPos.y}%`,
          transition: 'all 120s linear' 
        }}
      />

      {/* BARRA DE STATUS (Extremamente discreta para não queimar pixels) */}
      <div className="absolute top-2 right-2 flex items-center space-x-2 opacity-0 hover:opacity-100 transition-opacity">
        <div className="text-[8px] font-mono text-white/20 bg-black/50 px-2 py-1 rounded">
          {wakeLockEnabled ? 'LOCK_OK' : 'LOCK_ERR'} | {new Date(lastUpdate).toLocaleTimeString()}
        </div>
        {/* Fix: Closing tag corrected from </div> to </button> to resolve JSX parsing error */}
        <button onClick={onExit} className="text-[8px] bg-red-900/20 text-red-500 px-2 py-1 rounded border border-red-500/20">
          SAIR
        </button>
      </div>
    </div>
  );
};

export default KioskRunner;

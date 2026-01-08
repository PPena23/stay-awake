
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

  // 1. Wake Lock API: Comando direto ao navegador para não apagar a tela
  useEffect(() => {
    if (!settings.wakeLockActive) return;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          setWakeLockEnabled(true);
          console.log('Wake Lock ativado com sucesso.');
          
          // Re-solicitar se a aba voltar a ficar visível (WebOS pode liberar o lock se minimizar)
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

  // 2. Jitter de Pixel (Movimento Pixel a Pixel):
  // Desloca o container inteiro 1px para forçar re-renderização da GPU a cada 3 minutos (180000ms)
  useEffect(() => {
    if (!settings.pixelJitter) return;

    const interval = setInterval(() => {
      setOffset(prev => ({
        x: prev.x === 0 ? 1 : 0,
        y: prev.y === 0 ? 1 : 0
      }));
      setLastActivity(Date.now());
    }, 180000); // Alterado para 3 minutos (3 * 60 * 1000)

    return () => clearInterval(interval);
  }, [settings.pixelJitter]);

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden bg-black"
      style={{ 
        padding: '2px', // Espaço para o jitter de 1px não cortar conteúdo
        transform: `translate(${offset.x}px, ${offset.y}px)` 
      }}
    >
      {/* 3. Silent Video Hack: Truque clássico para WebOS não entrar em standby */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="fixed opacity-0 w-1 h-1 pointer-events-none"
      >
        <source src="https://raw.githubusercontent.com/anars/blank-audio/master/10-seconds-of-silence.mp3" type="audio/mp3" />
        {/* Usando um source de vídeo pequeno e leve */}
        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
      </video>

      {/* iframe do conteúdo principal */}
      {settings.url ? (
        <iframe
          src={settings.url}
          className="w-full h-full border-none rounded-sm"
          title="Kiosk Content"
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <p className="text-2xl">Aguardando URL...</p>
        </div>
      )}

      {/* Indicadores discretos e Botão de Saída */}
      <div className="absolute top-4 right-4 flex items-center space-x-3 opacity-10 hover:opacity-100 transition-opacity duration-500">
         <div className="bg-black/80 px-3 py-1.5 rounded-full border border-white/20 flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${wakeLockEnabled ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-[10px] text-white/70 font-mono tracking-tighter">
               {wakeLockEnabled ? 'ACTIVE_LOCK' : 'WAIT_LOCK'} | ATUALIZADO: {new Date(lastActivity).toLocaleTimeString()}
            </span>
         </div>
         <button 
           onClick={onExit}
           className="bg-red-600/20 hover:bg-red-600 text-white text-[10px] px-3 py-1.5 rounded-full border border-red-500/50 transition-colors"
         >
           SAIR
         </button>
      </div>
      
      {/* Simulação de Micro-Atividade Visual (Cursor invisível se movendo) */}
      <div 
        className="absolute w-1 h-1 bg-white/5 rounded-full pointer-events-none"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          transition: 'all 5s linear'
        }}
      />
    </div>
  );
};

export default KioskRunner;

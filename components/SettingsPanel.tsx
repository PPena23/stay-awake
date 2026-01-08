
import React from 'react';
import { AppSettings } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
  onStart: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdate, onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#050505] text-white">
      <div className="max-w-xl w-full bg-[#111] p-10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5">
        <header className="mb-10 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
            WebOS 25 Optimized
          </div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
            StayAwake TV
          </h1>
          <p className="text-slate-500 text-sm">
            Utilitário Ant-Standby para LG NanoCell
          </p>
        </header>

        <div className="space-y-8">
          <div className="group">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">
              URL do Dashboard / Site
            </label>
            <input
              type="text"
              value={settings.url}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="https://exemplo.com/meu-dashboard"
              className="w-full bg-black border border-white/10 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-lg text-blue-100 placeholder:text-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => onUpdate({ wakeLockActive: !settings.wakeLockActive })}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                settings.wakeLockActive ? 'bg-blue-500/5 border-blue-500/30' : 'bg-transparent border-white/5 opacity-50'
              }`}
            >
              <div className="text-left">
                <p className="font-bold text-sm">Wake Lock API</p>
                <p className="text-[10px] text-slate-500 uppercase">Prevenção via Software</p>
              </div>
              <div className={`w-10 h-6 rounded-full relative transition-colors ${settings.wakeLockActive ? 'bg-blue-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.wakeLockActive ? 'left-5' : 'left-1'}`} />
              </div>
            </button>

            <button
              onClick={() => onUpdate({ pixelJitter: !settings.pixelJitter })}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                settings.pixelJitter ? 'bg-blue-500/5 border-blue-500/30' : 'bg-transparent border-white/5 opacity-50'
              }`}
            >
              <div className="text-left">
                <p className="font-bold text-sm">Jitter de Pixel</p>
                <p className="text-[10px] text-slate-500 uppercase">Movimento Pixel-a-Pixel ativo</p>
              </div>
              <div className={`w-10 h-6 rounded-full relative transition-colors ${settings.pixelJitter ? 'bg-blue-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.pixelJitter ? 'left-5' : 'left-1'}`} />
              </div>
            </button>
          </div>

          <button
            onClick={onStart}
            className="w-full bg-white text-black font-black py-5 rounded-2xl shadow-xl hover:bg-blue-50 transform active:scale-[0.98] transition-all text-xl mt-4"
          >
            INICIAR MODO KIOSK
          </button>
        </div>

        <footer className="mt-12 pt-8 border-t border-white/5">
          <div className="flex items-start space-x-4 text-left">
            <div className="bg-yellow-500/10 p-2 rounded-lg">
              <span className="text-yellow-500 text-lg block">⚠️</span>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                DICA: Após iniciar, pressione o botão "OK" do controle remoto para garantir que o navegador 
                registre uma interação inicial. Coloque o navegador em <strong className="text-white">Tela Cheia</strong> para melhores resultados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SettingsPanel;

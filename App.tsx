
import React, { useState, useEffect } from 'react';
import { AppSettings, AppStatus } from './types';
import SettingsPanel from './components/SettingsPanel';
import KioskRunner from './components/KioskRunner';

const STORAGE_KEY = 'stayawake_tv_settings';

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      url: '',
      isKioskActive: false,
      pixelJitter: true,
      wakeLockActive: true
    };
  });

  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const handleStart = () => {
    if (!settings.url) {
      alert('Por favor, insira uma URL válida.');
      return;
    }
    setStatus(AppStatus.RUNNING);
  };

  const handleExit = () => {
    setStatus(AppStatus.IDLE);
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden select-none">
      {status === AppStatus.IDLE ? (
        <SettingsPanel 
          settings={settings} 
          onUpdate={handleUpdateSettings} 
          onStart={handleStart} 
        />
      ) : (
        <KioskRunner 
          settings={settings} 
          onExit={handleExit} 
        />
      )}
    </div>
  );
};

export default App;

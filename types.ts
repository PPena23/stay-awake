
export interface AppSettings {
  url: string;
  isKioskActive: boolean;
  pixelJitter: boolean;
  wakeLockActive: boolean;
}

export enum AppStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  ERROR = 'ERROR'
}

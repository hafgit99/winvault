
export interface Attachment {
  id: string;
  name: string;
  type: string; // mime type
  size: number;
  data: string; // Base64 string
  uploadedAt: number;
}

export interface Credential {
  id: string;
  type: 'LOGIN' | 'CARD' | 'NOTE' | 'DOCUMENT'; // Veri tipi ayrımı
  siteName: string; // Login için Site Adı, Kart için Banka Adı, Not için Başlık
  username?: string; // Sadece Login
  alias?: string; // Takma Ad (Görünen İsim)
  passwordValue?: string; // Sadece Login

  // Kredi Kartı Alanları
  cardHolder?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;

  category: string;
  notes?: string; // Not içeriği buraya kaydedilir
  updatedAt: number;
  deletedAt?: number; // Silinme zamanı (Soft Delete için)

  // Yeni Özellikler
  isFavorite?: boolean;
  lastUsed?: number;

  // Geçmiş
  history?: { date: number; value: string }[];

  // Dosya Ekleri
  attachments?: Attachment[];

  // TOTP & Custom Fields
  totpSecret?: string;
  customFields?: { label: string; value: string }[];
}

export interface Category {
  id: string;
  name: string;
  isSystem: boolean;
}

export interface SecurityAnalysis {
  score: number; // 0-100
  feedback: string;
  suggestions: string[];
}

export enum AppView {
  VAULT = 'VAULT',
  DOCUMENTS = 'DOCUMENTS',
  GENERATOR = 'GENERATOR',
  SETTINGS = 'SETTINGS'
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface RateLimitResult {
  allowed: boolean;
  waitTime: number;
  remainingAttempts?: number;
  lockDuration?: string;
}

export interface GeneratorSettings {
  mode: 'random' | 'memorable'; // Yeni Mod Seçimi
  length: number;
  includeUppercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  // Memorable Ayarları
  wordCount: number;
  separator: string;
  capitalize: boolean;
}

export interface SecurityConfig {
  masterPasswordHash: string; // SHA-256 Hash
  duressPasswordHash?: string; // Sahte Kasa Hash (Optional)
  is2FAEnabled: boolean;
  totpSecret?: string; // Base32 Secret
  isWordAuthEnabled: boolean;
  recoveryWords?: string[]; // 16 Words
  licenseType?: 'FREE' | 'PRO';
  // Offline license details (for PRO)
  licenseToken?: string; // Base64 encoded signed license blob
  licenseExpiresAt?: string | null;
  licenseDeviceId?: string;
  autoLockTimeout: number; // ms, 0 means never
  isAutoBackupEnabled?: boolean;
  autoBackupPath?: string; // Absolute path to backup folder
  isBiometricEnabled?: boolean;
  encryptedMasterKey?: string; // Encrypted master key (AES/Electron safeStorage)
}

export type Language = 'tr' | 'en';
export type Theme = 'light' | 'dark' | 'amoled';

// Extend Window interface for Electron
declare global {
  interface Window {
    electron?: {
      setMiniMode: () => void;
      setNormalMode: () => void;
      onGlobalShortcut: (callback: () => void) => void;
      panic: () => void;
      onAutoTypeRequest: (callback: (event: any, title: string) => void) => void;
      performAutoType: (data: { username: string, password: string }) => void;
      selectBackupFolder: () => Promise<string | null>;
      saveBackupFile: (path: string, content: string) => Promise<boolean>;
      // Biometric & Secure Storage
      checkBiometry: () => Promise<boolean>;
      promptBiometry: (reason: string) => Promise<boolean>;
      encryptKey: (key: string) => Promise<string>;
      decryptKey: (encryptedKey: string) => Promise<string>;
      getDeviceId: () => Promise<string>;
      onExtensionSearchRequest: (callback: (event: any, domain: string) => void) => void;
      sendExtensionSearchResponse: (results: any[]) => void;
      onExtensionSaveRequest: (callback: (event: any, payload: { domain: string; username: string; password: string }) => void) => void;
      sendExtensionSaveResponse: (payload: { ok: boolean; reason?: string }) => void;
      saveFile: (name: string, data: string) => Promise<boolean>;
    }
  }
}

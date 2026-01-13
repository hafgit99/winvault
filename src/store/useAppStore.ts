import { create } from 'zustand';
import { AppView, Language, Theme, GeneratorSettings, SecurityConfig, ToastNotification } from '../types';

interface AppState {
    // Auth & Security
    isLocked: boolean;
    masterKey: string;
    isDuressMode: boolean;
    isDataLoaded: boolean;
    securityConfig: SecurityConfig;
    isBiometrySupported: boolean;
    needsSecureSetup: boolean;

    // UI State
    currentView: AppView;
    isMiniMode: boolean;
    isCommandPaletteOpen: boolean;
    toasts: ToastNotification[];
    isBackupModalOpen: boolean;
    isRestoreModalOpen: boolean;
    isGuideOpen: boolean;
    isPrivacyModalOpen: boolean;
    isExportModalOpen: boolean;
    isPaymentModalOpen: boolean;
    isAdminMode: boolean;

    // Settings
    lang: Language;
    theme: Theme;
    genSettings: GeneratorSettings;
    isPro: boolean;
    installDate: number;

    // transient Setup / Form States
    setup2FAStep: number;
    tempSecret: string;
    verifyCode: string;
    setupWordStep: number;
    tempWords: string[];
    exportFormat: 'CSV' | 'JSON' | 'WINVAULT';
    isExportEncrypted: boolean;
    exportPassword: string;
    selectedCoin: string;

    // Actions
    setIsLocked: (isLocked: boolean) => void;
    setMasterKey: (key: string) => void;
    setIsDuressMode: (isDuress: boolean) => void;
    setIsDataLoaded: (isLoaded: boolean) => void;
    setSecurityConfig: (config: SecurityConfig) => void;
    setIsBiometrySupported: (supported: boolean) => void;
    setNeedsSecureSetup: (needs: boolean) => void;
    setCurrentView: (view: AppView) => void;
    setIsMiniMode: (isMiniMod: boolean) => void;
    setCommandPaletteOpen: (isOpen: boolean) => void;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
    removeToast: (id: string) => void;
    setLang: (lang: Language) => void;
    setTheme: (theme: Theme) => void;
    setGenSettings: (settings: GeneratorSettings) => void;
    setIsPro: (isPro: boolean) => void;
    setInstallDate: (date: number) => void;

    // UI Toggle Actions
    setBackupModalOpen: (open: boolean) => void;
    setRestoreModalOpen: (open: boolean) => void;
    setGuideOpen: (open: boolean) => void;
    setPrivacyModalOpen: (open: boolean) => void;
    setExportModalOpen: (open: boolean) => void;
    setPaymentModalOpen: (open: boolean) => void;
    setAdminMode: (admin: boolean) => void;

    // Setup Actions
    setSetup2FAStep: (step: number) => void;
    setTempSecret: (secret: string) => void;
    setVerifyCode: (code: string) => void;
    setSetupWordStep: (step: number) => void;
    setTempWords: (words: string[]) => void;
    setExportFormat: (format: 'CSV' | 'JSON' | 'WINVAULT') => void;
    setExportEncrypted: (enc: boolean) => void;
    setExportPassword: (pass: string) => void;
    setSelectedCoin: (coin: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
    isLocked: true,
    masterKey: '',
    isDuressMode: false,
    isDataLoaded: false,
    securityConfig: {
        masterPasswordHash: '',
        is2FAEnabled: false,
        isWordAuthEnabled: false,
        recoveryWords: [],
        licenseType: 'FREE',
        autoLockTimeout: 300000
    },
    isBiometrySupported: false,
    needsSecureSetup: false,

    currentView: AppView.VAULT,
    isMiniMode: false,
    isCommandPaletteOpen: false,
    toasts: [],
    isBackupModalOpen: false,
    isRestoreModalOpen: false,
    isGuideOpen: false,
    isPrivacyModalOpen: false,
    isExportModalOpen: false,
    isPaymentModalOpen: false,
    isAdminMode: false,

    lang: 'tr',
    theme: 'dark',
    genSettings: {
        mode: 'random',
        length: 16,
        includeUppercase: true,
        includeNumbers: true,
        includeSymbols: true,
        wordCount: 3,
        separator: '-',
        capitalize: true
    },
    isPro: false,
    installDate: Date.now(),

    setup2FAStep: 0,
    tempSecret: '',
    verifyCode: '',
    setupWordStep: 0,
    tempWords: [],
    exportFormat: 'CSV',
    isExportEncrypted: false,
    exportPassword: '',
    selectedCoin: 'BTC',

    setIsLocked: (isLocked) => set({ isLocked }),
    setMasterKey: (masterKey) => set({ masterKey }),
    setIsDuressMode: (isDuressMode) => set({ isDuressMode }),
    setIsDataLoaded: (isDataLoaded) => set({ isDataLoaded }),
    setSecurityConfig: (securityConfig) => set({ securityConfig }),
    setIsBiometrySupported: (isBiometrySupported) => set({ isBiometrySupported }),
    setNeedsSecureSetup: (needsSecureSetup) => set({ needsSecureSetup }),
    setCurrentView: (currentView) => set({ currentView }),
    setIsMiniMode: (isMiniMode) => {
        set({ isMiniMode });
    },
    setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
    addToast: (message, type) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, 3000);
    },
    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    setLang: (lang) => set({ lang }),
    setTheme: (theme) => set({ theme }),
    setGenSettings: (genSettings) => set({ genSettings }),
    setIsPro: (isPro) => set({ isPro }),
    setInstallDate: (installDate) => set({ installDate }),

    setBackupModalOpen: (isBackupModalOpen) => set({ isBackupModalOpen }),
    setRestoreModalOpen: (isRestoreModalOpen) => set({ isRestoreModalOpen }),
    setGuideOpen: (isGuideOpen) => set({ isGuideOpen }),
    setPrivacyModalOpen: (isPrivacyModalOpen) => set({ isPrivacyModalOpen }),
    setExportModalOpen: (isExportModalOpen) => set({ isExportModalOpen }),
    setPaymentModalOpen: (isPaymentModalOpen) => set({ isPaymentModalOpen }),
    setAdminMode: (isAdminMode) => set({ isAdminMode }),

    setSetup2FAStep: (setup2FAStep) => set({ setup2FAStep }),
    setTempSecret: (tempSecret) => set({ tempSecret }),
    setVerifyCode: (verifyCode) => set({ verifyCode }),
    setSetupWordStep: (setupWordStep) => set({ setupWordStep }),
    setTempWords: (tempWords) => set({ tempWords }),
    setExportFormat: (exportFormat) => set({ exportFormat }),
    setExportEncrypted: (isExportEncrypted) => set({ isExportEncrypted }),
    setExportPassword: (exportPassword) => set({ exportPassword }),
    setSelectedCoin: (selectedCoin) => set({ selectedCoin }),
}));

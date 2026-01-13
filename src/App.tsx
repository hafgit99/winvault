import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Vault from './components/Vault';
import PasswordGenerator from './components/PasswordGenerator';
import MasterLogin from './components/MasterLogin';
import UserGuide from './components/UserGuide';
import CommandPalette from './components/CommandPalette';
import SettingsView from './components/App/SettingsView';
import ExportModal from './components/App/ExportModal';
import RestoreModal from './components/App/RestoreModal';
import PaymentModal from './components/App/PaymentModal';
import PrivacyModal from './components/App/PrivacyModal';

import { AppView, ToastNotification, Credential, SecurityConfig, Language, Theme } from './types';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import {
  hashPassword, verifyPassword, generateTOTPSecret, getTOTPUri, encryptData, decryptData,
  TRANSLATIONS, getDeviceId, setGlobalDeviceId,
  verifyOfflineLicense, parseCSV, exportToCSV, exportToJSON, verifyTOTP, generateRecoveryWords,
  initializeMemorySecurity, initializeEnhancedMemorySecurity,
  wasmSecurityManager, AdvancedValidator, AdvancedSessionManager, AdvancedSecureClipboard
} from './utils';
import { dbService } from './services/idb';
import QRCode from 'qrcode';
import { useAppStore } from './store/useAppStore';
import { useVaultStore } from './store/useVaultStore';
import { useClipboardTimeout } from './hooks/useClipboardTimeout';


// Statik importlar temizlendi ve utils üzerinden import edildi


const TRIAL_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 Days

const App: React.FC = () => {
  // Stores
  const {
    lang, theme, currentView, setCurrentView, isPro, setIsPro, installDate, setInstallDate,
    securityConfig, setSecurityConfig, genSettings, setGenSettings, isLocked, setIsLocked,
    masterKey, setMasterKey, isDuressMode, setIsDuressMode, isMiniMode, setIsMiniMode,
    isExportModalOpen, setExportModalOpen, exportFormat, setExportFormat, exportPassword, setExportPassword,
    isExportEncrypted, setExportEncrypted, setRestoreModalOpen, isPaymentModalOpen, setPaymentModalOpen,
    isPrivacyModalOpen, setPrivacyModalOpen, isGuideOpen, setGuideOpen, selectedCoin,
    setCommandPaletteOpen, needsSecureSetup, setNeedsSecureSetup, isAdminMode, isRestoreModalOpen
  } = useAppStore();

  const {
    credentials, categories, setCredentials, setCategories,
    addCredential, updateCredential, addCategory, deleteCategory
  } = useVaultStore();

  // Local UI State
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [idleTimer, setIdleTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [highlightedCredentialId, setHighlightedCredentialId] = useState<string | null>(null);
  const [forceVaultAddModal, setForceVaultAddModal] = useState(false);

  // Settings Logic State
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [showLicenseInput, setShowLicenseInput] = useState(true);
  const [isBiometrySupported, setIsBiometrySupported] = useState(false);
  const [activeDeviceId, setActiveDeviceId] = useState(getDeviceId());

  const [currentPassForChange, setCurrentPassForChange] = useState('');
  const [newPass1, setNewPass1] = useState('');
  const [newPass2, setNewPass2] = useState('');

  const [setup2FAStep, setSetup2FAStep] = useState(0);
  const [tempSecret, setTempSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  const [setupWordStep, setSetupWordStep] = useState(0);
  const [tempWords, setTempWords] = useState<string[]>([]);

  const [restorePassword, setRestorePasswordLocal] = useState('');
  const [restoreFileContent, setRestoreFileContent] = useState<string | null>(null);
  const [defaultPassHash, setDefaultPassHash] = useState('');

  const importInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const t = TRANSLATIONS[lang];

  // Logic Helpers
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };











  // Initialize all enhanced security systems
  useEffect(() => {
    const initializeAllSecurity = async () => {
      try {
        initializeMemorySecurity();
        initializeEnhancedMemorySecurity();

        await wasmSecurityManager.initialize({
          enableWASMSecurity: true,
          enableHardwareBinding: true,
          enableAntiDebugging: true,
          securityLevel: 'enhanced'
        });

        await AdvancedSessionManager.initialize({
          maxSessionDuration: 60 * 60 * 1000,
          maxInactivityTime: 15 * 60 * 1000,
          enableHardwareBinding: true,
          enableBiometricEnhancement: true,
          securityLevel: 'enhanced',
          enforceStrictTimeout: true
        });

        await AdvancedSecureClipboard.initialize();

        console.log('🔒 All enhanced security systems initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize enhanced security:', error);
      }
    };

    initializeAllSecurity();
  }, []);

  // Initialization
  useEffect(() => {
    const initApp = async () => {
      try {
        await dbService.init();
        const savedConfig = await dbService.getSecurityConfig();
        if (savedConfig) {
          if (savedConfig.autoLockTimeout === undefined) savedConfig.autoLockTimeout = 300000;
          if (savedConfig.clipboardTimeout === undefined) savedConfig.clipboardTimeout = 30000;
          setSecurityConfig(savedConfig);
          setIsPro(savedConfig.licenseType === 'PRO');
          setShowLicenseInput(savedConfig.licenseType !== 'PRO');

          if (savedConfig.masterPasswordHash.includes('d3ad9315b7be5dd')) {
            setNeedsSecureSetup(true);
          }
        } else {
          setNeedsSecureSetup(true);
        }

        const savedSettings = await dbService.getSettings();
        if (savedSettings) {
          setGenSettings({ ...genSettings, ...savedSettings.genSettings });
          if (savedSettings.lang) useAppStore.getState().setLang(savedSettings.lang as Language);
          if (savedSettings.theme) useAppStore.getState().setTheme(savedSettings.theme as Theme);
          if (savedSettings.installDate) setInstallDate(savedSettings.installDate);
        } else {
          const now = Date.now();
          setInstallDate(now);
          dbService.saveSettings({ genSettings, lang, theme, isPro: false, installDate: now });
        }

        const savedCategories = await dbService.getCategories();
        if (savedCategories && savedCategories.length > 0) setCategories(savedCategories);

        if (window.electron?.checkBiometry) {
          const supported = await window.electron.checkBiometry();
          setIsBiometrySupported(supported);
        }

        if (window.electron?.getDeviceId) {
          window.electron.getDeviceId().then((hwId: string) => {
            setGlobalDeviceId(hwId);
            setActiveDeviceId(hwId);
          }).catch((err: any) => console.error("HWID Failed", err));
        }

        setIsLocked(true);
        setIsDataLoaded(true);
      } catch (err) {
        console.error("Init failed", err);
        addToast("Veritabanı başlatılamadı!", "error");
      }
    };
    initApp();
  }, []); // Run only once on mount

  useEffect(() => {
    if (!window.electron) return;

    if (window.electron.onExtensionSearchRequest) {
      window.electron.onExtensionSearchRequest(async (_event: any, domain: string) => {
        const { isLocked, masterKey } = useAppStore.getState();
        if (isLocked || !masterKey) {
          window.electron?.sendExtensionSearchResponse([]);
          return;
        }

        const allCreds = useVaultStore.getState().credentials;
        let matches;

        if (domain === "all") {
          matches = allCreds.filter(c => !c.deletedAt && c.type === 'LOGIN');
        } else {
          const lowerDomain = domain.toLowerCase();
          // Domain parçalama (örn: www.google.com -> google)
          const domainParts = lowerDomain.split('.');
          let mainDomain = lowerDomain;

          // TLD hariç ana domaini bulmaya çalış (basit yaklaşım)
          if (domainParts.length > 2) { // www.google.com
            mainDomain = domainParts[domainParts.length - 2];
          } else if (domainParts.length === 2) { // google.com
            mainDomain = domainParts[0];
          }

          matches = allCreds.filter(c => {
            if (c.deletedAt) return false;
            if (c.type !== 'LOGIN') return false;

            const siteName = (c.siteName || '').toLowerCase().trim();
            const notes = (c.notes || '').toLowerCase().trim();
            const username = (c.username || '').toLowerCase().trim();

            if (!siteName && !notes && !username) return false;

            // 1. Site Adı tam içeriyorsa (örn: "google")
            if (siteName && (siteName.includes(lowerDomain) || lowerDomain.includes(siteName))) return true;

            // 2. Ana domain eşleşmesi (örn: "google" kelimesi site adında geçiyorsa)
            if (mainDomain.length > 3 && siteName.includes(mainDomain)) return true;

            // 3. Notlar içinde domain geçiyorsa
            if (notes.includes(lowerDomain)) return true;

            // 4. Kullanıcı adı içinde geçiyorsa
            if (username.includes(lowerDomain)) return true;

            return false;
          });
        }

        const results = await Promise.all(matches.map(async (c) => {
          let plainPass = c.passwordValue || '';
          if (plainPass.includes(':') && plainPass.length > 32) {
            try {
              plainPass = await decryptData(plainPass, masterKey);
            } catch (e) { console.error("Ext Decrypt Fail", e); }
          }
          return { siteName: c.siteName, username: c.username || '', password: plainPass };
        }));

        window.electron?.sendExtensionSearchResponse(results);
      });
    }

    if (window.electron.onExtensionSaveRequest) {
      window.electron.onExtensionSaveRequest(async (_event: any, payload: { domain: string; username: string; password: string }) => {
        const { isLocked, masterKey } = useAppStore.getState();
        const { domain, username, password } = payload;
        if (isLocked || !masterKey) {
          addToast("Kilitli durumda: Tarayıcıdan kayıt alınamadı.", "error");
          window.electron?.sendExtensionSaveResponse({ ok: false, reason: 'LOCKED' });
          return;
        }
        const confirmSave = window.confirm(`${domain} için tarayıcıdan gelen giriş bilgisini kasaya kaydetmek istiyor musunuz?\n\nKullanıcı: ${username}`);
        if (!confirmSave) {
          window.electron?.sendExtensionSaveResponse({ ok: false, reason: 'CANCELLED' });
          return;
        }
        addCredential({
          type: 'LOGIN',
          siteName: domain,
          username,
          passwordValue: password,
          category: 'General',
          notes: ''
        });
        addToast("Tarayıcıdan gelen kayıt kasaya eklendi.", "success");
        window.electron?.sendExtensionSaveResponse({ ok: true });
      });
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'amoled');
    if (theme === 'dark' || theme === 'amoled') document.documentElement.classList.add('dark');
    if (theme === 'amoled') document.documentElement.classList.add('amoled');
    if (isDataLoaded) dbService.saveSettings({ genSettings, lang, theme, isPro, installDate });
  }, [theme, genSettings, lang, isPro, installDate, isDataLoaded]);

  useEffect(() => { if (isDataLoaded) dbService.saveSecurityConfig(securityConfig); }, [securityConfig, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) dbService.saveCategories(categories); }, [categories, isDataLoaded]);

  useEffect(() => {
    const saveCreds = async () => {
      if (!isLocked && masterKey) {
        try {
          const encrypted = await encryptData(credentials, masterKey);
          if (isDuressMode) await dbService.saveFakeEncryptedBlob(encrypted);
          else await dbService.saveEncryptedBlob(encrypted);
        } catch (e) { console.error("Save failed", e); }
      }
    };
    const timeout = setTimeout(saveCreds, 1000);
    return () => clearTimeout(timeout);
  }, [credentials, isLocked, masterKey, isDuressMode]);

  // Auto-cleanup Trash older than 30 days
  useEffect(() => {
    if (!isLocked && credentials.length > 0) {
      const DELETE_THRESHOLD = 30 * 24 * 60 * 60 * 1000; // 30 Days
      const now = Date.now();
      const validCredentials = credentials.filter(c => {
        if (!c.deletedAt) return true;
        return (now - c.deletedAt) <= DELETE_THRESHOLD;
      });

      if (validCredentials.length !== credentials.length) {
        setCredentials(validCredentials);
        console.log("Auto-removed expired trash items");
      }
    }
  }, [isLocked, credentials, setCredentials]);

  const handleLock = useCallback(() => {
    setMasterKey('');
    setCredentials([]);
    setIsLocked(true);
    if (isMiniMode && window.electron) {
      window.electron.setNormalMode();
      setIsMiniMode(false);
    }
  }, [isMiniMode, setMasterKey, setCredentials, setIsLocked, setIsMiniMode]);

  const performAutoBackup = useCallback(async () => {
    if (securityConfig.isAutoBackupEnabled && securityConfig.autoBackupPath && window.electron && credentials.length > 0 && masterKey) {
      try {
        const encrypted = await encryptData(credentials, masterKey);
        const filename = `winvault_autobackup_${Date.now()}.winvault`;
        const fullPath = `${securityConfig.autoBackupPath}\\${filename}`;
        await window.electron.saveBackupFile(fullPath, encrypted);
      } catch (e) { console.error("Auto Backup Error:", e); }
    }
  }, [securityConfig, credentials, masterKey]);

  const handleLockWithBackup = useCallback(() => {
    performAutoBackup().then(() => handleLock());
  }, [handleLock, performAutoBackup]);

  const handlePanic = useCallback(() => {
    handleLock();
    navigator.clipboard.writeText('');
    if (window.electron) window.electron.panic();
  }, [handleLock]);

  const handleUnlock = async (password: string) => {
    try {
      // 1. First try standard hash verification
      let isValidPassword = await verifyPassword(password, securityConfig.masterPasswordHash);
      let isDuress = false;

      // 2. Check Duress Password
      if (!isValidPassword && securityConfig.duressPasswordHash) {
        const isDuressValid = await verifyPassword(password, securityConfig.duressPasswordHash);
        if (isDuressValid) isDuress = true;
      }

      // 3. FALLBACK: If hash check fails, try to decrypt anyway (Self-Healing)
      // This handles cases where hash might be corrupted/desync but password is correct
      if (!isValidPassword && !isDuress) {
        console.log("Hash verification failed, attempting direct decryption fallback...");
      }

      const encryptedBlob = isDuress ? await dbService.getFakeEncryptedBlob() : await dbService.getEncryptedBlob();

      let decryptedData = null;
      if (encryptedBlob) {
        try {
          decryptedData = await decryptData(encryptedBlob, password);
          // If we reached here, decryption succeeded! logic confirms password is correct.
          if (!isValidPassword && !isDuress) {
            console.log("Decryption succeeded despite hash failure. Self-healing hash...");
            isValidPassword = true;
            // Self-heal: Update the hash in config
            const { hash } = await hashPassword(password);
            setSecurityConfig({ ...securityConfig, masterPasswordHash: hash });
          }
        } catch (e) {
          // Decryption truly failed
        }
      } else {
        decryptedData = [];
      }

      if (isValidPassword || isDuress || decryptedData) {
        setCredentials(decryptedData || []);
        setMasterKey(password);
        setIsDuressMode(isDuress);
        setIsLocked(false);
        if (isDuress) addToast(t.duressActive, 'info');
      } else {
        addToast(t.wrongPass, 'error');
        const input = document.getElementById('master-password-input');
        if (input) {
          input.classList.add('animate-shake');
          setTimeout(() => input.classList.remove('animate-shake'), 500);
        }
      }

    } catch (e) {
      console.error(e);
      addToast("Giriş hatası", "error");
    }
  };

  useEffect(() => {
    const handleGlobalKbd = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'X')) { e.preventDefault(); handlePanic(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !isLocked) { e.preventDefault(); setCommandPaletteOpen(!useAppStore.getState().isCommandPaletteOpen); }
    };
    window.addEventListener('keydown', handleGlobalKbd);
    return () => window.removeEventListener('keydown', handleGlobalKbd);
  }, [isLocked, handlePanic, setCommandPaletteOpen]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimer) clearTimeout(idleTimer);
    if (!isLocked && securityConfig.autoLockTimeout > 0) {
      const timer = setTimeout(() => { handleLockWithBackup(); addToast(t.autoLockMsg, 'info'); }, securityConfig.autoLockTimeout);
      setIdleTimer(timer);
    }
  }, [isLocked, idleTimer, securityConfig.autoLockTimeout, handleLockWithBackup]);

  useEffect(() => {
    resetIdleTimer();
    window.addEventListener('mousemove', resetIdleTimer); window.addEventListener('keydown', resetIdleTimer);
    return () => { window.removeEventListener('mousemove', resetIdleTimer); window.removeEventListener('keydown', resetIdleTimer); if (idleTimer) clearTimeout(idleTimer); };
  }, []);

  useEffect(() => {
    if (window.electron) {
      window.electron.onGlobalShortcut(() => { if (!isLocked) handleToggleMiniMode(); });
      window.electron.onAutoTypeRequest((_e: any, title: string) => {
        if (isLocked) { if (window.electron) window.electron.setNormalMode(); return; }
        const lowerTitle = title.toLowerCase();
        const matches = credentials.filter(c => !c.deletedAt && c.type !== 'NOTE' && (c.siteName.toLowerCase().includes(lowerTitle) || lowerTitle.includes(c.siteName.toLowerCase())));
        if (matches.length > 0 && matches[0].username && matches[0].passwordValue) {
          addToast(`Auto-Type: ${matches[0].siteName}`, 'info');
          window.electron!.performAutoType({ username: matches[0].username, password: matches[0].passwordValue });
        } else addToast(`Auto-Type: No match for "${title.substring(0, 15)}..."`, 'error');
      });
    }
  }, [credentials, isLocked]);

  const handleToggleMiniMode = () => {
    if (window.electron) {
      if (isMiniMode) { window.electron.setNormalMode(); setIsMiniMode(false); }
      else { window.electron.setMiniMode(); setIsMiniMode(true); setCurrentView(AppView.VAULT); }
    }
  };

  const copyWithTimeout = useClipboardTimeout({
    onCopy: () => addToast(t.copied),
    onClear: () => addToast(t.clipboardCleared, 'info'),
    timeout: securityConfig.clipboardTimeout
  });

  const handleCopy = (text: string) => {
    copyWithTimeout(text);
  };

  const handleLicenseInput = (e: React.ChangeEvent<HTMLInputElement>) => { setLicenseKeyInput(e.target.value); };

  const handleActivateLicense = async () => {
    const key = licenseKeyInput.trim();
    if (!key) { addToast(t.invalidCode, 'error'); return; }
    const deviceId = activeDeviceId || getDeviceId();
    const result = await verifyOfflineLicense(key, deviceId);
    if (!result.valid) {
      if (result.reason === 'DEVICE_MISMATCH') addToast(t.deviceMismatch, 'error');
      else if (result.reason === 'EXPIRED') addToast(t.trialExpired, 'error');
      else addToast(t.invalidCode, 'error');
      return;
    }
    const updatedConfig: SecurityConfig = { ...securityConfig, licenseType: 'PRO', licenseToken: key, licenseExpiresAt: result.expiresAt || null, licenseDeviceId: deviceId };
    setSecurityConfig(updatedConfig); setIsPro(true); setShowLicenseInput(false); addToast(t.activate + ' ' + t.proVersion, 'success'); setLicenseKeyInput('');
  };

  const handleChangePassword = async () => {
    if (newPass1 !== newPass2) { addToast(t.passMismatch, 'error'); return; }
    if (newPass1.length < 6) { addToast(t.shortPassword, 'error'); return; }
    const isCurrentPasswordValid = await verifyPassword(currentPassForChange, securityConfig.masterPasswordHash);
    if (!isCurrentPasswordValid) { addToast(t.wrongPass, 'error'); return; }
    const { hash: hashedNew } = await hashPassword(newPass1);
    setSecurityConfig({ ...securityConfig, masterPasswordHash: hashedNew });
    setMasterKey(newPass1); addToast(t.accountUpdated); setNewPass1(''); setNewPass2(''); setCurrentPassForChange('');
  };

  const handleToggleBiometric = async () => {
    if (!window.electron) return;
    if (securityConfig.isBiometricEnabled) {
      if (confirm(t.disable + '?')) { setSecurityConfig({ ...securityConfig, isBiometricEnabled: false, encryptedMasterKey: undefined }); addToast(t.disable); }
    } else {
      const success = await window.electron.promptBiometry(t.biometricReason);
      if (success) {
        const masterPass = prompt(t.enterPass);
        if (!masterPass) return;
        const isPasswordValid = await verifyPassword(masterPass, securityConfig.masterPasswordHash);
        if (!isPasswordValid) { addToast(t.wrongPass, 'error'); return; }
        const encrypted = await window.electron.encryptKey(masterPass);
        if (encrypted) { setSecurityConfig({ ...securityConfig, isBiometricEnabled: true, encryptedMasterKey: encrypted }); addToast(t.biometricActive); }
      }
    }
  };

  const start2FASetup = () => {
    if (securityConfig.is2FAEnabled) { if (confirm(t.disable + '?')) setSecurityConfig({ ...securityConfig, is2FAEnabled: false, totpSecret: undefined }); return; }
    const secret = generateTOTPSecret(); setTempSecret(secret); setSetup2FAStep(1);
    setTimeout(() => { if (canvasRef.current) QRCode.toCanvas(canvasRef.current, getTOTPUri(secret), { width: 160, margin: 1 }); }, 50);
  };

  const confirm2FASetup = () => {
    if (verifyTOTP(verifyCode, tempSecret)) { setSecurityConfig({ ...securityConfig, is2FAEnabled: true, totpSecret: tempSecret }); setSetup2FAStep(0); setVerifyCode(''); addToast(t.active); }
    else addToast(t.invalidCode, 'error');
  };

  const startWordAuthSetup = () => {
    if (securityConfig.isWordAuthEnabled) { if (confirm(t.disable + '?')) setSecurityConfig({ ...securityConfig, isWordAuthEnabled: false, recoveryWords: [] }); return; }
    setTempWords(generateRecoveryWords()); setSetupWordStep(1);
  };

  const confirmWordAuthSetup = () => { setSecurityConfig({ ...securityConfig, isWordAuthEnabled: true, recoveryWords: tempWords }); setSetupWordStep(0); addToast(t.active); };

  const handleImportClick = () => { if (importInputRef.current) importInputRef.current.click(); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.winvault')) { setRestoreFileContent(content); setRestoreModalOpen(true); }
      else {
        try {
          let parsed: any[] = [];
          if (file.name.endsWith('.json')) {
            parsed = JSON.parse(content);
          } else {
            parsed = parseCSV(content);
          }

          if (parsed.length > 0) {
            setCredentials([...credentials, ...parsed.map(p => ({
              ...p,
              id: p.id || Math.random().toString(36).substring(2, 9),
              updatedAt: p.updatedAt || Date.now(),
              category: p.category || 'General',
              type: p.type || 'LOGIN'
            }))]);
            addToast(t.restored);
          } else {
            addToast("Dosya boş veya geçersiz format!", 'error');
          }
        } catch (err) {
          console.error("Import error:", err);
          addToast("İçe aktarma hatası: Dosya formatı uyumsuz.", 'error');
        }
      }
    };
    reader.readAsText(file); e.target.value = '';
  };

  const handleRestore = async () => {
    if (!restoreFileContent) return;
    try {
      const decrypted = await decryptData(restoreFileContent, restorePassword);
      if (Array.isArray(decrypted)) {
        setCredentials(decrypted);
        addToast(t.restored, 'success');
        setRestoreModalOpen(false);
        setRestorePasswordLocal('');
        setRestoreFileContent(null);
      } else {
        addToast("Yedek dosyası geçersiz formatta!", "error");
      }
    } catch (e) {
      addToast(t.wrongPass, 'error');
    }
  };

  const handleExport = async () => {
    try {
      if (exportFormat === 'WINVAULT') {
        const encrypted = await encryptData(credentials, exportPassword);
        const blob = new Blob([encrypted], { type: 'application/octet-stream' });
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `winvault_backup_${Date.now()}.winvault`; link.click();
      } else if (exportFormat === 'CSV') await exportToCSV(credentials, isExportEncrypted ? exportPassword : undefined);
      else if (exportFormat === 'JSON') await exportToJSON(credentials, isExportEncrypted ? exportPassword : undefined);
      setExportModalOpen(false); setExportPassword('');
    } catch (e) { addToast("Export failed", 'error'); }
  };

  const handleAppReset = async () => {
    // Soft Reset: Clear Vault Data & Security Config, but KEEP Settings (Theme, License, etc.)
    if (confirm(t.resetApp + "?\n\n" + (lang === 'tr' ? "Bu işlem kasa verilerinizi siler ve yeni şifre oluşturmanızı sağlar. Ayarlarınız korunur." : "This will wipe your vault data and let you create a new password. Settings will be kept."))) {

      try {

        // 1. Preserve Vault Data (Encrypted Blob) for potential recovery / hash repair
        // We DO NOT wipe the data here anymore.
        // await dbService.saveEncryptedBlob('');
        // await dbService.saveFakeEncryptedBlob('');
        setCredentials([]); // Clear in-memory only

        // 2. Clear Security Config (Hash, Salt, 2FA) -> Triggers Setup
        // We initialize a fresh config but try to keep license info if possible
        const cleanConfig: SecurityConfig = {
          masterPasswordHash: '', // Clear hash to trigger setup
          is2FAEnabled: false,
          isBiometricEnabled: false,
          isWordAuthEnabled: false,
          autoBackupPath: securityConfig.autoBackupPath || '',
          isAutoBackupEnabled: securityConfig.isAutoBackupEnabled || false,
          // Preserve License if exists
          licenseType: securityConfig.licenseType,
          licenseExpiresAt: securityConfig.licenseExpiresAt,
          licenseDeviceId: securityConfig.licenseDeviceId,
          licenseToken: securityConfig.licenseToken,
          autoLockTimeout: securityConfig.autoLockTimeout > 0 ? securityConfig.autoLockTimeout : 300000
        };

        setSecurityConfig(cleanConfig);
        await dbService.saveSecurityConfig(cleanConfig);
        await dbService.saveConfig('masterSalt', null); // Clear salt

        // 3. Reset State to trigger Setup Flow
        setMasterKey('');
        setIsLocked(true);
        setNeedsSecureSetup(true); // <--- This triggers MasterPasswordSetup

        // 4. Clear sensitive local state
        setVerifyCode('');

        addToast(lang === 'tr' ? "Kasa sıfırlandı. Yeni şifre oluşturun." : "Vault reset. Create a new password.", 'info');

      } catch (e) {
        console.error("Reset failed", e);
        addToast("Sıfırlama başarısız oldu", "error");
      }
    }
  };

  const daysLeft = Math.ceil(Math.max(0, (installDate + TRIAL_DURATION) - Date.now()) / (24 * 60 * 60 * 1000));

  if (isLocked) return <MasterLogin onUnlock={handleUnlock} onReset={handleAppReset} isDefaultPassword={securityConfig.masterPasswordHash.includes('d3ad9315b7be5dd')} needsSecureSetup={needsSecureSetup} />;

  return (
    <div className={`h-screen flex ${theme === 'amoled' ? 'bg-black' : 'bg-white dark:bg-slate-950'} transition-colors overflow-hidden`}>
      {!isMiniMode && <Sidebar onLock={handleLockWithBackup} />}
      <main className="flex-1 flex flex-col relative h-full min-w-0">
        {currentView === AppView.VAULT && <Vault onCopy={handleCopy} onTouch={(id) => updateCredential(id, { lastUsed: Date.now() })} highlightedId={highlightedCredentialId} shouldOpenAddModal={forceVaultAddModal} mode="VAULT" />}
        {currentView === AppView.DOCUMENTS && <Vault onCopy={handleCopy} onTouch={(id) => updateCredential(id, { lastUsed: Date.now() })} mode="DOCUMENTS" />}
        {currentView === AppView.GENERATOR && <PasswordGenerator onCopy={handleCopy} />}
        {currentView === AppView.SETTINGS && (
          <SettingsView
            daysLeft={daysLeft} getDeviceId={() => activeDeviceId} addToast={addToast}
            handleLicenseInput={handleLicenseInput} handleActivateLicense={handleActivateLicense}
            handleChangePassword={handleChangePassword} handleToggleBiometric={handleToggleBiometric}
            start2FASetup={start2FASetup} confirm2FASetup={confirm2FASetup}
            startWordAuthSetup={startWordAuthSetup} confirmWordAuthSetup={confirmWordAuthSetup}
            handleImportClick={handleImportClick} handleAppReset={handleAppReset}
            licenseKeyInput={licenseKeyInput} showLicenseInput={showLicenseInput} setShowLicenseInput={setShowLicenseInput}
            currentPassForChange={currentPassForChange} setCurrentPassForChange={setCurrentPassForChange}
            newPass1={newPass1} setNewPass1={setNewPass1} newPass2={newPass2} setNewPass2={setNewPass2}
            isAdminMode={isAdminMode} handleGenerateKey={() => { }} targetDeviceId={activeDeviceId}
            setTargetDeviceId={setActiveDeviceId} generatedKey="" importInputRef={importInputRef}
            setup2FAStep={setup2FAStep} setSetup2FAStep={setSetup2FAStep} canvasRef={canvasRef}
            tempSecret={tempSecret} verifyCode={verifyCode} setVerifyCode={setVerifyCode}
            setupWordStep={setupWordStep} tempWords={tempWords} isBiometrySupported={isBiometrySupported}
            handleFileChange={handleFileChange} hashPassword={async (p) => (await hashPassword(p)).hash}
          />
        )}
        <input type="file" ref={importInputRef} onChange={handleFileChange} accept=".csv,.json,.winvault" className="hidden" />
      </main>
      <CommandPalette
        onSelectCredential={(id) => {
          setHighlightedCredentialId(id);
          setCurrentView(AppView.VAULT);
        }}
        onLock={handleLockWithBackup}
        onAddRecord={() => {
          setCurrentView(AppView.VAULT);
          setForceVaultAddModal(true);
          setTimeout(() => setForceVaultAddModal(false), 100);
        }}
      />
      {isExportModalOpen && <ExportModal onExport={handleExport} exportPassword={exportPassword} setExportPassword={setExportPassword} />}
      {isRestoreModalOpen && <RestoreModal onClose={() => { setRestoreModalOpen(false); setRestoreFileContent(null); }} onRestore={handleRestore} restorePassword={restorePassword} setRestorePassword={setRestorePasswordLocal} />}
      {isPaymentModalOpen && <PaymentModal onPaymentNotification={() => { }} addToast={addToast} />}
      {isPrivacyModalOpen && <PrivacyModal />}
      {isGuideOpen && <UserGuide />}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-slide-up ${toast.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' :
            toast.type === 'error' ? 'bg-rose-500 border-rose-400 text-white' : 'bg-blue-500 border-blue-400 text-white'
            }`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
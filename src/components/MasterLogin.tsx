import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, ShieldCheck, KeyRound, RotateCcw, X, Eye, EyeOff, Trash2, Smartphone, Globe, AlertTriangle, Fingerprint, Clock } from 'lucide-react';
import { hashPassword, verifyPassword, verifyTOTP, TRANSLATIONS, decryptData } from '../utils';
import MasterPasswordSetup from './MasterPasswordSetup';
import { useAppStore } from '../store/useAppStore';
import { dbService } from '../services/idb';
import { rateLimiter } from '../services/rateLimiter';

import { useVaultStore } from '../store/useVaultStore';

interface MasterLoginProps {
  onUnlock: (password: string) => void;
  onReset: () => void;
  isDefaultPassword: boolean;
  needsSecureSetup?: boolean;
}

enum LoginStep {
  PASSWORD,
  TWO_FACTOR,
  WORD_AUTH
}

const MasterLogin: React.FC<MasterLoginProps> = ({ onUnlock, onReset, isDefaultPassword, needsSecureSetup }) => {
  const { lang, setLang, securityConfig } = useAppStore();
  const [step, setStep] = useState<LoginStep>(LoginStep.PASSWORD);
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isBiometrySupported, setIsBiometrySupported] = useState(false);
  const [isBiometricPromptOpen, setIsBiometricPromptOpen] = useState(false);

  // Rate limiting state
  const [lockoutInfo, setLockoutInfo] = useState<{ locked: boolean; message: string; waitTime: number } | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetTotpCode, setResetTotpCode] = useState('');
  const [resetError, setResetError] = useState('');

  // Word Auth State
  const [wordIndices, setWordIndices] = useState<number[]>([]);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    setStep(LoginStep.PASSWORD);
    setInputVal('');
    setError(false);
    setErrorMessage('');

    // Check rate limiting status
    const checkRateLimit = async () => {
      const fingerprint = await rateLimiter.getDeviceFingerprint();
      const status = rateLimiter.isBlocked(fingerprint);

      if (status.blocked) {
        setLockoutInfo({
          locked: true,
          message: `${lang === 'tr' ? 'Çok fazla deneme. Lütfen bekleyin.' : 'Too many attempts. Please wait.'} (${status.remainingTime}s)`,
          waitTime: status.remainingTime || 0
        });
      } else {
        setLockoutInfo(null);
      }
    };
    checkRateLimit();

    const checkBiometry = async () => {
      if (window.electron?.checkBiometry) {
        const supported = await window.electron.checkBiometry();
        setIsBiometrySupported(supported);

        if (supported && securityConfig.isBiometricEnabled && !isBiometricPromptOpen) {
          handleBiometricLogin();
        }
      }
    };
    checkBiometry();
  }, [securityConfig.isBiometricEnabled]);

  useEffect(() => {
    if (step === LoginStep.WORD_AUTH) {
      const idx1 = Math.floor(Math.random() * 16);
      let idx2 = Math.floor(Math.random() * 16);
      while (idx2 === idx1) idx2 = Math.floor(Math.random() * 16);
      setWordIndices([idx1, idx2]);
    }
  }, [step]);

  useEffect(() => {
    if (isResetModalOpen) {
      setResetPasswordInput('');
      setResetTotpCode('');
      setResetError('');
    }
  }, [isResetModalOpen]);

  const [tempPassword, setTempPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setLoading(true);
    setErrorMessage('');

    // Check rate limiting before processing
    const fingerprint = await rateLimiter.getDeviceFingerprint();
    const rateLimitStatus = rateLimiter.isBlocked(fingerprint);

    if (rateLimitStatus.blocked) {
      setLockoutInfo({
        locked: true,
        message: `${lang === 'tr' ? 'Hesap kilitli.' : 'Account locked.'} (${rateLimitStatus.remainingTime}s)`,
        waitTime: rateLimitStatus.remainingTime || 0
      });
      setLoading(false);
      return;
    }

    await new Promise(r => setTimeout(r, 400));

    try {
      if (step === LoginStep.PASSWORD) {
        const isValidPassword = await verifyPassword(inputVal, securityConfig.masterPasswordHash);

        if (isValidPassword) {
          // Clear failed attempts on successful login
          const fingerprint = await rateLimiter.getDeviceFingerprint();
          rateLimiter.reset(fingerprint);
          setRemainingAttempts(null);
          setLockoutInfo(null);

          setTempPassword(inputVal);
          if (securityConfig.is2FAEnabled) {
            setStep(LoginStep.TWO_FACTOR);
            setInputVal('');
            setShowPassword(false);
          } else if (securityConfig.isWordAuthEnabled) {
            setStep(LoginStep.WORD_AUTH);
            setInputVal('');
            setShowPassword(false);
          } else {
            onUnlock(inputVal);
          }
        } else {
          // Record failed attempt and update UI
          const fingerprint = await rateLimiter.getDeviceFingerprint();
          await rateLimiter.recordFailure(fingerprint);

          const status = rateLimiter.isBlocked(fingerprint);
          if (status.blocked) {
            setLockoutInfo({
              locked: true,
              message: `${lang === 'tr' ? 'Hesap geçici olarak kilitlendi.' : 'Account temporarily locked.'} (${status.remainingTime}s)`,
              waitTime: status.remainingTime || 0
            });
            setRemainingAttempts(null);
          }
          throw new Error(t.wrongPass);
        }
      }
      else if (step === LoginStep.TWO_FACTOR) {
        if (securityConfig.totpSecret && verifyTOTP(inputVal, securityConfig.totpSecret)) {
          if (securityConfig.isWordAuthEnabled) {
            setStep(LoginStep.WORD_AUTH);
            setInputVal('');
          } else {
            onUnlock(tempPassword);
          }
        } else {
          throw new Error(t.invalidCode);
        }
      }
      else if (step === LoginStep.WORD_AUTH) {
        const inputs = inputVal.trim().toLowerCase().split(/\s+/);
        if (securityConfig.recoveryWords && inputs.length === 2) {
          const expectedWord1 = securityConfig.recoveryWords[wordIndices[0]];
          const expectedWord2 = securityConfig.recoveryWords[wordIndices[1]];

          if (inputs[0] === expectedWord1 && inputs[1] === expectedWord2) {
            onUnlock(tempPassword);
          } else {
            throw new Error(t.wordsMismatch);
          }
        } else {
          throw new Error(t.wordsMismatch);
        }
      }
    } catch (err: any) {
      setError(true);
      setErrorMessage(err.message || 'Error');
      setTimeout(() => { setError(false); setErrorMessage(''); }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!window.electron || !securityConfig.isBiometricEnabled || !securityConfig.encryptedMasterKey) return;

    setIsBiometricPromptOpen(true);
    setLoading(true);

    try {
      const success = await window.electron.promptBiometry(t.biometricReason);
      if (success) {
        const decryptedKey = await window.electron.decryptKey(securityConfig.encryptedMasterKey);
        if (decryptedKey) {
          setTempPassword(decryptedKey);
          if (securityConfig.is2FAEnabled) {
            setStep(LoginStep.TWO_FACTOR);
            setInputVal('');
          } else if (securityConfig.isWordAuthEnabled) {
            setStep(LoginStep.WORD_AUTH);
            setInputVal('');
          } else {
            onUnlock(decryptedKey);
          }
        } else {
          throw new Error('Biyometrik anahtar çözülemedi.');
        }
      }
    } catch (err: any) {
      setError(true);
      setErrorMessage(t.biometricError);
      setTimeout(() => { setError(false); setErrorMessage(''); }, 2000);
    } finally {
      setLoading(false);
      setIsBiometricPromptOpen(false);
    }
  };

  const handleSecureReset = async () => {
    if (securityConfig.is2FAEnabled && securityConfig.totpSecret) {
      if (verifyTOTP(resetTotpCode, securityConfig.totpSecret)) {
        onReset();
      } else {
        setResetError(t.invalidCode);
        setTimeout(() => setResetError(''), 2000);
      }
    } else {
      if (!resetPasswordInput) return;

      const isValidResetPassword = await verifyPassword(resetPasswordInput, securityConfig.masterPasswordHash);

      if (isValidResetPassword) {
        onReset();
      } else {
        setResetError(t.wrongPass);
        setTimeout(() => setResetError(''), 2000);
      }
    }
  };

  const toggleLang = () => {
    setLang(lang === 'tr' ? 'en' : 'tr');
  };

  // Show setup modal if needed
  if (needsSecureSetup) {
    return (
      <MasterPasswordSetup
        mode={isDefaultPassword ? 'migration' : 'first-time'}
        onComplete={async (newPassword) => {
          try {
            const { hash } = await hashPassword(newPassword);
            const { setSecurityConfig, setIsLocked, setMasterKey } = useAppStore.getState();

            // 1. Update security config with new hash
            const currentConfig = useAppStore.getState().securityConfig;
            const newConfig = {
              ...currentConfig,
              masterPasswordHash: hash
            };

            // 2. Set state directly to bypass stale closure in handleUnlock
            setSecurityConfig(newConfig);
            setMasterKey(newPassword);

            // 3. Force save to database
            if (window.electron) {
              await dbService.saveSecurityConfig(newConfig);
            }

            // --- RECOVERY ATTEMPT logic ---
            const existingBlob = await dbService.getEncryptedBlob();
            if (existingBlob) {
              console.log("Found existing vault data after reset. Attempting recovery...");
              try {
                // Try to decrypt with NEW password
                // (This works if user entered the SAME password as before)
                const decrypted = await decryptData(existingBlob, newPassword);

                if (decrypted && Array.isArray(decrypted)) {
                  console.log("Recovery SUCCESS: Decrypted old data with new password!");
                  // Data is safe. Load it into store so it gets re-saved properly by App.tsx
                  const { setCredentials } = useVaultStore.getState();
                  setCredentials(decrypted);
                }
              } catch (e) {
                console.warn("Recovery FAILED: New password cannot decrypt old data. Backing up...");
                // Password changed. Old data is unreadable with new key.
                // Move old data to quarantine to prevent overwrite by empty vault
                await dbService.saveConfig('vault_quarantine_' + Date.now(), existingBlob);
                // Verify quarantine success? Implicit.
              }
            }
            // ------------------------------

            // 4. Unlock the app
            const { setNeedsSecureSetup } = useAppStore.getState();
            setNeedsSecureSetup(false);
            setIsLocked(false);

          } catch (error) {
            console.error('Setup completion failed:', error);
          }
        }}
        lang={lang}
        onLanguageToggle={toggleLang}
      />
    );
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900 dark:via-slate-950 dark:to-black text-slate-800 dark:text-slate-200 relative transition-colors master-login-bg">

      <button
        type="button"
        onClick={toggleLang}
        className="absolute top-6 right-6 flex items-center space-x-2 bg-white dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700/50 transition-colors shadow-sm"
      >
        <Globe className="w-4 h-4 text-blue-500 dark:text-blue-400" />
        <span className="text-sm font-bold">{lang === 'tr' ? 'TR' : 'EN'}</span>
      </button>

      <div className="w-full max-w-xs p-6 flex flex-col items-center">

        {step === LoginStep.PASSWORD && lockoutInfo?.locked && (
          <div className="w-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 mb-6 text-center animate-fade-in">
            <div className="flex items-center justify-center space-x-2 text-red-600 dark:text-red-400 mb-1">
              <Clock className="w-5 h-5" />
              <span className="font-bold text-sm">{t.accountLocked}</span>
            </div>
            <p className="text-red-700 dark:text-red-200/70 text-xs">{t.accountLockedDesc}</p>
            <p className="text-red-600 dark:text-red-300/50 text-xs mt-1">
              {t.remainingTime}: {Math.ceil(lockoutInfo.waitTime / 1000 / 60)} {lang === 'tr' ? 'dakika' : 'minutes'}
            </p>
          </div>
        )}

        {step === LoginStep.PASSWORD && remainingAttempts !== null && remainingAttempts <= 2 && !lockoutInfo?.locked && (
          <div className="w-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4 mb-6 text-center animate-fade-in">
            <div className="flex items-center justify-center space-x-2 text-orange-600 dark:text-orange-400 mb-1">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-bold text-sm">{t.warningTitle}</span>
            </div>
            <p className="text-orange-700 dark:text-orange-200/70 text-xs">
              {typeof t.warningDesc === 'function' ? t.warningDesc(remainingAttempts) :
                `${remainingAttempts} ${lang === 'tr' ? 'deneme hakkınız kaldı. Başarısız denemeler sonrası hesap geçici olarak kilitlenecektir.' : 'attempts remaining. The account will be temporarily locked after failed attempts.'}`}
            </p>
          </div>
        )}

        {step === LoginStep.PASSWORD && isDefaultPassword && (
          <div className="w-full bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-4 mb-6 text-center animate-fade-in">
            <div className="flex items-center justify-center space-x-2 text-yellow-600 dark:text-yellow-400 mb-1">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-bold text-sm">{t.defaultPassWarning}</span>
            </div>
            <p className="text-yellow-700 dark:text-yellow-200/70 text-xs">{t.defaultPassDesc}</p>
          </div>
        )}

        <div className="mb-8 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl dark:shadow-2xl">
          {step === LoginStep.PASSWORD && <Lock className="w-8 h-8 text-blue-600 dark:text-blue-500" />}
          {step === LoginStep.TWO_FACTOR && <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-500" />}
          {step === LoginStep.WORD_AUTH && <KeyRound className="w-8 h-8 text-purple-600 dark:text-purple-500" />}
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {step === LoginStep.PASSWORD && t.loginTitle}
          {step === LoginStep.TWO_FACTOR && t.login2FA}
          {step === LoginStep.WORD_AUTH && t.loginWord}
        </h2>

        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 text-center h-5">
          {step === LoginStep.PASSWORD && t.enterPass}
          {step === LoginStep.TWO_FACTOR && t.enterCode}
          {step === LoginStep.WORD_AUTH && wordIndices.length > 0 &&
            t.enterWords(wordIndices[0] + 1, wordIndices[1] + 1)}
        </p>

        <form onSubmit={handleSubmit} className="w-full relative">
          <div className="relative group">
            <input
              type={step === LoginStep.PASSWORD && !showPassword ? "password" : "text"}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="••••••"
              className={`w-full bg-white dark:bg-slate-900/80 border ${error ? 'border-red-500/50 text-red-600 dark:text-red-200' : 'border-slate-200 dark:border-slate-800 focus:border-blue-500'} rounded-xl py-3 pl-4 pr-12 text-sm font-mono tracking-widest text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-all shadow-md dark:shadow-lg`}
              autoFocus
            />

            {step === LoginStep.PASSWORD && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !inputVal || lockoutInfo?.locked}
              className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed rounded-lg flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>

          {step === LoginStep.PASSWORD && securityConfig.isBiometricEnabled && isBiometrySupported && (
            <div className="flex flex-col items-center mt-6 animate-fade-in">
              <div className="w-full h-px bg-slate-200 dark:bg-slate-800 mb-6"></div>
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={loading}
                className="flex flex-col items-center group"
                aria-label={t.biometricUnlock}
              >
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 group-active:scale-95 transition-all group-hover:border-blue-500/50 group-hover:shadow-blue-500/10">
                  <Fingerprint className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mt-2 tracking-widest group-hover:text-blue-500 transition-colors">
                  {t.biometricUnlock}
                </span>
              </button>
            </div>
          )}
          {error && <p className="text-red-500 text-xs text-center mt-2 absolute w-full">{errorMessage}</p>}
        </form>

        <div className="mt-12">
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors px-3 py-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/10"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t.resetApp}</span>
          </button>
        </div>
      </div>

      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in relative">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.resetConfirmTitle}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">
                {t.resetConfirmDesc}
              </p>
            </div>

            {securityConfig.is2FAEnabled ? (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-lg flex items-start space-x-3">
                  <Smartphone className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {t.reset2FADesc}
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={resetTotpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.length <= 6) setResetTotpCode(val);
                    }}
                    placeholder="000 000"
                    className={`w-full bg-slate-50 dark:bg-slate-950 border ${resetError ? 'border-red-500 text-red-500 dark:text-red-400' : 'border-slate-300 dark:border-slate-800 focus:border-blue-500'} rounded-lg py-2.5 px-3 text-center text-lg font-mono text-slate-900 dark:text-white tracking-widest outline-none transition-colors`}
                  />
                  {resetError && <span className="absolute -bottom-5 left-0 right-0 text-[10px] text-red-500 text-center">{resetError}</span>}
                </div>

                <button
                  type="button"
                  onClick={handleSecureReset}
                  disabled={resetTotpCode.length !== 6}
                  className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-all text-sm mt-2"
                >
                  {t.verifyAndReset}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-lg flex items-start space-x-3">
                  <Lock className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {t.resetTextDesc}
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="password"
                    value={resetPasswordInput}
                    onChange={(e) => setResetPasswordInput(e.target.value)}
                    placeholder="••••••"
                    className={`w-full bg-slate-50 dark:bg-slate-950 border ${resetError ? 'border-red-500 text-red-500 dark:text-red-400' : 'border-slate-300 dark:border-slate-800 focus:border-red-500'} rounded-lg py-2.5 px-3 text-center text-sm font-bold text-slate-900 dark:text-white tracking-widest focus:outline-none`}
                  />
                  {resetError && <span className="absolute -bottom-5 left-0 right-0 text-[10px] text-red-500 text-center">{resetError}</span>}
                </div>

                <button
                  type="button"
                  onClick={handleSecureReset}
                  disabled={!resetPasswordInput}
                  className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-all text-sm mt-2"
                >
                  {t.deleteData}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default MasterLogin;

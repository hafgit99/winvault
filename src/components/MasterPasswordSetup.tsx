import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight, Key } from 'lucide-react';
import { hashPassword, TRANSLATIONS } from '../utils';

interface MasterPasswordSetupProps {
  onComplete: (password: string) => void;
  onCancel?: () => void;
  mode: 'first-time' | 'migration' | 'upgrade';
  lang?: 'tr' | 'en';
  onLanguageToggle?: () => void;
}

interface PasswordStrength {
  score: number;
  level: 'weak' | 'medium' | 'strong' | 'very-strong';
  feedback: string[];
  isAcceptable: boolean;
}

const MasterPasswordSetup: React.FC<MasterPasswordSetupProps> = ({
  onComplete,
  onCancel,
  mode,
  lang = 'tr',
  onLanguageToggle
}) => {
  const t = TRANSLATIONS[lang];
  const [currentStep, setCurrentStep] = useState(0);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    level: 'weak',
    feedback: [],
    isAcceptable: false
  });

  // Password requirements
  const requirements = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true
  };

  // Check if password meets requirements
  const checkRequirements = (pass: string) => {
    const checks = {
      length: pass.length >= requirements.minLength,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      numbers: /\d/.test(pass),
      symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)
    };

    return {
      ...checks,
      allMet: Object.values(checks).every(Boolean)
    };
  };

  // Calculate password strength
  const calculatePasswordStrength = (pass: string): PasswordStrength => {
    if (!pass) {
      return {
        score: 0,
        level: 'weak',
        feedback: [lang === 'tr' ? 'Şifre boş' : 'Password is empty'],
        isAcceptable: false
      };
    }

    const reqs = checkRequirements(pass);
    let score = 0;
    const feedback: string[] = [];

    // Length scoring
    if (pass.length >= 12) score += 20;
    else if (pass.length >= 8) score += 10;
    else feedback.push(lang === 'tr' ? 'En az 12 karakter' : 'At least 12 characters');

    // Character variety
    if (reqs.uppercase) score += 20;
    else feedback.push(lang === 'tr' ? 'Büyük harf gerekli' : 'Uppercase letter required');

    if (reqs.lowercase) score += 20;
    else feedback.push(lang === 'tr' ? 'Küçük harf gerekli' : 'Lowercase letter required');

    if (reqs.numbers) score += 20;
    else feedback.push(lang === 'tr' ? 'Sayı gerekli' : 'Number required');

    if (reqs.symbols) score += 20;
    else feedback.push(lang === 'tr' ? 'Sembol gerekli' : 'Symbol required');

    // Extra scoring for length
    if (pass.length >= 16) score += 10;
    if (pass.length >= 20) score += 10;

    // Check for common patterns
    if (/(.)\1{2,}/.test(pass)) {
      score -= 10;
      feedback.push(lang === 'tr' ? 'Tekrar eden karakterler' : 'Repeating characters');
    }

    if (/^[a-zA-Z]+$/.test(pass) || /^[0-9]+$/.test(pass)) {
      score -= 20;
      feedback.push(lang === 'tr' ? 'Karmaşık karakterler kullanın' : 'Use mixed characters');
    }

    let level: 'weak' | 'medium' | 'strong' | 'very-strong';
    if (score < 40) level = 'weak';
    else if (score < 60) level = 'medium';
    else if (score < 80) level = 'strong';
    else level = 'very-strong';

    return {
      score: Math.min(100, Math.max(0, score)),
      level,
      feedback,
      isAcceptable: score >= 60 && reqs.allMet
    };
  };

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password, lang]);

  const handleSubmit = async () => {
    if (!passwordStrength.isAcceptable) {
      return;
    }

    if (password !== confirmPassword) {
      return;
    }

    setIsCreating(true);
    try {
      await onComplete(password);
    } catch (error) {
      console.error('Setup failed:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength.level) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      case 'very-strong': return 'bg-green-600';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthText = () => {
    switch (passwordStrength.level) {
      case 'weak': return lang === 'tr' ? 'Zayıf' : 'Weak';
      case 'medium': return lang === 'tr' ? 'Orta' : 'Medium';
      case 'strong': return lang === 'tr' ? 'Güçlü' : 'Strong';
      case 'very-strong': return lang === 'tr' ? 'Çok Güçlü' : 'Very Strong';
      default: return '';
    }
  };

  const reqs = checkRequirements(password);

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {mode === 'first-time' ? (lang === 'tr' ? 'WinVault Kurulumu' : 'WinVault Setup') :
                    mode === 'migration' ? (lang === 'tr' ? 'Güvenlik Yükseltmesi' : 'Security Upgrade') :
                      (lang === 'tr' ? 'Şifre Güncelleme' : 'Password Update')}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {mode === 'first-time' ? (lang === 'tr' ? 'Güvenli bir ana şifre oluşturun' : 'Create a secure master password') :
                    mode === 'migration' ? (lang === 'tr' ? 'Varsayılan şifreyi değiştirin' : 'Replace default password') :
                      (lang === 'tr' ? 'Yeni şifrenizi belirleyin' : 'Set your new password')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onLanguageToggle}
                className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              >
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {lang === 'tr' ? 'TR' : 'EN'}
                </span>
              </button>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors text-slate-500"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {lang === 'tr' ? 'Ana Şifre' : 'Master Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={lang === 'tr' ? 'Güvenli şifrenizi girin' : 'Enter your secure password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {lang === 'tr' ? 'Şifre Gücü' : 'Password Strength'}
                </span>
                <span className="text-sm font-medium" style={{
                  color: passwordStrength.level === 'weak' ? '#ef4444' :
                    passwordStrength.level === 'medium' ? '#eab308' :
                      passwordStrength.level === 'strong' ? '#22c55e' : '#16a34a'
                }}>
                  {getStrengthText()} ({passwordStrength.score}/100)
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getStrengthColor()}`}
                  style={{ width: `${passwordStrength.score}%` }}
                />
              </div>
            </div>
          )}

          {/* Requirements Check */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {lang === 'tr' ? 'Şifre Gereksinimleri' : 'Password Requirements'}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {reqs.length ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {lang === 'tr' ? `En az ${requirements.minLength} karakter` : `At least ${requirements.minLength} characters`}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {reqs.uppercase ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {lang === 'tr' ? 'Büyük harf (A-Z)' : 'Uppercase letter (A-Z)'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {reqs.lowercase ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {lang === 'tr' ? 'Küçük harf (a-z)' : 'Lowercase letter (a-z)'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {reqs.numbers ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {lang === 'tr' ? 'Sayı (0-9)' : 'Number (0-9)'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {reqs.symbols ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {lang === 'tr' ? 'Sembol (!@#$%^&*)' : 'Symbol (!@#$%^&*)'}
                </span>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {lang === 'tr' ? 'Şifreyi Onayla' : 'Confirm Password'}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={lang === 'tr' ? 'Şifrenizi tekrar girin' : 'Re-enter your password'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-2 text-sm text-red-500 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{lang === 'tr' ? 'Şifreler eşleşmiyor' : 'Passwords do not match'}</span>
              </p>
            )}
          </div>

          {/* Security Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Key className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                  {lang === 'tr' ? 'Güvenlik İpucu' : 'Security Tip'}
                </h4>
                <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                  {lang === 'tr'
                    ? 'Bu şifre tüm verilerinizi koruyacaktır. Güçlü, benzersiz ve hatırlaması kolay bir şifre seçin. Kimseyle paylaşmayın.'
                    : 'This password protects all your data. Choose a strong, unique password that\'s memorable but don\'t share it with anyone.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              {lang === 'tr' ? 'İptal' : 'Cancel'}
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!passwordStrength.isAcceptable || password !== confirmPassword || isCreating}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center justify-center space-x-2"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{lang === 'tr' ? 'Oluşturuluyor...' : 'Creating...'}</span>
              </>
            ) : (
              <>
                <span>{lang === 'tr' ? 'Devam Et' : 'Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MasterPasswordSetup;
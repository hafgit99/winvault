import React from 'react';
import {
    Globe, Palette, Sun, Moon, Monitor, Shield, Mail, FileText, CheckCircle,
    Crown, ChevronRight, Clock, Save, ShieldAlert, Download, Upload, AlertTriangle,
    Lock, KeyRound, Smartphone, Fingerprint, Copy
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../utils';
import { Language, Theme } from '../../types';

interface SettingsViewProps {
    daysLeft: number;
    getDeviceId: () => string;
    addToast: (msg: string, type?: any) => void;
    // Handlers from App.tsx (keeping them there for now to minimize complex logic moves)
    handleLicenseInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleActivateLicense: () => void;
    handleChangePassword: () => void;
    handleToggleBiometric: () => void;
    start2FASetup: () => void;
    confirm2FASetup: () => void;
    startWordAuthSetup: () => void;
    confirmWordAuthSetup: () => void;
    handleGenerateKey: () => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleImportClick: () => void;
    handleAppReset: () => void;

    // State managed in App.tsx (until fully moved)
    licenseKeyInput: string;
    showLicenseInput: boolean;
    setShowLicenseInput: (b: boolean) => void;
    currentPassForChange: string;
    setCurrentPassForChange: (s: string) => void;
    newPass1: string;
    setNewPass1: (s: string) => void;
    newPass2: string;
    setNewPass2: (s: string) => void;
    isAdminMode: boolean;
    targetDeviceId: string;
    setTargetDeviceId: (s: string) => void;
    generatedKey: string;
    importInputRef: React.RefObject<HTMLInputElement>;
    setup2FAStep: number;
    setSetup2FAStep: (n: number) => void;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    tempSecret: string;
    verifyCode: string;
    setVerifyCode: (s: string) => void;
    setupWordStep: number;
    tempWords: string[];
    isBiometrySupported: boolean;
    hashPassword: (p: string) => Promise<string>;
}

const SettingsView: React.FC<SettingsViewProps> = (props) => {
    const {
        lang, setLang, theme, setTheme, securityConfig, setSecurityConfig,
        isPro, setGuideOpen, setPrivacyModalOpen, setPaymentModalOpen, setExportModalOpen
    } = useAppStore();
    const t = TRANSLATIONS[lang];

    const {
        daysLeft, getDeviceId, addToast,
        handleLicenseInput, handleActivateLicense, handleChangePassword,
        handleToggleBiometric, start2FASetup, confirm2FASetup,
        startWordAuthSetup, confirmWordAuthSetup, handleGenerateKey,
        handleFileChange, handleImportClick,
        licenseKeyInput, showLicenseInput, setShowLicenseInput,
        currentPassForChange, setCurrentPassForChange, newPass1, setNewPass1, newPass2, setNewPass2,
        isAdminMode, targetDeviceId, setTargetDeviceId, generatedKey,
        importInputRef, setup2FAStep, setSetup2FAStep, canvasRef, tempSecret, verifyCode, setVerifyCode,
        setupWordStep, tempWords, isBiometrySupported, hashPassword
    } = props;

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-50 dark:bg-slate-950 select-text">
            <h2 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white tracking-tight border-b border-slate-200 dark:border-slate-800 pb-4">{t.settingsTitle}</h2>

            <div className="space-y-6 max-w-3xl mx-auto">

                {/* LANGUAGE CARD */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-4">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><Globe className="w-6 h-6" /></div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{t.language}</h3>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-4">
                        <button onClick={() => setLang('tr')} className={`py-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center space-x-2 ${lang === 'tr' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                            <span>TÜRKÇE</span>
                        </button>
                        <button onClick={() => setLang('en')} className={`py-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center space-x-2 ${lang === 'en' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                            <span>ENGLISH</span>
                        </button>
                    </div>
                </div>

                {/* THEME CARD */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-4">
                        <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500"><Palette className="w-6 h-6" /></div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{lang === 'tr' ? 'Görünüm' : 'Appearance'}</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onClick={() => setTheme('light')} className={`py-4 rounded-xl border text-sm font-bold transition-all flex flex-col items-center justify-center space-y-1 ${theme === 'light' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                            <Sun className="w-5 h-5" />
                            <span className="text-[10px]">{lang === 'tr' ? 'AYDINLIK' : 'LIGHT'}</span>
                        </button>
                        <button onClick={() => setTheme('dark')} className={`py-4 rounded-xl border text-sm font-bold transition-all flex flex-col items-center justify-center space-y-1 ${theme === 'dark' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                            <Moon className="w-5 h-5" />
                            <span className="text-[10px]">{lang === 'tr' ? 'KARANLIK' : 'DARK'}</span>
                        </button>
                        <button onClick={() => setTheme('amoled')} className={`py-4 rounded-xl border text-sm font-bold transition-all flex flex-col items-center justify-center space-y-1 ${theme === 'amoled' ? 'bg-black text-white border-blue-600 shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                            <Monitor className="w-5 h-5" />
                            <span className="text-[10px]">{lang === 'tr' ? 'OLED SİYAH' : 'OLED BLACK'}</span>
                        </button>
                    </div>
                </div>

                {/* PRIVACY POLICY */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-4">
                        <div className="p-2 bg-green-500/10 rounded-xl text-green-500"><Shield className="w-6 h-6" /></div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{t.privacyPolicy}</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{t.privacyDesc}</p>
                        <button onClick={() => setPrivacyModalOpen(true)} className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-700 transition-colors">
                            {t.privacyPolicy}
                        </button>
                    </div>
                </div>

                {/* SUPPORT */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-4">
                        <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-500"><Mail className="w-6 h-6" /></div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{t.supportTitle}</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{t.supportDesc}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setGuideOpen(true)} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center space-x-2">
                                <FileText className="w-5 h-5" />
                                <span>{lang === 'tr' ? 'Kullanım Kılavuzu' : 'User Guide'}</span>
                            </button>
                            <button onClick={() => {
                                const subject = encodeURIComponent(t.supportSubject);
                                const body = encodeURIComponent(t.supportMessage.replace('[Otomatik doldurulur]', getDeviceId()));
                                window.open(`mailto:sales@hetech-me.space?subject=${subject}&body=${body}`, '_blank');
                                addToast(t.emailSent, 'info');
                            }} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-bold border border-cyan-600 transition-colors flex items-center justify-center space-x-2">
                                <Mail className="w-5 h-5" />
                                <span>{t.contactSupport}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* LICENSE CARD */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm relative">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500"><Crown className="w-6 h-6" /></div>
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">{t.licenseStatus}</h3>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isPro ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}>{isPro ? t.proVersion : t.freeVersion}</span>
                    </div>
                    <div className="p-6">
                        <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{t.deviceId}</span>
                            <code className="text-sm font-bold text-blue-600 dark:text-blue-400 select-all cursor-text">{getDeviceId()}</code>
                        </div>

                        {!isPro && (
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 mb-6">
                                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2 font-medium">
                                    {daysLeft > 0 ? t.trialActiveDesc : t.trialDesc}
                                </p>
                                <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                    {daysLeft > 0 ? `${t.daysLeft} ${daysLeft} ${t.day}` : t.trialExpired}
                                </div>
                            </div>
                        )}

                        {showLicenseInput ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                                    value={licenseKeyInput}
                                    onChange={handleLicenseInput}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    autoComplete="off"
                                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-center font-mono text-slate-900 dark:text-white uppercase tracking-wider focus:border-blue-500 outline-none select-text cursor-text"
                                />
                                <button onClick={handleActivateLicense} className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl font-bold transition-colors">{t.activate}</button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <p className="text-green-600 dark:text-green-400 font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {t.proActive}</p>
                                <button onClick={() => setShowLicenseInput(true)} className="text-xs text-slate-400 underline">{t.licenseActions}</button>
                            </div>
                        )}

                        {!isPro && (
                            <button onClick={() => setPaymentModalOpen(true)} className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                                {t.buyPro} <ChevronRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* SECURITY PREFERENCES */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-4">
                        <div className="p-2 bg-red-500/10 rounded-xl text-red-500"><Shield className="w-6 h-6" /></div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{t.securityPrefs}</h3>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t.autoLock}</label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t.autoLockDesc}</p>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    value={securityConfig.autoLockTimeout}
                                    onChange={(e) => setSecurityConfig({ ...securityConfig, autoLockTimeout: Number(e.target.value) })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                                >
                                    <option value={60000}>{t.time1min}</option>
                                    <option value={300000}>{t.time5min}</option>
                                    <option value={900000}>{t.time15min}</option>
                                    <option value={1800000}>{t.time30min}</option>
                                    <option value={3600000}>{t.time1hour}</option>
                                    <option value={0}>{t.timeNever}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AUTO BACKUP SETTINGS */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-4">
                        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500"><Save className="w-6 h-6" /></div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{t.autoBackup}</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{t.autoBackupDesc}</p>

                        <div className="flex items-center space-x-3 mb-4">
                            <button onClick={async () => {
                                if (window.electron) {
                                    const path = await window.electron.selectBackupFolder();
                                    if (path) {
                                        setSecurityConfig({ ...securityConfig, autoBackupPath: path, isAutoBackupEnabled: true });
                                        addToast(`${t.backupDirSelected} ${path} `, 'success');
                                    }
                                } else {
                                    addToast("This feature requires the desktop application.", "error");
                                }
                            }} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-bold border border-slate-200 dark:border-slate-700 transition-colors">
                                {t.selectBackupDir}
                            </button>
                            {securityConfig.isAutoBackupEnabled && securityConfig.autoBackupPath && (
                                <span className="text-xs text-green-600 dark:text-green-400 font-bold px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded border border-green-200 dark:border-green-900 truncate max-w-[200px]" title={securityConfig.autoBackupPath}>
                                    {t.backupActive}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="autoBackupCheck"
                                checked={securityConfig.isAutoBackupEnabled || false}
                                onChange={(e) => setSecurityConfig({ ...securityConfig, isAutoBackupEnabled: e.target.checked })}
                                disabled={!securityConfig.autoBackupPath}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <label htmlFor="autoBackupCheck" className={`text-sm font-medium ${!securityConfig.autoBackupPath ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{t.backupActive}</label>
                        </div>
                    </div>
                </div>

                {/* ADMIN PANEL removed from client for security; license keys are now generated only via external offline tool */}

                {/* DATA MANAGEMENT */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-4">
                        <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500"><Download className="w-6 h-6" /></div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{t.dataManagement}</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t.dataDesc}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.export}</h4>
                                <button onClick={() => setExportModalOpen(true)} className="w-full flex items-center justify-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-3 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors text-sm text-slate-700 dark:text-slate-200 font-bold">
                                    <Download className="w-4 h-4 text-blue-500" />
                                    <span>{t.exportTitle}</span>
                                </button>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.import}</h4>
                                <input type="file" ref={importInputRef} onChange={handleFileChange} accept=".csv,.json,.winvault" className="hidden" />
                                <button onClick={handleImportClick} className="w-full flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-2 border-dashed border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl p-4 transition-all group h-[50px]">
                                    <span className="text-blue-600 dark:text-blue-300 text-sm font-medium flex items-center gap-2"><Upload className="w-4 h-4" /> {t.selectFile}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DURESS PASSWORD */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm mt-6">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-4">
                        <div className="p-2 bg-red-500/10 rounded-xl text-red-500"><AlertTriangle className="w-6 h-6" /></div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{t.duressPassword}</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{t.duressDesc}</p>
                        {securityConfig.duressPasswordHash && (
                            <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30 mb-4">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-bold text-sm">{t.duressActive}</span>
                            </div>
                        )}

                        <div className="space-y-3">
                            <input
                                type="password"
                                placeholder={t.newPass}
                                id="duressPass"
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:border-red-500 outline-none transition-colors text-slate-900 dark:text-white select-text cursor-text"
                                onMouseDown={(e) => e.stopPropagation()}
                            />
                            <button onClick={async () => {
                                const input = document.getElementById('duressPass') as HTMLInputElement;
                                const pass = input.value;
                                if (!pass) return;

                                const hash = await hashPassword(pass);
                                if (hash === securityConfig.masterPasswordHash) {
                                    addToast(t.duressWarning, 'error');
                                    return;
                                }

                                setSecurityConfig({ ...securityConfig, duressPasswordHash: hash });
                                addToast("Duress password set!", 'success');
                                input.value = '';
                            }} className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-colors">
                                {t.update}
                            </button>
                        </div>
                    </div>
                </div>

                {/* MASTER PASSWORD */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-4">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><Lock className="w-6 h-6" /></div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{t.masterPassword}</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <input
                            type="password"
                            placeholder={t.currentPass}
                            value={currentPassForChange}
                            onChange={(e) => setCurrentPassForChange(e.target.value)}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-base focus:border-blue-500 outline-none transition-colors text-slate-900 dark:text-white select-text cursor-text"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="password"
                                placeholder={t.newPass}
                                value={newPass1}
                                onChange={(e) => setNewPass1(e.target.value)}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-base focus:border-blue-500 outline-none transition-colors text-slate-900 dark:text-white select-text cursor-text"
                            />
                            <input
                                type="password"
                                placeholder={t.repeatPass}
                                value={newPass2}
                                onChange={(e) => setNewPass2(e.target.value)}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-base focus:border-blue-500 outline-none transition-colors text-slate-900 dark:text-white select-text cursor-text"
                            />
                        </div>
                        <button onClick={handleChangePassword} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl text-base font-semibold transition-colors shadow-lg shadow-blue-900/20">{t.update}</button>
                    </div>
                </div>

                {/* BIOMETRIC LOCK (BOTTOM) */}
                {isBiometrySupported && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><Fingerprint className="w-6 h-6" /></div>
                                <div>
                                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{t.biometricUnlock}</h3>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{t.biometricDesc}</p>
                                </div>
                            </div>
                            {securityConfig.isBiometricEnabled && <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900">{t.active}</span>}
                        </div>
                        <div className="p-6">
                            <button
                                onClick={handleToggleBiometric}
                                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all border ${securityConfig.isBiometricEnabled
                                    ? 'bg-red-50 dark:bg-red-900/10 text-red-500 border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/20'
                                    : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20'}`}
                            >
                                {securityConfig.isBiometricEnabled ? t.disable : t.enableBiometrics}
                            </button>
                        </div>
                    </div>
                )}

                {/* 2FA (BOTTOM) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-green-500/10 rounded-xl text-green-500"><Smartphone className="w-6 h-6" /></div>
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">{t.twoFactor}</h3>
                        </div>
                        {securityConfig.is2FAEnabled && <span className="text-xs font-bold bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 px-3 py-1 rounded-full border border-green-200 dark:border-green-900">{t.active}</span>}
                    </div>
                    <div className="p-6">
                        {!securityConfig.is2FAEnabled && setup2FAStep === 0 && <button onClick={start2FASetup} className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700">{t.startSetup}</button>}
                        {setup2FAStep === 1 && (
                            <div className="flex flex-col items-center space-y-4 p-6 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                                <canvas ref={canvasRef} className="rounded-lg border-4 border-white shadow-md w-40 h-40"></canvas>

                                <div className="w-full">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 text-center">Secret Key (32 Base)</p>
                                    <div style={{ userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text' }} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center font-mono text-sm text-slate-800 dark:text-slate-200 break-all cursor-text">
                                        {tempSecret}
                                    </div>
                                </div>

                                <input
                                    type="text"
                                    placeholder="000 000"
                                    maxLength={6}
                                    value={verifyCode}
                                    onChange={(e) => setVerifyCode(e.target.value)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="w-40 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-center font-mono text-lg tracking-widest text-slate-900 dark:text-white select-text cursor-text"
                                />
                                <div className="flex space-x-3 w-full max-w-xs">
                                    <button onClick={confirm2FASetup} className="flex-1 bg-green-600 hover:bg-green-500 py-2.5 rounded-lg text-white text-sm font-medium">{t.confirm}</button>
                                    <button onClick={() => setSetup2FAStep(0)} className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm py-2.5 rounded-lg">{t.cancel}</button>
                                </div>
                            </div>
                        )}
                        {securityConfig.is2FAEnabled && <button onClick={start2FASetup} className="w-full py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-sm font-medium transition-colors border border-dashed border-red-200 dark:border-red-900/50">{t.disable}</button>}
                    </div>
                </div>

                {/* RECOVERY WORDS (BOTTOM) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <div className="flex items-center space-x-4"><div className="p-2 bg-purple-500/10 rounded-xl text-purple-500"><KeyRound className="w-6 h-6" /></div><h3 className="font-bold text-base text-slate-900 dark:text-white">{t.wordKey}</h3></div>
                        {securityConfig.isWordAuthEnabled && <span className="text-xs font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-900">{t.active}</span>}
                    </div>
                    <div className="p-6">
                        {!securityConfig.isWordAuthEnabled && setupWordStep === 0 && <button onClick={startWordAuthSetup} className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700">{t.createWords}</button>}
                        {setupWordStep === 1 && (
                            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div className="grid grid-cols-4 gap-3 mb-6">
                                    {tempWords.map((word, i) => (
                                        <div key={i} className="text-xs text-slate-500 dark:text-slate-400 flex items-center bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 select-text cursor-text" onMouseDown={(e) => e.stopPropagation()}>
                                            <span className="text-slate-400 dark:text-slate-600 mr-2 font-mono">{i + 1}.</span>{word}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center">
                                    <button onClick={() => { navigator.clipboard.writeText(tempWords.join(' ')); addToast(t.copied); }} className="text-sm text-blue-500 hover:text-blue-400 flex items-center font-medium">
                                        <Copy className="w-4 h-4 mr-2" /> {t.copyAll}
                                    </button>
                                    <button onClick={confirmWordAuthSetup} className="bg-purple-600 hover:bg-purple-500 px-5 py-2.5 rounded-lg text-white text-sm font-semibold">{t.activate}</button>
                                </div>
                            </div>
                        )}
                        {securityConfig.isWordAuthEnabled && <button onClick={startWordAuthSetup} className="w-full py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-sm font-medium transition-colors border border-dashed border-red-200 dark:border-red-900/50">{t.disable}</button>}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SettingsView;

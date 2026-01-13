import React, { useState } from 'react';
import {
    Globe, Palette, Sun, Moon, Monitor, Shield, Mail, FileText, CheckCircle,
    Crown, ChevronRight, Clock, Save, ShieldAlert, Download, Upload, AlertTriangle,
    Lock, KeyRound, Smartphone, Fingerprint, Copy, Layout, CreditCard, HelpCircle, HardDrive
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../utils';
import { Language, Theme } from '../../types';

interface SettingsViewProps {
    daysLeft: number;
    getDeviceId: () => string;
    addToast: (msg: string, type?: any) => void;

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

type TabType = 'general' | 'account' | 'security' | 'data' | 'support';

const SettingsView: React.FC<SettingsViewProps> = (props) => {
    const {
        lang, setLang, theme, setTheme, securityConfig, setSecurityConfig,
        isPro, setGuideOpen, setPrivacyModalOpen, setPaymentModalOpen, setExportModalOpen
    } = useAppStore();
    const t = TRANSLATIONS[lang];
    const [activeTab, setActiveTab] = useState<TabType>('general');

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

    const navItems = [
        { id: 'general', label: t.tabGeneral || 'General', icon: Globe },
        { id: 'account', label: t.tabAccount || 'Account', icon: Crown },
        { id: 'security', label: t.tabSecurity || 'Security', icon: Shield },
        { id: 'data', label: t.tabData || 'Data', icon: HardDrive },
        { id: 'support', label: t.tabSupport || 'Support', icon: HelpCircle },
    ];

    return (
        <div className="flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{t.settings}</h2>
                </div>
                <div className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as TabType)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                                ${activeTab === item.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                            <span>{item.label}</span>
                            {item.id === 'account' && !isPro && (
                                <span className="ml-auto w-2 h-2 rounded-full bg-red-500"></span>
                            )}
                        </button>
                    ))}
                </div>
                {/* Device Info Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 dark:text-slate-600 font-mono text-center select-all">
                        v2.0.1 • {getDeviceId().substring(0, 8)}...
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

                    {/* Header for Mobile/Context */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            {navItems.find(i => i.id === activeTab)?.icon && React.createElement(navItems.find(i => i.id === activeTab)!.icon, { className: "w-8 h-8 text-blue-600 dark:text-blue-400" })}
                            {navItems.find(i => i.id === activeTab)?.label}
                        </h1>
                    </div>

                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 gap-6">
                            {/* LANGUAGE */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-blue-500" /> {t.language}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => setLang('tr')} className={`py-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center space-x-2 ${lang === 'tr' ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                                        <span className="text-xl">🇹🇷</span> <span>TÜRKÇE</span>
                                    </button>
                                    <button onClick={() => setLang('en')} className={`py-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center space-x-2 ${lang === 'en' ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                                        <span className="text-xl">🇺🇸</span> <span>ENGLISH</span>
                                    </button>
                                </div>
                            </div>

                            {/* THEME */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-purple-500" /> {lang === 'tr' ? 'Görünüm' : 'Appearance'}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button onClick={() => setTheme('light')} className={`py-4 rounded-xl border text-sm font-bold transition-all flex flex-col items-center justify-center space-y-2 ${theme === 'light' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                                        <Sun className="w-6 h-6" />
                                        <span>{lang === 'tr' ? 'AYDINLIK' : 'LIGHT'}</span>
                                    </button>
                                    <button onClick={() => setTheme('dark')} className={`py-4 rounded-xl border text-sm font-bold transition-all flex flex-col items-center justify-center space-y-2 ${theme === 'dark' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                                        <Moon className="w-6 h-6" />
                                        <span>{lang === 'tr' ? 'KARANLIK' : 'DARK'}</span>
                                    </button>
                                    <button onClick={() => setTheme('amoled')} className={`py-4 rounded-xl border text-sm font-bold transition-all flex flex-col items-center justify-center space-y-2 ${theme === 'amoled' ? 'bg-black text-white border-blue-600 shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                                        <Monitor className="w-6 h-6" />
                                        <span>{lang === 'tr' ? 'OLED SİYAH' : 'OLED BLACK'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACCOUNT TAB */}
                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm relative">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500"><Crown className="w-8 h-8" /></div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t.licenseStatus}</h3>
                                            <p className="text-sm text-slate-500">{isPro ? 'Premium User' : 'Free User'}</p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold px-4 py-2 rounded-full border ${isPro ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}>
                                        {isPro ? t.proVersion : t.freeVersion}
                                    </span>
                                </div>

                                <div className="p-8">
                                    <div className="mb-8">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t.deviceId}</label>
                                        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                            <code className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 flex-1 select-all">{getDeviceId()}</code>
                                            <button onClick={() => { navigator.clipboard.writeText(getDeviceId()); addToast(t.copied); }} className="text-slate-400 hover:text-blue-500 transition-colors">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {!isPro && (
                                        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 mb-8">
                                            <h4 className="text-blue-900 dark:text-blue-100 font-bold mb-2">Trial Status</h4>
                                            <p className="text-sm text-blue-800 dark:text-blue-200 mb-4 leading-relaxed">
                                                {daysLeft > 0 ? t.trialActiveDesc : t.trialDesc}
                                            </p>
                                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                                <Clock className="w-5 h-5" />
                                                {daysLeft > 0 ? `${t.daysLeft} ${daysLeft} ${t.day}` : t.trialExpired}
                                            </div>
                                        </div>
                                    )}

                                    {showLicenseInput ? (
                                        <div className="space-y-4">
                                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Enter License Key</label>
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                                                    value={licenseKeyInput}
                                                    onChange={handleLicenseInput}
                                                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-center font-mono text-slate-900 dark:text-white uppercase tracking-wider focus:border-blue-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                                                />
                                                <button onClick={handleActivateLicense} className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-600/30 active:scale-95">
                                                    {t.activate}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <p className="text-green-600 dark:text-green-400 font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {t.proActive}</p>
                                            <button onClick={() => setShowLicenseInput(true)} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline transition-colors">{t.licenseActions}</button>
                                        </div>
                                    )}

                                    {!isPro && (
                                        <button onClick={() => setPaymentModalOpen(true)} className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-bold shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1">
                                            {t.buyPro} <ChevronRight className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            {/* MASTER PASSWORD */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600"><Lock className="w-6 h-6" /></div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t.masterPassword}</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.currentPass}</label>
                                        <input
                                            type="password"
                                            value={currentPassForChange}
                                            onChange={(e) => setCurrentPassForChange(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:border-blue-500 outline-none transition-colors dark:text-white"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.newPass}</label>
                                            <input
                                                type="password"
                                                value={newPass1}
                                                onChange={(e) => setNewPass1(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:border-blue-500 outline-none transition-colors dark:text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.repeatPass}</label>
                                            <input
                                                type="password"
                                                value={newPass2}
                                                onChange={(e) => setNewPass2(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:border-blue-500 outline-none transition-colors dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <button onClick={handleChangePassword} className="w-full bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-colors">
                                        {t.update}
                                    </button>
                                </div>
                            </div>

                            {/* PREFERENCES */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-slate-500" /> {t.autoLock}
                                    </h4>
                                    <select
                                        value={securityConfig.autoLockTimeout}
                                        onChange={(e) => setSecurityConfig({ ...securityConfig, autoLockTimeout: Number(e.target.value) })}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    >
                                        <option value={60000}>{t.time1min}</option>
                                        <option value={300000}>{t.time5min}</option>
                                        <option value={900000}>{t.time15min}</option>
                                        <option value={1800000}>{t.time30min}</option>
                                        <option value={3600000}>{t.time1hour}</option>
                                        <option value={0}>{t.timeNever}</option>
                                    </select>
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Copy className="w-5 h-5 text-slate-500" /> {t.clipboardTimeout}
                                    </h4>
                                    <select
                                        value={securityConfig.clipboardTimeout || 30000}
                                        onChange={(e) => setSecurityConfig({ ...securityConfig, clipboardTimeout: Number(e.target.value) })}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    >
                                        <option value={10000}>{t.time10sec}</option>
                                        <option value={30000}>{t.time30sec}</option>
                                        <option value={60000}>{t.time1min}</option>
                                        <option value={120000}>{t.time2min}</option>
                                    </select>
                                </div>
                            </div>

                            {/* 2FA & BIOMETRIC */}
                            <div className="grid grid-cols-1 gap-6">
                                {isBiometrySupported && (
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex justify-between items-center shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600"><Fingerprint className="w-6 h-6" /></div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">{t.biometricUnlock}</h3>
                                                <p className="text-sm text-slate-500">{t.biometricDesc}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleToggleBiometric}
                                            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${securityConfig.isBiometricEnabled
                                                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}`}
                                        >
                                            {securityConfig.isBiometricEnabled ? t.disable : t.enableBiometrics}
                                        </button>
                                    </div>
                                )}

                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="p-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-green-500/10 rounded-xl text-green-600"><Smartphone className="w-6 h-6" /></div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">{t.twoFactor}</h3>
                                                <p className="text-sm text-slate-500">Google Authenticator / Authy</p>
                                            </div>
                                        </div>
                                        {securityConfig.is2FAEnabled && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">{t.active}</span>}
                                    </div>

                                    <div className="p-6">
                                        {!securityConfig.is2FAEnabled && setup2FAStep === 0 && (
                                            <button onClick={start2FASetup} className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors">
                                                {t.startSetup}
                                            </button>
                                        )}

                                        {setup2FAStep === 1 && (
                                            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-6">
                                                <canvas ref={canvasRef} className="rounded-xl border-4 border-white shadow-lg w-48 h-48"></canvas>
                                                <div className="w-full text-center">
                                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Secret Key</p>
                                                    <code className="bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-mono select-all">
                                                        {tempSecret}
                                                    </code>
                                                </div>
                                                <div className="flex gap-2 w-full max-w-sm">
                                                    <input
                                                        type="text"
                                                        placeholder="000 000"
                                                        maxLength={6}
                                                        value={verifyCode}
                                                        onChange={(e) => setVerifyCode(e.target.value)}
                                                        className="flex-1 text-center text-lg tracking-widest px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-900 dark:text-white outline-none focus:border-blue-500"
                                                    />
                                                    <button onClick={confirm2FASetup} className="px-6 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors">{t.confirm}</button>
                                                    <button onClick={() => setSetup2FAStep(0)} className="px-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg">{t.cancel}</button>
                                                </div>
                                            </div>
                                        )}

                                        {securityConfig.is2FAEnabled && (
                                            <button onClick={start2FASetup} className="w-full py-3 border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-xl transition-colors">
                                                {t.disable}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* DURESS */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-red-500/10 rounded-lg text-red-600"><AlertTriangle className="w-6 h-6" /></div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t.duressPassword}</h3>
                                </div>
                                <div className="p-6">
                                    <p className="text-sm text-slate-500 mb-4">{t.duressDesc}</p>
                                    <div className="flex gap-3">
                                        <input
                                            type="password"
                                            id="duressPassSettings"
                                            placeholder={t.newPass}
                                            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-red-500 transition-colors dark:text-white"
                                        />
                                        <button onClick={async () => {
                                            const input = document.getElementById('duressPassSettings') as HTMLInputElement;
                                            if (!input.value) return;
                                            const hash = await hashPassword(input.value);
                                            if (hash === securityConfig.masterPasswordHash) {
                                                addToast(t.duressWarning, 'error');
                                                return;
                                            }
                                            setSecurityConfig({ ...securityConfig, duressPasswordHash: hash });
                                            addToast("Duress password set!", 'success');
                                            input.value = '';
                                        }} className="px-6 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-colors">
                                            {t.update}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* RECOVERY WORDS */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600"><KeyRound className="w-6 h-6" /></div>
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t.wordKey}</h3>
                                    </div>
                                    {securityConfig.isWordAuthEnabled && <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border border-purple-200">{t.active}</span>}
                                </div>
                                <div className="p-6">
                                    {!securityConfig.isWordAuthEnabled && setupWordStep === 0 && (
                                        <button onClick={startWordAuthSetup} className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors">
                                            {t.createWords}
                                        </button>
                                    )}
                                    {setupWordStep === 1 && (
                                        <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
                                                {tempWords.map((word, i) => (
                                                    <div key={i} className="text-xs bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 flex gap-2 items-center dark:text-slate-300">
                                                        <span className="text-slate-400 select-none">{i + 1}.</span>
                                                        <span className="font-mono font-bold select-all">{word}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <button onClick={() => { navigator.clipboard.writeText(tempWords.join(' ')); addToast(t.copied); }} className="text-blue-600 hover:text-blue-500 text-sm font-bold flex items-center gap-2">
                                                    <Copy className="w-4 h-4" /> {t.copyAll}
                                                </button>
                                                <button onClick={confirmWordAuthSetup} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors">{t.activate}</button>
                                            </div>
                                        </div>
                                    )}
                                    {securityConfig.isWordAuthEnabled && (
                                        <button onClick={startWordAuthSetup} className="w-full py-3 border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-xl transition-colors">
                                            {t.disable}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DATA TAB */}
                    {activeTab === 'data' && (
                        <div className="space-y-6">
                            {/* AUTO BACKUP */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600"><Save className="w-6 h-6" /></div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t.autoBackup}</h3>
                                </div>
                                <div className="p-6">
                                    <p className="text-sm text-slate-500 mb-6">{t.autoBackupDesc}</p>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
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
                                        }} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors text-sm">
                                            {t.selectBackupDir}
                                        </button>

                                        {securityConfig.autoBackupPath ? (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                <span className="text-xs font-mono text-green-700 dark:text-green-400 truncate max-w-[200px]">{securityConfig.autoBackupPath}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">No folder selected</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <input
                                            type="checkbox"
                                            id="autoBackupCheck"
                                            checked={securityConfig.isAutoBackupEnabled || false}
                                            onChange={(e) => setSecurityConfig({ ...securityConfig, isAutoBackupEnabled: e.target.checked })}
                                            disabled={!securityConfig.autoBackupPath}
                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="autoBackupCheck" className={`font-medium ${!securityConfig.autoBackupPath ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                            Enable Automatic Backup on Exit
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* IMPORT / EXPORT */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-600"><Download className="w-6 h-6" /></div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t.dataManagement}</h3>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t.export}</h4>
                                        <button onClick={() => setExportModalOpen(true)} className="w-full flex items-center justify-center gap-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-6 rounded-2xl border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600 transition-all group">
                                            <div className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                                <Download className="w-6 h-6 text-blue-500" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-slate-700 dark:text-slate-200">{t.exportTitle}</div>
                                                <div className="text-xs text-slate-500">CSV, JSON, Encrypted</div>
                                            </div>
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t.import}</h4>
                                        <input type="file" ref={importInputRef} onChange={handleFileChange} accept=".csv,.json,.winvault" className="hidden" />
                                        <button onClick={handleImportClick} className="w-full flex items-center justify-center gap-3 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 p-6 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800 hover:border-blue-400 transition-all group">
                                            <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                                <Upload className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-blue-700 dark:text-blue-300">{t.selectFile}</div>
                                                <div className="text-xs text-blue-500 dark:text-blue-400 opacity-80">Drag & Drop supported</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUPPORT TAB */}
                    {activeTab === 'support' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-green-500/10 rounded-lg text-green-600"><Shield className="w-6 h-6" /></div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t.privacyPolicy}</h3>
                                </div>
                                <div className="p-6">
                                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">{t.privacyDesc}</p>
                                    <button onClick={() => setPrivacyModalOpen(true)} className="w-full py-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex justify-center items-center gap-2">
                                        <Shield className="w-5 h-5" />
                                        {t.privacyPolicy}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-600"><Mail className="w-6 h-6" /></div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t.supportTitle}</h3>
                                </div>
                                <div className="p-6">
                                    <p className="text-sm text-slate-500 mb-6">{t.supportDesc}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button onClick={() => setGuideOpen(true)} className="flex items-center justify-center gap-2 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-bold transition-colors">
                                            <FileText className="w-5 h-5" />
                                            <span>{lang === 'tr' ? 'Kullanım Kılavuzu' : 'User Guide'}</span>
                                        </button>
                                        <button onClick={() => {
                                            const subject = encodeURIComponent(t.supportSubject);
                                            const body = encodeURIComponent(t.supportMessage.replace('[Otomatik doldurulur]', getDeviceId()));
                                            window.open(`mailto:sales@hetech-me.space?subject=${subject}&body=${body}`, '_blank');
                                            addToast(t.emailSent, 'info');
                                        }} className="flex items-center justify-center gap-2 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-cyan-500/20">
                                            <Mail className="w-5 h-5" />
                                            <span>{t.contactSupport}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsView;

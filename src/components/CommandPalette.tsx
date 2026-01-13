import React, { useState, useEffect, useRef } from 'react';
import { Search, Shield, Key, Settings, CreditCard, StickyNote, Command, X, ArrowRight, Plus, Lock } from 'lucide-react';
import { AppView } from '../types';
import { TRANSLATIONS } from '../utils';
import { useAppStore } from '../store/useAppStore';
import { useVaultStore } from '../store/useVaultStore';

interface CommandPaletteProps {
    onSelectCredential: (id: string) => void;
    onLock: () => void;
    onAddRecord: () => void;
}

interface ResultItem {
    id: string;
    icon: any;
    label: string;
    sublabel?: string;
    action: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
    onSelectCredential,
    onLock,
    onAddRecord,
}) => {
    const { isCommandPaletteOpen: isOpen, setCommandPaletteOpen: onClose, lang, setCurrentView: onChangeView } = useAppStore();
    const { credentials } = useVaultStore();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const t = TRANSLATIONS[lang];

    // Commands
    const commands: ResultItem[] = [
        { id: 'view-vault', icon: Shield, label: lang === 'tr' ? 'Kasayı Görüntüle' : 'View Vault', sublabel: lang === 'tr' ? 'Tüm şifrelerinize ve verilerinize erişin' : 'Access all your passwords and data', action: () => onChangeView(AppView.VAULT) },
        { id: 'view-generator', icon: Key, label: lang === 'tr' ? 'Şifre Üretici' : 'Password Generator', sublabel: lang === 'tr' ? 'Güçlü ve güvenli şifreler oluşturun' : 'Create strong and secure passwords', action: () => onChangeView(AppView.GENERATOR) },
        { id: 'view-settings', icon: Settings, label: lang === 'tr' ? 'Ayarlar' : 'Settings', sublabel: lang === 'tr' ? 'Uygulama tercihlerini ve güvenliği yönetin' : 'Manage app preferences and security', action: () => onChangeView(AppView.SETTINGS) },
        {
            id: 'add-record', icon: Plus, label: lang === 'tr' ? 'Yeni Kayıt Ekle' : 'Add New Record', sublabel: lang === 'tr' ? 'Kasaya yeni bir giriş, kart veya not ekleyin' : 'Add a new login, card, or note to vault', action: () => {
                onAddRecord();
            }
        },
        {
            id: 'lock-app', icon: Lock, label: lang === 'tr' ? 'Uygulamayı Kilitle' : 'Lock Application', sublabel: lang === 'tr' ? 'Oturumu hemen sonlandır ve kilitle' : 'End session and lock immediately', action: () => {
                onLock();
            }
        },
    ];

    // Search Results
    const searchResults = query.trim() === ''
        ? []
        : credentials.filter(c =>
            !c.deletedAt && (
                c.siteName.toLowerCase().includes(query.toLowerCase()) ||
                c.username?.toLowerCase().includes(query.toLowerCase()) ||
                c.alias?.toLowerCase().includes(query.toLowerCase()) ||
                (c.notes && c.notes.toLowerCase().includes(query.toLowerCase()))
            )
        ).slice(0, 8);

    const combinedResults: ResultItem[] = [
        ...commands.filter(cmd => cmd.label.toLowerCase().includes(query.toLowerCase())),
        ...searchResults.map(c => ({
            id: c.id,
            icon: c.type === 'CARD' ? CreditCard : c.type === 'NOTE' ? StickyNote : Shield,
            label: c.siteName,
            sublabel: c.username || c.alias || (c.type === 'CARD' ? `**** ${c.cardNumber?.slice(-4)}` : ''),
            action: () => onSelectCredential(c.id)
        }))
    ];

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose(false);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (combinedResults.length > 0 ? (prev + 1) % combinedResults.length : 0));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (combinedResults.length > 0 ? (prev - 1 + combinedResults.length) % combinedResults.length : 0));
            } else if (e.key === 'Enter') {
                if (combinedResults[selectedIndex]) {
                    combinedResults[selectedIndex].action();
                    onClose(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, combinedResults, selectedIndex, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-md bg-black/40 animate-fade-in" onClick={() => onClose(false)}>
            <div
                className="w-full max-w-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-800">
                    <Search className="w-5 h-5 text-slate-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        placeholder={lang === 'tr' ? "Komut ara veya kasada sorgula..." : "Search commands or vault..."}
                        className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white text-lg placeholder-slate-400"
                    />
                    <div className="flex items-center space-x-1.5 ml-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-200 dark:border-slate-700">ESC</span>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                    {combinedResults.length > 0 ? (
                        <div className="space-y-1">
                            {combinedResults.map((item, index) => {
                                const Icon = item.icon;
                                const isSelected = index === selectedIndex;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            item.action();
                                            onClose(false);
                                        }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${isSelected
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg mr-3 ${isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-200'}`}>
                                                {item.label}
                                            </div>
                                            {item.sublabel && (
                                                <div className={`text-[10px] font-mono opacity-80 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                                                    {item.sublabel}
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && <ArrowRight className="w-4 h-4 ml-2" />}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                            <Command className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm font-medium">{lang === 'tr' ? "Sonuç bulunamadı." : "No results found."}</p>
                        </div>
                    )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center space-x-4">
                        <span className="flex items-center"><ArrowRight className="w-3 h-3 mr-1" /> {lang === 'tr' ? "Seç" : "Select"}</span>
                        <span className="flex items-center"><Command className="w-3 h-3 mr-1" /> {lang === 'tr' ? "Gezin" : "Navigate"}</span>
                    </div>
                    <div>WINVAULT COMMAND PALETTE</div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;

import React from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../utils';

interface RestoreModalProps {
    onRestore: () => void;
    restorePassword: string;
    setRestorePassword: (p: string) => void;
    onClose: () => void;
}

const RestoreModal: React.FC<RestoreModalProps> = ({ onRestore, restorePassword, setRestorePassword, onClose }) => {
    const { lang, isRestoreModalOpen } = useAppStore();
    const t = TRANSLATIONS[lang];

    if (!isRestoreModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white"><X className="w-5 h-5" /></button>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t.restoreTitle}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">{t.restoreDesc}</p>
                <input
                    type="password"
                    value={restorePassword}
                    onChange={(e) => setRestorePassword(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder={t.backupPassPlaceholder}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white mb-4 focus:border-blue-500 outline-none select-text cursor-text"
                    autoFocus
                />
                <button onClick={onRestore} disabled={!restorePassword} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white py-3 rounded-lg font-bold">{t.restoreAction}</button>
            </div>
        </div>
    );
};

export default RestoreModal;

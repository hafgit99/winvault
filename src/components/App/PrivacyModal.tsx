import React from 'react';
import { X, Shield } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../utils';

const PrivacyModal: React.FC = () => {
    const { lang, isPrivacyModalOpen, setPrivacyModalOpen } = useAppStore();
    const t = TRANSLATIONS[lang];

    if (!isPrivacyModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 w-full max-w-2xl shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button onClick={() => setPrivacyModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white"><X className="w-5 h-5" /></button>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                    <Shield className="w-8 h-8 text-green-500" />
                    {t.privacyTitle}
                </h3>
                <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap select-text cursor-text" onMouseDown={(e) => e.stopPropagation()}>
                    {t.gdprText}
                </div>
                <div className="mt-8 flex justify-end">
                    <button onClick={() => setPrivacyModalOpen(false)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-colors">
                        {t.confirm}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyModal;

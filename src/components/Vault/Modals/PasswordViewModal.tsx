import React from 'react';
import { X, Copy } from 'lucide-react';
import { Credential, Language } from '../../../types';
import { TRANSLATIONS } from '../../../utils';
import { TotpAndCustomFields, AttachmentsList, PasswordHistory } from '../VaultHelpers';

interface PasswordViewModalProps {
    credId: string;
    credentials: Credential[];
    onClose: () => void;
    lang: Language;
    onCopy: (text: string) => void;
    onTouch: (id: string) => void;
    totpCodes: Map<string, string>;
    totpProgress: number;
    visibleHistory: Set<string>;
    onToggleHistory: (id: string) => void;
}

const PasswordViewModal: React.FC<PasswordViewModalProps> = ({
    credId, credentials, onClose, lang, onCopy, onTouch, totpCodes, totpProgress, visibleHistory, onToggleHistory
}) => {
    const t = TRANSLATIONS[lang];
    const cred = credentials.find(c => c.id === credId);

    if (!cred) return null;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            const selection = window.getSelection();
            if (selection && selection.toString().length > 0) {
                navigator.clipboard.writeText(selection.toString());
            }
        }
    };

    const copyAll = () => {
        const text = cred.type === 'CARD' ? (cred.cardNumber || '') :
            cred.type === 'NOTE' ? (cred.notes || '') :
                (cred.passwordValue || '');
        onCopy(text);
        onTouch(cred.id);
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                <div className="space-y-4" onKeyDown={handleKeyDown} role="region" onContextMenu={(e) => e.preventDefault()}>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{cred.siteName}</h3>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-3">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-800/50 rounded text-blue-600 dark:text-blue-400 flex-shrink-0"><Copy className="w-4 h-4" /></div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                            <p className="font-semibold mb-1">{t.copyInstruction}</p>
                            <p>{t.copyHint}</p>
                        </div>
                    </div>

                    {cred.type === 'CARD' ? (
                        <div className="space-y-3">
                            <div><label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Kart Numarası</label><div className="block mt-1 text-sm font-mono bg-slate-50 dark:bg-slate-950 p-3 rounded-lg text-slate-800 dark:text-slate-200 select-text cursor-text">{cred.cardNumber}</div></div>
                            <div><label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">CVV</label><div className="block mt-1 text-sm font-mono bg-slate-50 dark:bg-slate-950 p-3 rounded-lg text-slate-800 dark:text-slate-200 select-text cursor-text">{cred.cvv}</div></div>
                            <div><label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Son Kullanma Tarihi</label><div className="block mt-1 text-sm font-mono bg-slate-50 dark:bg-slate-950 p-3 rounded-lg text-slate-800 dark:text-slate-200 select-text cursor-text">{cred.expiry}</div></div>
                        </div>
                    ) : cred.type === 'NOTE' ? (
                        <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 block">İçerik</label>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-mono text-slate-800 dark:text-slate-200 select-text cursor-text whitespace-pre-wrap">{cred.notes}</div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{t.username}</label>
                                <div className="block mt-1 text-sm font-mono bg-slate-50 dark:bg-slate-950 p-3 rounded-lg text-slate-800 dark:text-slate-200 select-text cursor-text break-all">
                                    {cred.username || '---'}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Şifre</label>
                                <div className="block mt-1 text-sm font-mono bg-slate-50 dark:bg-slate-950 p-3 rounded-lg text-slate-800 dark:text-slate-200 select-text cursor-text break-all">
                                    {cred.passwordValue}
                                </div>
                            </div>
                        </div>
                    )}

                    <TotpAndCustomFields cred={cred} lang={lang} onCopy={onCopy} onTouch={onTouch} totpCodes={totpCodes} totpProgress={totpProgress} />
                    <PasswordHistory cred={cred} lang={lang} onCopy={onCopy} onTouch={onTouch} isVisible={visibleHistory.has(cred.id)} onToggle={onToggleHistory} />
                    <AttachmentsList files={cred.attachments} lang={lang} />

                    <button onClick={copyAll} className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                        <Copy className="w-4 h-4" />{t.copyAll}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PasswordViewModal;

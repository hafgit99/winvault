import React from 'react';
import { ShieldCheck, Copy, Paperclip, FileText, Download, Clock, Minimize2, Maximize2 } from 'lucide-react';
import { Credential, Attachment, Language } from '../../types';
import { TRANSLATIONS, downloadAttachment } from '../../utils';

interface Props {
    cred: Credential;
    lang: Language;
    onCopy: (text: string) => void;
    onTouch: (id: string) => void;
}

export const TotpAndCustomFields: React.FC<Props & { totpCodes: Map<string, string>, totpProgress: number }> = ({
    cred, lang, onCopy, onTouch, totpCodes, totpProgress
}) => {
    const t = TRANSLATIONS[lang];
    const totpCode = totpCodes.get(cred.id);
    const hasCustomFields = cred.customFields && cred.customFields.length > 0;

    if (!totpCode && !hasCustomFields) return null;

    return (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            {totpCode && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> {t.totpLabel}
                        </span>
                        <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                                style={{ width: `${totpProgress}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-mono font-bold tracking-[0.2em] text-blue-700 dark:text-blue-300">
                            {totpCode.slice(0, 3)} {totpCode.slice(3)}
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); onCopy(totpCode); onTouch(cred.id); }}
                            className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-md text-blue-600 dark:text-blue-400 shadow-sm transition-colors"
                            title={t.copy}
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {hasCustomFields && (
                <div className="grid grid-cols-1 gap-2">
                    {cred.customFields?.map((field, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-lg px-3 py-2">
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{field.label}</p>
                                <p className="text-sm font-mono text-slate-700 dark:text-slate-200 truncate select-text cursor-text" onMouseDown={(e) => e.stopPropagation()}>{field.value}</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onCopy(field.value); onTouch(cred.id); }}
                                className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors"
                                aria-label={t.copy}
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const AttachmentsList: React.FC<{ files?: Attachment[], lang: Language }> = ({ files, lang }) => {
    const t = TRANSLATIONS[lang];
    if (!files || files.length === 0) return null;

    const handleDownload = async (att: Attachment, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await downloadAttachment(att.data, att.name, att.type);
    };

    return (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase flex items-center gap-1"><Paperclip className="w-3 h-3" /> {t.attachments}</h4>
            <div className="space-y-2">
                {files.map(att => (
                    <div key={att.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 group/att hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                        <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="w-8 h-8 flex-shrink-0 bg-slate-200 dark:bg-slate-800 rounded flex items-center justify-center text-slate-500">
                                {att.type.startsWith('image/') ? <img src={att.data} alt="thumb" className="w-full h-full object-cover rounded" /> : <FileText className="w-4 h-4" />}
                            </div>
                            <div className="truncate">
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{att.name}</p>
                                <p className="text-[10px] text-slate-400">{(att.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => handleDownload(att, e)}
                            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-md transition-colors flex items-center gap-2 cursor-pointer z-10"
                            aria-label={t.download}
                            title={lang === 'tr' ? 'İndir' : 'Download'}
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{lang === 'tr' ? 'İndir' : 'Download'}</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const PasswordHistory: React.FC<Props & { isVisible: boolean, onToggle: (id: string) => void }> = ({
    cred, lang, onCopy, onTouch, isVisible, onToggle
}) => {
    const t = TRANSLATIONS[lang];
    const history = cred.history;
    if (!history || history.length === 0 || (cred.type && cred.type !== 'LOGIN')) return null;

    return (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle(cred.id);
                }}
                className="flex items-center justify-between w-full hover:bg-slate-100 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors group"
            >
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.passwordHistory}</span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold">{history.length}</span>
                </div>
                {isVisible ? <Minimize2 className="w-3.5 h-3.5 text-slate-400" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {isVisible && (
                <div className="mt-2 space-y-2 animate-fade-in">
                    {[...history].reverse().map((entry, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-lg p-2.5 flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter bg-slate-200/50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">#{history.length - idx}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">{new Date(entry.date).toLocaleString()}</span>
                                </div>
                                <p className="text-sm font-mono text-slate-700 dark:text-slate-200 truncate select-text cursor-text" onMouseDown={(e) => e.stopPropagation()}>
                                    {entry.value}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onCopy(entry.value); onTouch(cred.id); }}
                                    className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-blue-500 transition-colors"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

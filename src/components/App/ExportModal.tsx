import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../utils';

interface ExportModalProps {
    onExport: () => void;
    exportPassword: string;
    setExportPassword: (p: string) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ onExport, exportPassword, setExportPassword }) => {
    const {
        isExportModalOpen, setExportModalOpen,
        exportFormat, setExportFormat,
        isExportEncrypted, setExportEncrypted,
        lang
    } = useAppStore();
    const t = TRANSLATIONS[lang];

    if (!isExportModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in relative">
                <button onClick={() => setExportModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white"><X className="w-5 h-5" /></button>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t.exportTitle}</h3>

                <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">{t.format}</label>
                    <div className="flex gap-2">
                        <button onClick={() => setExportFormat('CSV')} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${exportFormat === 'CSV' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>CSV</button>
                        <button onClick={() => setExportFormat('JSON')} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${exportFormat === 'JSON' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>JSON</button>
                        <button onClick={() => { setExportFormat('WINVAULT'); setExportEncrypted(true); }} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${exportFormat === 'WINVAULT' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>.WINVAULT</button>
                    </div>
                </div>

                {exportFormat === 'CSV' && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900/50 flex gap-3 items-start mb-4">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-700 dark:text-yellow-200/80">{t.csvWarning}</p>
                    </div>
                )}

                <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                        <input
                            type="checkbox"
                            id="encCheck"
                            checked={isExportEncrypted}
                            onChange={(e) => exportFormat !== 'WINVAULT' && setExportEncrypted(e.target.checked)}
                            disabled={exportFormat === 'WINVAULT'}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="encCheck" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">{t.encryptFile}</label>
                    </div>

                    {isExportEncrypted && (
                        <input
                            type="password"
                            value={exportPassword}
                            onChange={(e) => setExportPassword(e.target.value)}
                            onMouseDown={(e) => e.stopPropagation()}
                            placeholder={t.backupPassPlaceholder}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors select-text cursor-text"
                            autoFocus
                        />
                    )}

                    {exportFormat === 'WINVAULT' && (
                        <p className="text-xs text-blue-500 mt-2">{t.winvaultRequired}</p>
                    )}
                </div>

                <button onClick={onExport} disabled={isExportEncrypted && !exportPassword} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white py-3 rounded-lg font-bold">{t.download}</button>
            </div>
        </div>
    );
};

export default ExportModal;

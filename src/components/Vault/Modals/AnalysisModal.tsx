import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { SecurityAnalysis, Language } from '../../../types';
import { TRANSLATIONS } from '../../../utils';

interface AnalysisModalProps {
    analysis: SecurityAnalysis;
    onClose: () => void;
    lang: Language;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ analysis, onClose, lang }) => {
    const t = TRANSLATIONS[lang];
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                <div className="flex items-center space-x-4 mb-6">
                    <div className={`p-3 rounded-xl ${analysis.score > 70 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.securityReport}</h3>
                </div>

                <div className="space-y-5">
                    <div>
                        <div className="flex justify-between mb-2 text-sm font-medium">
                            <span className="text-slate-500 dark:text-slate-400">{t.score}</span>
                            <span className={`${analysis.score > 70 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{analysis.score}/100</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                            <div className={`h-3 rounded-full transition-all duration-500 ${analysis.score > 70 ? 'bg-green-500' : analysis.score > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${analysis.score}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50">
                        <p className="text-slate-700 dark:text-slate-300 text-sm italic">"{analysis.feedback}"</p>
                    </div>

                    <div>
                        <h4 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-500 font-bold mb-3">{t.suggestions}</h4>
                        <ul className="space-y-2">
                            {analysis.suggestions.map((s, i) => (
                                <li key={i} className="flex items-start text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/50 p-3 rounded border border-slate-100 dark:border-slate-800/50">
                                    <span className="mr-3 text-blue-500 mt-0.5">•</span>{s}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisModal;

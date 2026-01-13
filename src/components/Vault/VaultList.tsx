import React from 'react';
import { VariableSizeList as VariableList } from 'react-window';
import { Star, CreditCard, StickyNote, FileText, Copy, Eye, Sparkles, Pencil, Trash2, RotateCcw, X } from 'lucide-react';
import { Credential, Language } from '../../types';
import { TRANSLATIONS } from '../../utils';

interface VaultListProps {
    filteredCredentials: Credential[];
    onCopy: (text: string) => void;
    onTouch: (id: string) => void;
    setViewPasswordModal: (id: string | null) => void;
    handleAnalyze: (id: string, password: string) => void;
    analyzingId: string | null;
    openEditModal: (cred: Credential) => void;
    onDelete: (id: string) => void;
    isTrashMode: boolean;
    onRestore: (id: string) => void;
    onPermanentDelete: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    faviconCache: Map<string, string>;
    isMiniMode: boolean;
    lang: Language;
    listRef: React.RefObject<any>;
}

const VaultList: React.FC<VaultListProps> = ({
    filteredCredentials, onCopy, onTouch, setViewPasswordModal, handleAnalyze, analyzingId,
    openEditModal, onDelete, isTrashMode, onRestore, onPermanentDelete, onToggleFavorite, 
    faviconCache, isMiniMode, lang, listRef
}) => {
    const t = TRANSLATIONS[lang];

    const getItemSize = (index: number) => {
        return 84;
    };

    return (
        <VariableList
            ref={listRef}
            height={800} // Default height, parent AutoSizer will override
            width={'100%'} // Use full container width
            itemCount={filteredCredentials.length}
            itemSize={getItemSize}
            className="custom-scrollbar w-full"
        >
            {({ index, style }: any) => {
                const cred = filteredCredentials[index];
                return (
                    <div style={style} className="px-4 py-1" onMouseDown={(e) => e.stopPropagation()}>
                        <div
                            className={`bg-white dark:bg-slate-900 border rounded-xl transition-all h-full flex flex-col overflow-hidden border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/50 shadow-sm`}
                        >
                            <div className="flex items-center justify-between p-4 flex-shrink-0">
                                <div className="flex items-center space-x-4 min-w-0 flex-1">
                                    {!isTrashMode && (
                                        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(cred.id); }} className={`p-1 rounded-full ${cred.isFavorite ? 'text-yellow-500' : 'text-slate-300 hover:text-yellow-500'}`}>
                                            <Star className={`w-4 h-4 ${cred.isFavorite ? 'fill-current' : ''}`} />
                                        </button>
                                    )}
                                    <div className={`w-10 h-10 relative overflow-hidden rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm border
                          ${cred.type === 'CARD' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' :
                                            cred.type === 'NOTE' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400' :
                                                cred.type === 'DOCUMENT' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400' :
                                                    'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400'} 
                          `}
                                        style={cred.type === 'LOGIN' || !cred.type ? { backgroundImage: `url('${faviconCache.get(cred.id) || ''}')`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : {}}>
                                        {cred.type === 'CARD' ? <CreditCard className="w-5 h-5" /> :
                                            cred.type === 'NOTE' ? <StickyNote className="w-5 h-5" /> :
                                                cred.type === 'DOCUMENT' ? <FileText className="w-5 h-5" /> :
                                                    <span className="relative z-10">{cred.siteName.charAt(0).toUpperCase()}</span>}
                                    </div>
                                    <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate select-text cursor-text" onMouseDown={(e) => e.stopPropagation()}>{cred.siteName}</h3>
                                        <div className="flex flex-col">
                                            <p className="text-slate-500 dark:text-slate-500 text-sm truncate font-mono hidden md:block select-text cursor-text" onMouseDown={(e) => e.stopPropagation()}>
                                                {cred.type === 'CARD' ? `**** ${cred.cardNumber?.slice(-4) || '****'}` : cred.type === 'NOTE' ? t.tabNote : cred.type === 'DOCUMENT' ? t.documents : cred.username}
                                            </p>
                                        </div>
                                        {!isMiniMode && (
                                            <div className="hidden md:flex justify-end">
                                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-medium uppercase">{cred.category}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-1 ml-4 pointer-events-auto">
                                    {!isTrashMode ? (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); onCopy(cred.type === 'CARD' ? (cred.cardNumber || '') : cred.type === 'NOTE' ? (cred.notes || '') : (cred.passwordValue || '')); onTouch(cred.id); }} className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><Copy className="w-4 h-4" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); setViewPasswordModal(cred.id); }} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                                            {!isMiniMode && cred.type === 'LOGIN' && (
                                                <button onClick={(e) => { e.stopPropagation(); handleAnalyze(cred.id, cred.passwordValue || ''); }} className="p-2 text-slate-400 hover:text-purple-500 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                                    {analyzingId === cred.id ? <span className="block w-4 h-4 border border-purple-500 border-t-transparent rounded-full animate-spin"></span> : <Sparkles className="w-4 h-4" />}
                                                </button>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); openEditModal(cred); }} className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); onDelete(cred.id); }} className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); onRestore(cred.id); }} className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"><RotateCcw className="w-4 h-4" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); onPermanentDelete(cred.id); }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><X className="w-4 h-4" /></button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }}
        </VariableList>
    );
};

export default VaultList;

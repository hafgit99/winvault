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
    height: number;
    width: number;
}

const VaultList: React.FC<VaultListProps> = (props) => {
    const {
        filteredCredentials, onCopy, onTouch, setViewPasswordModal, handleAnalyze, analyzingId,
        openEditModal, onDelete, isTrashMode, onRestore, onPermanentDelete, onToggleFavorite,
        faviconCache, isMiniMode, lang, listRef, height, width
    } = props;

    const t = TRANSLATIONS[lang];

    const getItemSize = () => 92;

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const cred = filteredCredentials[index];
        
        const handleCopy = (e: React.MouseEvent) => {
            e.stopPropagation();
            const text = cred.type === 'CARD' ? (cred.cardNumber || '') : 
                         cred.type === 'NOTE' ? (cred.notes || '') : 
                         (cred.passwordValue || '');
            onCopy(text);
            onTouch(cred.id);
        };

        const handleView = (e: React.MouseEvent) => {
            e.stopPropagation();
            setViewPasswordModal(cred.id);
        };

        const handleEdit = (e: React.MouseEvent) => {
            e.stopPropagation();
            openEditModal(cred);
        };

        const handleDelete = (e: React.MouseEvent) => {
            e.stopPropagation();
            onDelete(cred.id);
        };

        const handleAnalyzeClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            handleAnalyze(cred.id, cred.passwordValue || '');
        };

        const handleFavorite = (e: React.MouseEvent) => {
            e.stopPropagation();
            onToggleFavorite(cred.id);
        };

        const handleRestore = (e: React.MouseEvent) => {
            e.stopPropagation();
            onRestore(cred.id);
        };

        const handlePermanentDelete = (e: React.MouseEvent) => {
            e.stopPropagation();
            onPermanentDelete(cred.id);
        };

        return (
            <div style={style} className="px-4 py-1">
                <div className="bg-white dark:bg-slate-900 border rounded-xl transition-all overflow-hidden border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/50 shadow-sm">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                            {!isTrashMode && (
                                <button
                                    onClick={handleFavorite}
                                    className={`p-1 rounded-full cursor-pointer ${cred.isFavorite ? 'text-yellow-500' : 'text-slate-300 hover:text-yellow-500'}`}
                                    type="button"
                                >
                                    <Star className={`w-4 h-4 pointer-events-none ${cred.isFavorite ? 'fill-current' : ''}`} />
                                </button>
                            )}
                            <div className={`w-10 h-10 relative overflow-hidden rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm border
                  ${cred.type === 'CARD' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' :
                                cred.type === 'NOTE' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400' :
                                    cred.type === 'DOCUMENT' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400' :
                                        'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400'} 
                  `}
                                style={cred.type === 'LOGIN' || !cred.type ? { backgroundImage: `url('${faviconCache.get(cred.id) || ''}')`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : {}}>
                                {cred.type === 'CARD' ? <CreditCard className="w-5 h-5 pointer-events-none" /> :
                                    cred.type === 'NOTE' ? <StickyNote className="w-5 h-5 pointer-events-none" /> :
                                        cred.type === 'DOCUMENT' ? <FileText className="w-5 h-5 pointer-events-none" /> :
                                            <span className="relative z-10 pointer-events-none">{cred.siteName.charAt(0).toUpperCase()}</span>}
                            </div>
                            <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate select-text cursor-text">{cred.siteName}</h3>
                                <div className="flex flex-col">
                                    <p className="text-slate-500 dark:text-slate-500 text-sm truncate font-mono hidden md:block select-text cursor-text">
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

                        <div className="flex items-center space-x-1 ml-4">
                            {!isTrashMode ? (
                                <>
                                    <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" type="button"><Copy className="w-4 h-4 pointer-events-none" /></button>
                                    <button onClick={handleView} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" type="button"><Eye className="w-4 h-4 pointer-events-none" /></button>
                                    {!isMiniMode && cred.type === 'LOGIN' && (
                                        <button onClick={handleAnalyzeClick} className="p-2 text-slate-400 hover:text-purple-500 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" type="button">
                                            {analyzingId === cred.id ? <span className="block w-4 h-4 border border-purple-500 border-t-transparent rounded-full animate-spin pointer-events-none"></span> : <Sparkles className="w-4 h-4 pointer-events-none" />}
                                        </button>
                                    )}
                                    <button onClick={handleEdit} className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" type="button"><Pencil className="w-4 h-4 pointer-events-none" /></button>
                                    <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer" type="button"><Trash2 className="w-4 h-4 pointer-events-none" /></button>
                                </>
                            ) : (
                                <>
                                    <button onClick={handleRestore} className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg cursor-pointer" type="button"><RotateCcw className="w-4 h-4 pointer-events-none" /></button>
                                    <button onClick={handlePermanentDelete} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer" type="button"><X className="w-4 h-4 pointer-events-none" /></button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <VariableList
            ref={listRef}
            height={height}
            width={width}
            itemCount={filteredCredentials.length}
            itemSize={getItemSize}
            itemKey={(index: number) => filteredCredentials[index].id}
            className="custom-scrollbar w-full"
        >
            {Row}
        </VariableList>
    );
};

export default VaultList;
import React from 'react';
import { Search, List, LayoutGrid, Maximize2, Minimize2, Trash2, Plus, Star, Clock, FileText, Check, X } from 'lucide-react';
import { Category, Language } from '../../types';
import { TRANSLATIONS } from '../../utils';

interface VaultHeaderProps {
    mode: 'VAULT' | 'DOCUMENTS';
    isTrashMode: boolean;
    isMiniMode: boolean;
    filterMode: 'ALL' | 'FAV' | 'RECENT';
    setFilterMode: (mode: 'ALL' | 'FAV' | 'RECENT') => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    viewMode: 'list' | 'grid';
    setViewMode: (mode: 'list' | 'grid') => void;
    onToggleMiniMode: () => void;
    setIsTrashMode: (isTrash: boolean) => void;
    openAddModal: () => void;
    selectedCategory: string;
    setSelectedCategory: (catId: string) => void;
    categories: Category[];
    onDeleteCategory: (id: string) => void;
    isAddCatOpen: boolean;
    setIsAddCatOpen: (isOpen: boolean) => void;
    newCatName: string;
    setNewCatName: (name: string) => void;
    handleAddCatSubmit: (e: React.FormEvent) => void;
    lang: Language;
}

const VaultHeader: React.FC<VaultHeaderProps> = ({
    mode, isTrashMode, isMiniMode, filterMode, setFilterMode,
    searchTerm, setSearchTerm, viewMode, setViewMode,
    onToggleMiniMode, setIsTrashMode, openAddModal,
    selectedCategory, setSelectedCategory, categories, onDeleteCategory,
    isAddCatOpen, setIsAddCatOpen, newCatName, setNewCatName, handleAddCatSubmit,
    lang
}) => {
    const t = TRANSLATIONS[lang];

    return (
        <>
            {mode === 'DOCUMENTS' && (
                <div className="px-6 pt-6 pb-2 animate-fade-in">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        {t.docVault}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t.docVaultDesc}</p>
                </div>
            )}
            <div className={`px-6 py-4 border-b border-slate-200 dark:border-slate-800 transition-colors sticky top-0 z-10 backdrop-blur-md bg-opacity-90 ${isTrashMode ? 'bg-red-50/90 dark:bg-red-950/90' : 'bg-slate-50/90 dark:bg-slate-950/90'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {!isTrashMode && !isMiniMode && (
                        <div className="flex space-x-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                            <button onClick={() => setFilterMode('ALL')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterMode === 'ALL' ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>{t.all}</button>
                            <button onClick={() => setFilterMode('FAV')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${filterMode === 'FAV' ? 'bg-white dark:bg-slate-950 text-yellow-600 dark:text-yellow-500 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Star className="w-3 h-3 fill-current" /> {t.favorites}</button>
                            <button onClick={() => setFilterMode('RECENT')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${filterMode === 'RECENT' ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Clock className="w-3 h-3" /> {t.recents}</button>
                        </div>
                    )}

                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm select-text cursor-text"
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        {!isMiniMode && (
                            <div className="flex bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-1">
                                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} aria-label="List View"><List className="w-4 h-4" /></button>
                                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} aria-label="Grid View"><LayoutGrid className="w-4 h-4" /></button>
                            </div>
                        )}

                        <button
                            onClick={onToggleMiniMode}
                            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-800`}
                            title={isMiniMode ? t.normalMode : t.miniMode}
                            aria-label={isMiniMode ? t.normalMode : t.miniMode}
                        >
                            {isMiniMode ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
                        </button>

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>

                        <button
                            onClick={() => setIsTrashMode(!isTrashMode)}
                            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${isTrashMode ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 ring-2 ring-red-500/20' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 border border-slate-200 dark:border-slate-800'}`}
                            title={t.recycleBin}
                            aria-label={t.recycleBin}
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>

                        {!isTrashMode && (
                            <button
                                onClick={openAddModal}
                                className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20"
                                title={t.addAccount}
                                aria-label={t.addAccount}
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {!isTrashMode && !isMiniMode && (
                    <div className="flex items-center space-x-2 mt-4 overflow-x-auto pb-2 pt-3 pr-2 custom-scrollbar">
                        <button onClick={() => setSelectedCategory('ALL')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${selectedCategory === 'ALL' ? 'bg-slate-800 text-white border-slate-700 dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-blue-500'}`}>{t.allCategories}</button>
                        {categories.map(cat => (
                            <div key={cat.id} className="group relative">
                                <button onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${selectedCategory === cat.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-blue-500'}`}>{cat.name}</button>
                                {!cat.isSystem && <button onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" aria-label="Delete Category"><X className="w-3 h-3" /></button>}
                            </div>
                        ))}

                        {isAddCatOpen ? (
                            <form onSubmit={handleAddCatSubmit} className="flex items-center space-x-1 animate-fade-in">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    onBlur={() => !newCatName.trim() && setIsAddCatOpen(false)}
                                    placeholder={t.categoryName}
                                    className="px-3 py-1.5 rounded-full text-xs border border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none w-32 select-text cursor-text"
                                    onMouseDown={(e) => e.stopPropagation()}
                                />
                                <button type="submit" className="bg-blue-600 text-white rounded-full p-1 hover:bg-blue-500" aria-label="Confirm Category"><Check className="w-3 h-3" /></button>
                                <button type="button" onClick={() => setIsAddCatOpen(false)} className="bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-full p-1 hover:bg-slate-300 dark:hover:bg-slate-600" aria-label="Cancel Category"><X className="w-3 h-3" /></button>
                            </form>
                        ) : (
                            <button onClick={() => setIsAddCatOpen(true)} className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-blue-500 hover:border-blue-500 flex items-center" aria-label={t.addCategory}><Plus className="w-3 h-3 mr-1" /> {t.addCategory}</button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default VaultHeader;

import React from 'react';
import { Star, CreditCard, StickyNote, FileText, Pencil, Trash2, Eye, RotateCcw, X, Wallet } from 'lucide-react';
import { Credential, Language } from '../../types';
import { TRANSLATIONS } from '../../utils';

interface VaultGridProps {
    filteredCredentials: Credential[];
    onToggleFavorite: (id: string) => void;
    openEditModal: (cred: Credential) => void;
    onDelete: (id: string) => void;
    isTrashMode: boolean;
    onRestore: (id: string) => void;
    onPermanentDelete: (id: string) => void;
    faviconCache: Map<string, string>;
    lang: Language;
    width: number;
    height: number;
    onView?: (id: string) => void;
}

// Premium renk paleti - her kategori için benzersiz gradient
const CATEGORY_COLORS: Record<string, { gradient: string; accent: string; glow: string }> = {
    'General': {
        gradient: 'from-slate-600 to-slate-800',
        accent: '#64748b',
        glow: 'rgba(100, 116, 139, 0.3)'
    },
    'Social': {
        gradient: 'from-pink-500 to-rose-600',
        accent: '#ec4899',
        glow: 'rgba(236, 72, 153, 0.3)'
    },
    'Banking': {
        gradient: 'from-emerald-500 to-teal-600',
        accent: '#10b981',
        glow: 'rgba(16, 185, 129, 0.3)'
    },
    'Work': {
        gradient: 'from-blue-500 to-indigo-600',
        accent: '#3b82f6',
        glow: 'rgba(59, 130, 246, 0.3)'
    },
    'Shopping': {
        gradient: 'from-orange-500 to-amber-600',
        accent: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.3)'
    },
    'Entertainment': {
        gradient: 'from-purple-500 to-violet-600',
        accent: '#8b5cf6',
        glow: 'rgba(139, 92, 246, 0.3)'
    },
    'Health': {
        gradient: 'from-red-500 to-rose-600',
        accent: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.3)'
    },
    'Travel': {
        gradient: 'from-cyan-500 to-sky-600',
        accent: '#06b6d4',
        glow: 'rgba(6, 182, 212, 0.3)'
    },
    'Education': {
        gradient: 'from-yellow-500 to-orange-500',
        accent: '#eab308',
        glow: 'rgba(234, 179, 8, 0.3)'
    },
    'Gaming': {
        gradient: 'from-fuchsia-500 to-pink-600',
        accent: '#d946ef',
        glow: 'rgba(217, 70, 239, 0.3)'
    }
};

// Dinamik kategoriler için hash bazlı renk üreteci
const DYNAMIC_GRADIENTS = [
    { gradient: 'from-lime-500 to-green-600', accent: '#84cc16', glow: 'rgba(132, 204, 22, 0.3)' },
    { gradient: 'from-rose-400 to-pink-500', accent: '#fb7185', glow: 'rgba(251, 113, 133, 0.3)' },
    { gradient: 'from-sky-400 to-blue-500', accent: '#38bdf8', glow: 'rgba(56, 189, 248, 0.3)' },
    { gradient: 'from-violet-400 to-purple-500', accent: '#a78bfa', glow: 'rgba(167, 139, 250, 0.3)' },
    { gradient: 'from-amber-400 to-yellow-500', accent: '#fbbf24', glow: 'rgba(251, 191, 36, 0.3)' },
    { gradient: 'from-teal-400 to-cyan-500', accent: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.3)' },
    { gradient: 'from-indigo-400 to-blue-500', accent: '#818cf8', glow: 'rgba(129, 140, 248, 0.3)' },
    { gradient: 'from-red-400 to-orange-500', accent: '#f87171', glow: 'rgba(248, 113, 113, 0.3)' },
];

// Kategori adından hash ile tutarlı renk üret
const getCategoryColor = (category: string) => {
    if (CATEGORY_COLORS[category]) {
        return CATEGORY_COLORS[category];
    }
    // Dinamik kategoriler için hash hesapla
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % DYNAMIC_GRADIENTS.length;
    return DYNAMIC_GRADIENTS[index];
};

// Tip bazlı ikon renkleri
const TYPE_COLORS = {
    'CARD': { gradient: 'from-amber-400 to-yellow-500', icon: 'text-amber-100' },
    'NOTE': { gradient: 'from-amber-500 to-orange-500', icon: 'text-amber-100' },
    'DOCUMENT': { gradient: 'from-indigo-400 to-purple-500', icon: 'text-indigo-100' },
    'CRYPTO': { gradient: 'from-orange-400 to-amber-500', icon: 'text-orange-100' },
};

const CardIcon: React.FC<{
    cred: Credential;
    faviconUrl: string | undefined;
    colorTheme: { gradient: string; accent: string };
}> = React.memo(({ cred, faviconUrl, colorTheme }) => {
    const [imgError, setImgError] = React.useState(false);
    const [imgLoaded, setImgLoaded] = React.useState(false);

    React.useEffect(() => {
        setImgError(false);
        setImgLoaded(false);
    }, [faviconUrl]);

    // Premium Titanium Icon Style
    const iconBaseClass = "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 relative overflow-hidden group-hover:scale-105";
    const glassEffect = "backdrop-blur-md bg-white/5 border border-white/10 shadow-[inner_0_0_10px_rgba(255,255,255,0.05)]";

    const renderIconContent = () => {
        if (cred.type === 'CARD') {
            return <CreditCard className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />;
        }
        if (cred.type === 'NOTE') {
            return <StickyNote className="w-5 h-5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />;
        }
        if (cred.type === 'DOCUMENT') {
            return <FileText className="w-5 h-5 text-indigo-400 drop-shadow-[0_0_5px_rgba(129,140,248,0.5)]" />;
        }
        if (cred.category === 'Crypto' || cred.siteName.toLowerCase().includes('crypto') || cred.siteName.toLowerCase().includes('wallet')) {
            return <Wallet className="w-5 h-5 text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.5)]" />;
        }

        const firstChar = cred.siteName ? cred.siteName.charAt(0).toUpperCase() : '?';

        if (!faviconUrl || imgError) {
            return <span className="text-lg font-bold text-slate-300 font-mono">{firstChar}</span>;
        }

        return (
            <>
                {!imgLoaded && <span className="text-lg font-bold text-slate-300 font-mono absolute">{firstChar}</span>}
                <img
                    src={faviconUrl}
                    alt=""
                    className={`w-6 h-6 object-contain transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onError={() => setImgError(true)}
                    onLoad={() => setImgLoaded(true)}
                    loading="lazy"
                    draggable={false}
                />
            </>
        );
    };

    return (
        <div className={`${iconBaseClass} ${glassEffect}`}>
            {/* Glossy reflection */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            {renderIconContent()}
        </div>
    );
});

const VaultCard: React.FC<{
    cred: Credential;
    t: any;
    isTrashMode: boolean;
    faviconCache: Map<string, string>;
    onToggleFavorite: (id: string) => void;
    openEditModal: (cred: Credential) => void;
    onDelete: (id: string) => void;
    onRestore: (id: string) => void;
    onPermanentDelete: (id: string) => void;
    onView?: (id: string) => void;
}> = React.memo(({
    cred, t, isTrashMode, faviconCache, onToggleFavorite,
    openEditModal, onDelete, onRestore, onPermanentDelete, onView
}) => {
    const faviconUrl = faviconCache.get(cred.id);
    const colorTheme = getCategoryColor(cred.category);

    return (
        <div className="vault-card group relative h-44 w-full overflow-hidden rounded-[1.25rem] bg-[#0A0C10] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,10,20,0.8),0_0_20px_rgba(6,182,212,0.15)] border border-slate-800/60 hover:border-cyan-500/40">
            {/* Background Texture & Gradients */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-[#0B0F14] to-black opacity-100" />

            {/* Corner Accent Glow */}
            <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-[40px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 bg-cyan-500`} />

            <div className="relative h-full p-5 flex flex-col z-10">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <CardIcon cred={cred} faviconUrl={faviconUrl} colorTheme={colorTheme} />
                        <div className="min-w-0 flex-1">
                            <h3 className="font-semibold truncate text-slate-100 text-[0.95rem] tracking-tight group-hover:text-white transition-colors">
                                {cred.siteName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-slate-800/80 text-slate-400 group-hover:text-cyan-400/80 group-hover:bg-cyan-950/20 transition-all`}>
                                    {cred.category}
                                </span>
                            </div>
                        </div>
                    </div>
                    {!isTrashMode && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(cred.id); }}
                            className="p-2 rounded-xl transition-all duration-300 hover:bg-white/5 active:scale-90"
                        >
                            <Star className={`w-4 h-4 transition-all duration-500 ${cred.isFavorite
                                ? 'fill-cyan-400 text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]'
                                : 'text-slate-700 group-hover:text-slate-500'
                                }`} />
                        </button>
                    )}
                </div>

                {/* Data Slots */}
                <div className="flex-1 space-y-4">
                    {cred.type === 'CARD' ? (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] block transition-colors group-hover:text-slate-400">
                                {t.cardNumber}
                            </label>
                            <div className="font-mono text-[11px] text-slate-200 backdrop-blur-[6px] bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 transition-all duration-500 hover:bg-white/10 group-hover:border-cyan-500/10">
                                <span className="blur-[5px] group-hover:blur-none transition-all duration-700">
                                    •••• •••• •••• <span className="text-cyan-400 font-bold">{cred.cardNumber?.slice(-4) || '••••'}</span>
                                </span>
                            </div>
                        </div>
                    ) : cred.type === 'NOTE' ? (
                        <div className="space-y-1 h-full">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] block transition-colors group-hover:text-slate-400">
                                {t.notes}
                            </label>
                            <div className="h-12 overflow-hidden font-mono text-[10px] text-slate-300 backdrop-blur-[6px] bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 transition-all duration-500 hover:bg-white/10 group-hover:border-cyan-500/10">
                                <p className="line-clamp-2 blur-[5px] group-hover:blur-none transition-all duration-700">
                                    {cred.notes || t.noContent}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* User Field */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] block transition-colors group-hover:text-slate-400">
                                    {t.username}
                                </label>
                                <div className="font-mono text-[11px] text-slate-200 truncate backdrop-blur-[6px] bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 transition-all duration-500 hover:bg-white/10 group-hover:border-cyan-500/10">
                                    <span className="blur-[5px] group-hover:blur-none transition-all duration-700">
                                        {cred.username || '---'}
                                    </span>
                                </div>
                            </div>

                            {/* Pass Field */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] block transition-colors group-hover:text-slate-400">
                                    {t.password}
                                </label>
                                <div className="flex items-center justify-between font-mono text-[11px] text-cyan-500/40 backdrop-blur-[6px] bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 transition-all duration-500 hover:bg-white/10 group-hover:border-cyan-500/10">
                                    <span className="tracking-[0.3em] font-sans text-xs group-hover:blur-none blur-[4px] transition-all duration-700">
                                        •••••••••
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Modern Hover Actions Bar */}
                <div className="absolute inset-x-0 bottom-0 py-3 px-5 bg-gradient-to-t from-black/95 via-[#0A0C10]/95 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex justify-end items-center gap-3 backdrop-blur-sm">
                    {!isTrashMode ? (
                        <>
                            <button onClick={() => onView?.(cred.id)} className="p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-600 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition-all shadow-xl active:scale-95" title={t.view}>
                                <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => openEditModal(cred)} className="p-2 rounded-lg bg-slate-800/80 hover:bg-blue-600 border border-slate-700 hover:border-blue-400 text-slate-300 hover:text-white transition-all shadow-xl active:scale-95" title={t.editAccount}>
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => onDelete(cred.id)} className="p-2 rounded-lg bg-slate-800/80 hover:bg-red-600 border border-slate-700 hover:border-red-400 text-slate-300 hover:text-white transition-all shadow-xl active:scale-95" title={t.delete}>
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => onRestore(cred.id)} className="p-2 rounded-lg bg-slate-800/80 hover:bg-emerald-600 border border-slate-700 hover:border-emerald-400 text-emerald-400 hover:text-white transition-all shadow-xl active:scale-95">
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button onClick={() => onPermanentDelete(cred.id)} className="p-2 rounded-lg bg-slate-800/80 hover:bg-red-600 border border-slate-700 hover:border-red-400 text-red-400 hover:text-white transition-all shadow-xl active:scale-95">
                                <X className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});

const VaultGrid: React.FC<VaultGridProps> = ({
    filteredCredentials, onToggleFavorite, openEditModal, onDelete,
    isTrashMode, onRestore, onPermanentDelete, faviconCache, lang, onView
}) => {
    const t = TRANSLATIONS[lang];

    return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar vault-container">
            <div className="desktop-grid">
                {filteredCredentials.map((cred) => (
                    <VaultCard
                        key={cred.id}
                        cred={cred}
                        t={t}
                        isTrashMode={isTrashMode}
                        faviconCache={faviconCache}
                        onToggleFavorite={onToggleFavorite}
                        openEditModal={openEditModal}
                        onDelete={onDelete}
                        onRestore={onRestore}
                        onPermanentDelete={onPermanentDelete}
                        onView={onView}
                    />
                ))}
            </div>
        </div>
    );
};

export default VaultGrid;
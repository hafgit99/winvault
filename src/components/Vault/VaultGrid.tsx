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
        <div className="group relative h-40 w-full overflow-hidden rounded-2xl bg-[#0b0d11] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(6,182,212,0.3)] border border-slate-800/60 hover:border-cyan-500/50">
            {/* Background Texture - Brushed Metal Effect */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0f1115] to-black opacity-90" />

            {/* Neon Lines (Top & Bottom) */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

            {/* Cinematic Side Glow */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-0 group-hover:h-3/4 bg-cyan-500/50 blur-[2px] transition-all duration-500" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-0 group-hover:h-3/4 bg-cyan-500/50 blur-[2px] transition-all duration-500" />

            <div className="relative h-full p-4 flex flex-col z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <CardIcon cred={cred} faviconUrl={faviconUrl} colorTheme={colorTheme} />
                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold truncate text-slate-200 text-sm tracking-wide group-hover:text-cyan-400 transition-colors">
                                {cred.siteName}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                    {cred.category}
                                </span>
                                {cred.type === 'CARD' && <span className="w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]" />}
                                {cred.type === 'NOTE' && <span className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" />}
                            </div>
                        </div>
                    </div>
                    {!isTrashMode && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(cred.id); }}
                            className="p-1.5 rounded-lg transition-all duration-200 hover:bg-slate-800"
                        >
                            <Star className={`w-3.5 h-3.5 transition-all ${cred.isFavorite
                                ? 'fill-cyan-400 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                                : 'text-slate-600 group-hover:text-slate-400'
                                }`} />
                        </button>
                    )}
                </div>

                {/* Content Area - Futuristic Data Display - BLURRED */}
                <div className="flex-1 min-h-0 relative">
                    {/* Tech Separator Line */}
                    <div className="w-full h-[1px] bg-slate-800/50 mb-3 group-hover:bg-cyan-900/30 transition-colors" />

                    {cred.type === 'CARD' ? (
                        <div className="space-y-1">
                            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest opacity-60">Card Number</p>
                            <p className="font-mono text-xs text-slate-300 tracking-wider blur-[4px] select-none hover:blur-[2px] transition-all duration-500">
                                •••• •••• •••• <span className="text-cyan-400 font-bold">{cred.cardNumber?.slice(-4) || '••••'}</span>
                            </p>
                        </div>
                    ) : cred.type === 'NOTE' ? (
                        <div className="h-full">
                            <p className="text-[10px] text-slate-500 leading-relaxed font-mono line-clamp-2 mix-blend-plus-lighter blur-[4px] select-none hover:blur-[2px] transition-all duration-500">
                                {cred.notes ? cred.notes.substring(0, 100) : t.noContent}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center group/field">
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold group-hover/field:text-cyan-500/70 transition-colors">{t.username}</span>
                                <span className="font-mono text-[10px] text-slate-300 truncate max-w-[120px] blur-[4px] select-none hover:blur-[2px] transition-all duration-500">{cred.username || '---'}</span>
                            </div>
                            <div className="flex justify-between items-center group/field">
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold group-hover/field:text-cyan-500/70 transition-colors">{t.password}</span>
                                <span className="font-mono text-[10px] text-cyan-500/60 tracking-[0.2em] group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_3px_rgba(34,211,238,0.5)] transition-all blur-[4px] select-none hover:blur-[2px] duration-500">•••••••</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions - Slide up on Hover */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-end gap-2 z-20">
                    {!isTrashMode ? (
                        <>
                            <button onClick={() => onView?.(cred.id)} className="p-1.5 rounded-md bg-slate-800 hover:bg-cyan-900 border border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/20" title={t.view}>
                                <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => openEditModal(cred)} className="p-1.5 rounded-md bg-slate-800 hover:bg-amber-900/40 border border-slate-700 hover:border-amber-500/50 text-slate-400 hover:text-amber-400 transition-all shadow-lg hover:shadow-amber-500/20" title={t.editAccount}>
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onDelete(cred.id)} className="p-1.5 rounded-md bg-slate-800 hover:bg-red-900/40 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 transition-all shadow-lg hover:shadow-red-500/20" title={t.delete}>
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => onRestore(cred.id)} className="p-1.5 rounded-md bg-slate-800 hover:bg-emerald-900/40 border border-slate-700 hover:border-emerald-500/50 text-emerald-500 transition-all">
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onPermanentDelete(cred.id)} className="p-1.5 rounded-md bg-slate-800 hover:bg-red-900/40 border border-slate-700 hover:border-red-500/50 text-red-500 transition-all">
                                <X className="w-3.5 h-3.5" />
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
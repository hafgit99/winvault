import React, { useMemo } from 'react';
import { ShieldCheck, Folder, AlertTriangle, CheckCircle } from 'lucide-react';
import { Credential, Language } from '../../types';
import { TRANSLATIONS } from '../../utils';

interface VaultStatsProps {
    credentials: Credential[];
    lang: Language;
}

const VaultStats: React.FC<VaultStatsProps> = ({ credentials, lang }) => {
    const t = TRANSLATIONS[lang];

    const stats = useMemo(() => {
        const activeCreds = credentials.filter(c => !c.deletedAt);
        const total = activeCreds.length;
        const logins = activeCreds.filter(c => c.type === 'LOGIN' || !c.type);
        const weak = logins.filter(c => (c.passwordValue?.length || 0) < 8).length;
        let totalScore = 0;
        logins.forEach(c => {
            const len = c.passwordValue?.length || 0;
            if (len >= 16) totalScore += 100;
            else if (len >= 12) totalScore += 80;
            else if (len >= 8) totalScore += 50;
            else totalScore += 20;
        });
        const avgScore = logins.length > 0 ? Math.round(totalScore / logins.length) : 100;
        return { total, weak, avgScore };
    }, [credentials]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Score Card */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group">
                <div className="flex justify-between items-start relative z-10">
                    <div><p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">{t.securityScore}</p><h3 className="text-3xl font-bold">{stats.avgScore}/100</h3></div>
                    <div className="p-2 bg-white/20 rounded-lg"><ShieldCheck className="w-6 h-6 text-white" /></div>
                </div>
                <div className="w-full bg-black/20 h-1.5 rounded-full mt-4"><div className="bg-white h-full rounded-full" style={{ width: `${stats.avgScore}%` }}></div></div>
            </div>
            {/* Total Items */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-start">
                    <div><p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{t.totalItems}</p><h3 className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total}</h3></div>
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg"><Folder className="w-6 h-6" /></div>
                </div>
            </div>
            {/* Weak Passwords */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-start">
                    <div><p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{t.weakPasswords}</p><h3 className={`text-3xl font-bold ${stats.weak > 0 ? 'text-red-500' : 'text-green-500'}`}>{stats.weak}</h3></div>
                    <div className={`p-2 rounded-lg ${stats.weak > 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'bg-green-100 dark:bg-green-900/30 text-green-500'}`}>{stats.weak > 0 ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}</div>
                </div>
            </div>
        </div>
    );
};

export default VaultStats;

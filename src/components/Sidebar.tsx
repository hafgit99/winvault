import React from 'react';
import { Shield, Key, Settings, Lock, Sun, Moon, Crown, Monitor, FileText } from 'lucide-react';
import { AppView } from '../types';
import { TRANSLATIONS } from '../utils';
import { useAppStore } from '../store/useAppStore';

interface SidebarProps {
  onLock: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLock }) => {
  const { currentView, setCurrentView, lang, theme, setTheme, isPro } = useAppStore();
  const t = TRANSLATIONS[lang];

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'amoled' : 'light');
  };

  const menuItems = [
    { id: AppView.VAULT, label: t.vault, icon: Shield },
    { id: AppView.DOCUMENTS, label: t.documents, icon: FileText },
    { id: AppView.GENERATOR, label: t.generator, icon: Key },
    { id: AppView.SETTINGS, label: t.settings, icon: Settings },
  ];

  return (
    <div className="w-24 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-6 h-full flex-shrink-0 z-20 shadow-xl transition-colors">
      <div className="mb-8 bg-blue-50 dark:bg-blue-600/20 p-3 rounded-2xl">
        <Shield className="w-8 h-8 text-blue-600 dark:text-blue-500" />
      </div>

      <nav className="flex-1 space-y-6 w-full px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex flex-col items-center justify-center py-4 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30 dark:shadow-blue-900/50'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              title={item.label}
              aria-label={item.label}
            >
              <Icon className={`w-7 h-7 mb-1.5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
              <span className="text-xs font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="w-full px-3 mt-auto mb-4 space-y-4 flex flex-col items-center">
        {isPro && (
          <div className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md flex items-center gap-1 border border-yellow-400/50 mb-2 w-full justify-center">
            <Crown className="w-3 h-3" /> PRO
          </div>
        )}

        <button
          onClick={toggleTheme}
          className="w-full flex flex-col items-center justify-center py-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'light' ? t.darkMode : theme === 'dark' ? (lang === 'tr' ? 'OLED Modu' : 'OLED Mode') : t.lightMode}
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="w-6 h-6 text-slate-700" /> :
            theme === 'dark' ? <Monitor className="w-6 h-6 text-blue-500" /> :
              <Sun className="w-6 h-6 text-yellow-500" />}
        </button>

        <button
          onClick={onLock}
          className="w-full flex flex-col items-center justify-center py-4 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
          title={t.lock}
          aria-label={t.lock}
        >
          <Lock className="w-7 h-7 mb-1.5" />
          <span className="text-xs font-semibold">{t.lock}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

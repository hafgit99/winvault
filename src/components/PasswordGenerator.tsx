import React, { useState, useEffect, useCallback } from 'react';
import { Copy, RefreshCw, Wand2 } from 'lucide-react';
import { GeneratorSettings } from '../types';
import { generatePasswordFromSettings, TRANSLATIONS } from '../utils';
import { useAppStore } from '../store/useAppStore';

interface PasswordGeneratorProps {
  onCopy: (text: string) => void;
}

const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ onCopy }) => {
  const { genSettings, setGenSettings, lang } = useAppStore();
  const [password, setPassword] = useState('');

  const t = TRANSLATIONS[lang];

  const generatePassword = useCallback(() => {
    setPassword(generatePasswordFromSettings(genSettings));
  }, [genSettings]);

  // Generate when settings change or on mount
  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  const updateSetting = (key: keyof GeneratorSettings, value: any) => {
    setGenSettings({
      ...genSettings,
      [key]: value
    });
  };

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto animate-fade-in overflow-y-auto h-full custom-scrollbar">
      <div className="mb-6 md:mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-3">{t.genTitle}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg">{t.genDesc}</p>
      </div>

      <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 md:p-10 mb-8 md:mb-10 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative mb-6 md:mb-8">
          <textarea
            readOnly
            value={password}
            rows={3}
            className="w-full bg-slate-50 dark:bg-slate-900/50 text-xl md:text-3xl font-mono text-center py-6 md:py-8 px-4 md:px-12 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 text-blue-600 dark:text-blue-400 tracking-wider resize-none"
          />
          <div className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 flex space-x-2">
            <button
              onClick={generatePassword}
              className="p-2 md:p-4 text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              title={t.refresh}
            >
              <RefreshCw className="w-5 h-5 md:w-7 md:h-7" />
            </button>
            <button
              onClick={() => onCopy(password)}
              className="p-2 md:p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg transition-colors"
              title={t.copy}
            >
              <Copy className="w-5 h-5 md:w-7 md:h-7" />
            </button>
          </div>
        </div>

        <div className="flex space-x-2 md:space-x-4 mb-6">
          <button
            onClick={() => updateSetting('mode', 'random')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm md:text-base transition-all ${genSettings.mode === 'random'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
          >
            {t.modeRandom}
          </button>
          <button
            onClick={() => updateSetting('mode', 'memorable')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm md:text-base transition-all ${genSettings.mode === 'memorable'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
          >
            {t.modeMemorable}
          </button>
        </div>

        {genSettings.mode === 'random' ? (
          <div className="space-y-6 md:space-y-8">
            <div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-3">
                <span className="text-sm md:text-base font-medium">{t.length}</span>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-sm md:text-base">{genSettings.length}</span>
              </div>
              <input
                type="range"
                min="8"
                max="128"
                value={genSettings.length}
                onChange={(e) => updateSetting('length', parseInt(e.target.value))}
                className="w-full h-2 md:h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <label className="flex items-center space-x-4 p-4 md:p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-400 dark:hover:border-slate-500 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={genSettings.includeUppercase}
                  onChange={(e) => updateSetting('includeUppercase', e.target.checked)}
                  className="w-5 h-5 md:w-6 md:h-6 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-slate-900 bg-white dark:bg-slate-700"
                />
                <span className="text-slate-700 dark:text-slate-200 text-sm md:text-base">{t.uppercase}</span>
              </label>

              <label className="flex items-center space-x-4 p-4 md:p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-400 dark:hover:border-slate-500 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={genSettings.includeNumbers}
                  onChange={(e) => updateSetting('includeNumbers', e.target.checked)}
                  className="w-5 h-5 md:w-6 md:h-6 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-slate-900 bg-white dark:bg-slate-700"
                />
                <span className="text-slate-700 dark:text-slate-200 text-sm md:text-base">{t.numbers}</span>
              </label>

              <label className="flex items-center space-x-4 p-4 md:p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-400 dark:hover:border-slate-500 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={genSettings.includeSymbols}
                  onChange={(e) => updateSetting('includeSymbols', e.target.checked)}
                  className="w-5 h-5 md:w-6 md:h-6 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-slate-900 bg-white dark:bg-slate-700"
                />
                <span className="text-slate-700 dark:text-slate-200 text-sm md:text-base">{t.symbols}</span>
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8">
            <div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-3">
                <span className="text-sm md:text-base font-medium">{t.wordCount}</span>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-sm md:text-base">{genSettings.wordCount || 3}</span>
              </div>
              <input
                type="range"
                min="3"
                max="10"
                value={genSettings.wordCount || 3}
                onChange={(e) => updateSetting('wordCount', parseInt(e.target.value))}
                className="w-full h-2 md:h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 cursor-pointer">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.capitalize}</span>
                <input
                  type="checkbox"
                  checked={genSettings.capitalize !== false}
                  onChange={(e) => updateSetting('capitalize', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-500 mb-2 block uppercase">{t.separator}</span>
                <div className="flex gap-2">
                  {['-', '_', '.', ' '].map(sep => (
                    <button
                      key={sep}
                      onClick={() => updateSetting('separator', sep)}
                      className={`flex-1 h-8 rounded-lg font-mono font-bold border ${genSettings.separator === sep ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                    >
                      {sep === ' ' ? '␣' : sep}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start space-x-4 md:space-x-5 p-5 md:p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl text-blue-700 dark:text-blue-200 shadow-sm">
        <Wand2 className="w-6 h-6 md:w-8 md:h-8 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-base md:text-lg mb-1 md:mb-2">{t.tipTitle}</h4>
          <p className="text-sm md:text-base opacity-80 leading-relaxed">
            {t.tipDesc}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordGenerator;
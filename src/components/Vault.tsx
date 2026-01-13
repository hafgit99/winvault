import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { TOTP } from 'otpauth';
// @ts-ignore
import AutoSizer from 'react-virtualized-auto-sizer';

import {
  SecurityAnalysis,
} from '../types';

import {
  TRANSLATIONS,
} from '../utils';

import { analyzePasswordStrength } from '../services/geminiService';
import { useAppStore } from '../store/useAppStore';
import { useVaultStore } from '../store/useVaultStore';

// Sub-components
import VaultStats from './Vault/VaultStats';
import VaultHeader from './Vault/VaultHeader';
import VaultList from './Vault/VaultList';
import VaultGrid from './Vault/VaultGrid';
import AnalysisModal from './Vault/Modals/AnalysisModal';
import PasswordViewModal from './Vault/Modals/PasswordViewModal';
import AddEditModal from './Vault/Modals/AddEditModal';

interface VaultProps {
  onCopy: (text: string) => void;
  onTouch: (id: string) => void;
  highlightedId?: string | null;
  shouldOpenAddModal?: boolean;
  mode?: 'VAULT' | 'DOCUMENTS';
}

const Vault: React.FC<VaultProps> = ({
  onCopy, onTouch, highlightedId, shouldOpenAddModal, mode = 'VAULT'
}) => {
  const { lang, isMiniMode, setIsMiniMode, genSettings: generatorSettings } = useAppStore();
  const {
    credentials, categories, addCategory, deleteCategory, addCredential,
    deleteCredential, updateCredential, restoreCredential, permanentDeleteCredential,
    emptyTrash, toggleFavorite
  } = useVaultStore();

  const t = TRANSLATIONS[lang];

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(isMiniMode ? 'list' : 'grid');
  const [isTrashMode, setIsTrashMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [filterMode, setFilterMode] = useState<'ALL' | 'FAV' | 'RECENT'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SecurityAnalysis | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [viewPasswordModal, setViewPasswordModal] = useState<string | null>(null);

  // Expanded State
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [visibleHistory, setVisibleHistory] = useState<Set<string>>(new Set());

  // New Category State
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // TOTP State
  const [totpCodes, setTotpCodes] = useState<Map<string, string>>(new Map());
  const [totpProgress, setTotpProgress] = useState(100);

  // Favicon Cache
  const [faviconCache, setFaviconCache] = useState<Map<string, string>>(new Map());

  const listRef = useRef<any>(null);

  // Sync viewMode with Mini Mode
  useEffect(() => { if (isMiniMode) setViewMode('list'); }, [isMiniMode]);

  // Handle Highlight and Force Modal
  useEffect(() => {
    if (highlightedId) {
      const cred = credentials.find(c => c.id === highlightedId);
      if (cred) {
        setSearchTerm(cred.siteName);
        setVisiblePasswords(new Set([highlightedId]));
      }
    }
  }, [highlightedId, credentials]);

  useEffect(() => { if (shouldOpenAddModal) setIsModalOpen(true); }, [shouldOpenAddModal]);

  // FILTER LOGIC
  const filteredCredentials = useMemo(() => {
    let list = credentials.filter(c => isTrashMode ? !!c.deletedAt : !c.deletedAt);

    // Mode specific filter
    if (mode === 'DOCUMENTS') {
      list = list.filter(c => c.type === 'DOCUMENT');
    } else {
      list = list.filter(c => c.type !== 'DOCUMENT');
    }

    if (selectedCategory !== 'ALL') list = list.filter(c => c.category === selectedCategory);
    if (filterMode === 'FAV') list = list.filter(c => c.isFavorite);
    if (filterMode === 'RECENT') list = [...list].sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0)).slice(0, 5);

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(c =>
        c.siteName.toLowerCase().includes(s) ||
        c.username?.toLowerCase().includes(s) ||
        c.category.toLowerCase().includes(s) ||
        (c.notes && c.notes.toLowerCase().includes(s)) ||
        (c.alias && c.alias.toLowerCase().includes(s))
      );
    }
    return list;
  }, [credentials, isTrashMode, selectedCategory, filterMode, searchTerm, mode]);

  // TOTP Refresh Logic
  const hasTotp = credentials.some(c => c.totpSecret);
  useEffect(() => {
    const updateCodes = () => {
      const now = Math.floor(Date.now() / 1000);
      const secondsLeft = 30 - (now % 30);
      setTotpProgress((secondsLeft / 30) * 100);

      const newCodes = new Map();
      credentials.forEach(cred => {
        if (cred.totpSecret) {
          try {
            const totp = new TOTP({ secret: cred.totpSecret.replace(/\s/g, ''), algorithm: 'SHA1', digits: 6, period: 30 });
            newCodes.set(cred.id, totp.generate());
          } catch (e) { /* Invalid secret */ }
        }
      });
      setTotpCodes(newCodes);
    };
    updateCodes();
    const interval = setInterval(updateCodes, 1000);
    return () => clearInterval(interval);
  }, [hasTotp]);

  // Favicon Fetcher - DISABLED for privacy and security (offline password manager should be truly offline)
  // If you want to re-enable, uncomment the code below and understand the privacy implications
  /*
  useEffect(() => {
    const missingIds = credentials.filter(cred =>
      cred.type === 'LOGIN' && !faviconCache.has(cred.id)
    );

    if (missingIds.length > 0) {
      setFaviconCache(prev => {
        const next = new Map(prev);
        missingIds.forEach(cred => {
          const domain = cred.siteName.includes('.') ? cred.siteName : `${cred.siteName}.com`;
          next.set(cred.id, `https://www.google.com/s2/favicons?sz=64&domain=${domain}`);
        });
        return next;
      });
    }
  }, [credentials.length, credentials.map(c => c.id).join(',')]);
  */

  const handleAnalyze = async (id: string, pass: string) => {
    setAnalyzingId(id);
    try {
      const result = await analyzePasswordStrength(pass, lang);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingId(null);
    }
  };

  // Toggle Password Visibility
  const togglePasswordVisibility = useCallback((id: string) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setVisiblePasswords(newSet);
    if (listRef.current) listRef.current.resetAfterIndex(0);
  }, [visiblePasswords]);

  // Toggle History Visibility
  const onToggleHistory = useCallback((id: string) => {
    const newSet = new Set(visibleHistory);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setVisibleHistory(newSet);
    if (listRef.current) listRef.current.resetAfterIndex(0);
  }, [visibleHistory]);

  const handleAddCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      addCategory(newCatName.trim());
      setNewCatName('');
      setIsAddCatOpen(false);
    }
  };

  return (
    <div className="h-full flex flex-col w-full bg-slate-50 dark:bg-slate-950 transition-colors">

      {!isTrashMode && !isMiniMode && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 pb-2 transition-colors">
          <VaultStats credentials={credentials} lang={lang} />
        </div>
      )}

      <VaultHeader
        mode={mode}
        isTrashMode={isTrashMode}
        isMiniMode={isMiniMode}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onToggleMiniMode={() => setIsMiniMode(!isMiniMode)}
        setIsTrashMode={setIsTrashMode}
        openAddModal={() => { setEditingId(null); setIsModalOpen(true); }}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        onDeleteCategory={deleteCategory}
        isAddCatOpen={isAddCatOpen}
        setIsAddCatOpen={setIsAddCatOpen}
        newCatName={newCatName}
        setNewCatName={setNewCatName}
        handleAddCatSubmit={handleAddCatSubmit}
        lang={lang}
      />

      <div className="flex-1 min-h-0 relative">
        {filteredCredentials.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600 space-y-4 animate-fade-in">
            <p className="text-lg font-medium">{searchTerm ? t.noSearchResults : isTrashMode ? t.trashEmpty : t.nothingHere}</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="w-full h-full">
            <VaultGrid
              filteredCredentials={filteredCredentials}
              onToggleFavorite={toggleFavorite}
              openEditModal={(cred) => { setEditingId(cred.id); setIsModalOpen(true); }}
              onDelete={deleteCredential}
              isTrashMode={isTrashMode}
              onRestore={restoreCredential}
              onPermanentDelete={permanentDeleteCredential}
              faviconCache={faviconCache}
              lang={lang}
              width={0}
              height={0}
              onView={setViewPasswordModal}
            />
          </div>
        ) : (
          <AutoSizer>
            {({ height, width }: { height: number, width: number }) => (
              <div style={{ height, width }}>
                <VaultList
                  listRef={listRef}
                  height={height}
                  width={width}
                  filteredCredentials={filteredCredentials}
                  onCopy={onCopy}
                  onTouch={onTouch}
                  setViewPasswordModal={setViewPasswordModal}
                  handleAnalyze={handleAnalyze}
                  analyzingId={analyzingId}
                  openEditModal={(cred) => { setEditingId(cred.id); setIsModalOpen(true); }}
                  onDelete={deleteCredential}
                  isTrashMode={isTrashMode}
                  onRestore={restoreCredential}
                  onPermanentDelete={permanentDeleteCredential}
                  onToggleFavorite={toggleFavorite}
                  faviconCache={faviconCache}
                  isMiniMode={isMiniMode}
                  lang={lang}
                />
              </div>
            )}
          </AutoSizer>
        )}
      </div>

      {analysis && (
        <AnalysisModal
          analysis={analysis}
          onClose={() => setAnalysis(null)}
          lang={lang}
        />
      )}

      {viewPasswordModal && (
        <PasswordViewModal
          credId={viewPasswordModal}
          credentials={credentials}
          onClose={() => setViewPasswordModal(null)}
          lang={lang}
          onCopy={onCopy}
          onTouch={onTouch}
          totpCodes={totpCodes}
          totpProgress={totpProgress}
          visibleHistory={visibleHistory}
          onToggleHistory={onToggleHistory}
        />
      )}

      {isModalOpen && (
        <AddEditModal
          editingId={editingId}
          initialData={credentials.find(c => c.id === editingId)}
          categories={categories}
          onClose={() => setIsModalOpen(false)}
          onAdd={addCredential}
          onUpdate={updateCredential}
          lang={lang}
          generatorSettings={generatorSettings}
          mode={mode}
        />
      )}

    </div>
  );
};

export default Vault;
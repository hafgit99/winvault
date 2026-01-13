import { create } from 'zustand';
import { Credential, Category } from '../types';

interface VaultState {
    credentials: Credential[];
    categories: Category[];
    highlightedId: string | null;
    forceAddModal: boolean;

    setCredentials: (creds: Credential[]) => void;
    setCategories: (cats: Category[]) => void;
    setHighlightedId: (id: string | null) => void;
    setForceAddModal: (force: boolean) => void;

    // Actions
    addCredential: (cred: Omit<Credential, 'id' | 'updatedAt'>) => void;
    deleteCredential: (id: string) => void;
    updateCredential: (id: string, updates: Partial<Credential>) => void;
    restoreCredential: (id: string) => void;
    permanentDeleteCredential: (id: string) => void;
    emptyTrash: () => void;
    toggleFavorite: (id: string) => void;
    addCategory: (name: string) => void;
    deleteCategory: (id: string) => void;
}

export const useVaultStore = create<VaultState>((set) => ({
    credentials: [],
    categories: [
        { id: 'General', name: 'Genel', isSystem: true },
        { id: 'Social', name: 'Sosyal Medya', isSystem: false },
        { id: 'Banking', name: 'Bankacılık', isSystem: false },
        { id: 'Work', name: 'İş', isSystem: false }
    ],
    highlightedId: null,
    forceAddModal: false,

    setCredentials: (credentials) => set({ credentials }),
    setCategories: (categories) => set({ categories }),
    setHighlightedId: (highlightedId) => set({ highlightedId }),
    setForceAddModal: (forceAddModal) => set({ forceAddModal }),

    addCredential: (cred) => set((state) => {
        const newCred: Credential = {
            ...cred,
            id: Math.random().toString(36).substring(2, 9),
            updatedAt: Date.now()
        };
        return { credentials: [newCred, ...state.credentials] };
    }),

    deleteCredential: (id) => set((state) => ({
        credentials: state.credentials.map(c => c.id === id ? { ...c, deletedAt: Date.now() } : c)
    })),

    updateCredential: (id, updates) => set((state) => ({
        credentials: state.credentials.map(c => {
            if (c.id === id) {
                const updated = { ...c, ...updates, updatedAt: Date.now() };
                if (updates.passwordValue && updates.passwordValue !== c.passwordValue) {
                    const newHistory = [...(c.history || []), { date: Date.now(), value: c.passwordValue || '' }];
                    updated.history = newHistory.slice(-5);
                }
                return updated;
            }
            return c;
        })
    })),

    restoreCredential: (id) => set((state) => ({
        credentials: state.credentials.map(c => c.id === id ? { ...c, deletedAt: undefined } : c)
    })),

    permanentDeleteCredential: (id) => set((state) => ({
        credentials: state.credentials.filter(c => c.id !== id)
    })),

    emptyTrash: () => set((state) => ({
        credentials: state.credentials.filter(c => !c.deletedAt)
    })),

    toggleFavorite: (id) => set((state) => ({
        credentials: state.credentials.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)
    })),

    addCategory: (name) => set((state) => {
        const newCat: Category = { id: Math.random().toString(36).substring(2, 9), name, isSystem: false };
        return { categories: [...state.categories, newCat] };
    }),

    deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id),
        credentials: state.credentials.map(c => c.category === id ? { ...c, category: 'General' } : c)
    }))
}));

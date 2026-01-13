/** @vitest-environment jsdom */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TRANSLATIONS } from '../../src/utils';
import { useAppStore } from '../../src/store/useAppStore';
import { act } from '@testing-library/react';

/**
 * Language Sync Tests
 * 
 * Verifies that language changes correctly update all UI translations.
 * Tests the TRANSLATIONS object and useAppStore language switching.
 */

describe('Language Sync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset store to default state
        useAppStore.setState({ lang: 'tr' });
    });

    it('should have all keys in both languages', () => {
        const trKeys = Object.keys(TRANSLATIONS.tr);
        const enKeys = Object.keys(TRANSLATIONS.en);

        // Both languages should have the same keys
        expect(trKeys.length).toBe(enKeys.length);

        trKeys.forEach(key => {
            expect(enKeys).toContain(key);
        });
    });

    it('should return different translations for different languages', () => {
        // Check some key translations are different
        expect(TRANSLATIONS.tr.vault).not.toBe(TRANSLATIONS.en.vault);
        expect(TRANSLATIONS.tr.settings).not.toBe(TRANSLATIONS.en.settings);
        expect(TRANSLATIONS.tr.addAccount).not.toBe(TRANSLATIONS.en.addAccount);
    });

    it('should update store language correctly', () => {
        expect(useAppStore.getState().lang).toBe('tr');

        act(() => {
            useAppStore.getState().setLang('en');
        });

        expect(useAppStore.getState().lang).toBe('en');
    });

    it('should get correct translations after language change', () => {
        // Start with Turkish
        let currentLang = useAppStore.getState().lang;
        expect(TRANSLATIONS[currentLang].vault).toBe(TRANSLATIONS.tr.vault);

        // Switch to English
        act(() => {
            useAppStore.getState().setLang('en');
        });

        currentLang = useAppStore.getState().lang;
        expect(TRANSLATIONS[currentLang].vault).toBe(TRANSLATIONS.en.vault);
    });

    it('should have non-empty translations for common keys', () => {
        const commonKeys = [
            'vault', 'settings', 'generator', 'addAccount',
            'password', 'username', 'copied', 'delete', 'edit',
            'search', 'cancel', 'save'
        ];

        commonKeys.forEach(key => {
            // Check both languages have non-empty values
            const trValue = (TRANSLATIONS.tr as any)[key];
            const enValue = (TRANSLATIONS.en as any)[key];

            if (trValue !== undefined) {
                expect(trValue.length).toBeGreaterThan(0);
            }
            if (enValue !== undefined) {
                expect(enValue.length).toBeGreaterThan(0);
            }
        });
    });

    it('should persist language preference when switching back and forth', () => {
        act(() => {
            useAppStore.getState().setLang('en');
        });
        expect(useAppStore.getState().lang).toBe('en');

        act(() => {
            useAppStore.getState().setLang('tr');
        });
        expect(useAppStore.getState().lang).toBe('tr');

        act(() => {
            useAppStore.getState().setLang('en');
        });
        expect(useAppStore.getState().lang).toBe('en');
    });
});

describe('Translation Keys Consistency', () => {
    it('should not have undefined values in Turkish translations', () => {
        Object.entries(TRANSLATIONS.tr).forEach(([key, value]) => {
            expect(value).toBeDefined();
            // Values can be strings or functions (for dynamic translations)
            expect(['string', 'function']).toContain(typeof value);
        });
    });

    it('should not have undefined values in English translations', () => {
        Object.entries(TRANSLATIONS.en).forEach(([key, value]) => {
            expect(value).toBeDefined();
            // Values can be strings or functions (for dynamic translations)
            expect(['string', 'function']).toContain(typeof value);
        });
    });

    it('should have Turkish characters in Turkish translations', () => {
        const turkishChars = /[çğıöşüÇĞİÖŞÜ]/;
        const hasTurkishChars = Object.values(TRANSLATIONS.tr).some(
            value => typeof value === 'string' && turkishChars.test(value)
        );
        expect(hasTurkishChars).toBe(true);
    });
});

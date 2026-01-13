/** @vitest-environment jsdom */
import { render, waitFor, act } from '@testing-library/react';
import App from '../../src/App';
import { dbService } from '../../src/services/idb';
import { useAppStore } from '../../src/store/useAppStore';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// Mocks
vi.mock('../../src/services/idb', () => ({
    dbService: {
        init: vi.fn(),
        getSecurityConfig: vi.fn(),
        getSettings: vi.fn(),
        getCategories: vi.fn(),
        saveSettings: vi.fn(),
        saveSecurityConfig: vi.fn(),
        saveCategories: vi.fn(),
        saveEncryptedBlob: vi.fn(),
        saveFakeEncryptedBlob: vi.fn(),
        getEncryptedBlob: vi.fn(),
    }
}));

// Mock sub-components
vi.mock('../../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../../src/components/Vault', () => ({ default: () => <div data-testid="vault" /> }));
vi.mock('../../src/components/PasswordGenerator', () => ({ default: () => <div data-testid="generator" /> }));
vi.mock('../../src/components/MasterLogin', () => ({ default: ({ onUnlock }: { onUnlock: any }) => <div data-testid="master-login" /> }));
vi.mock('../../src/components/UserGuide', () => ({ default: () => null }));
vi.mock('../../src/components/CommandPalette', () => ({ default: () => null }));
vi.mock('../../src/components/App/SettingsView', () => ({ default: () => null }));

// Mock utils that might cause issues
vi.mock('../../src/utils', async () => {
    const actual = await vi.importActual('../../src/utils');
    return {
        ...actual,
        initializeMemorySecurity: vi.fn(),
        initializeEnhancedMemorySecurity: vi.fn(),
        wasmSecurityManager: { initialize: vi.fn() },
        AdvancedSessionManager: { initialize: vi.fn() },
        AdvancedSecureClipboard: { initialize: vi.fn() },
        getDeviceId: vi.fn().mockReturnValue('test-device'),
    };
});

describe('Settings Persistence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(dbService.getSecurityConfig).mockResolvedValue({
            masterPasswordHash: 'hash',
            is2FAEnabled: false,
            isWordAuthEnabled: false,
            recoveryWords: [],
            licenseType: 'FREE',
            autoLockTimeout: 300000
        });
        vi.mocked(dbService.getCategories).mockResolvedValue([]);
    });

    it('should load theme and language from dbService on initialization', async () => {
        vi.mocked(dbService.getSettings).mockResolvedValue({
            theme: 'amoled',
            lang: 'en',
            genSettings: {},
            isPro: true,
            installDate: 12345
        });

        await act(async () => {
            render(<App />);
        });

        await waitFor(() => {
            expect(useAppStore.getState().theme).toBe('amoled');
            expect(useAppStore.getState().lang).toBe('en');
        });
    });

    it('should save theme to dbService when changed', async () => {
        vi.mocked(dbService.getSettings).mockResolvedValue(null);

        await act(async () => {
            render(<App />);
        });

        // Simulate data loaded to allow saving
        act(() => {
            useAppStore.getState().setIsDataLoaded(true);
        });

        // Change theme
        act(() => {
            useAppStore.getState().setTheme('light');
        });

        await waitFor(() => {
            expect(dbService.saveSettings).toHaveBeenCalledWith(expect.objectContaining({
                theme: 'light'
            }));
        });
    });

    it('should save language to dbService when changed', async () => {
        vi.mocked(dbService.getSettings).mockResolvedValue(null);

        await act(async () => {
            render(<App />);
        });

        act(() => {
            useAppStore.getState().setIsDataLoaded(true);
        });

        // Change language
        act(() => {
            useAppStore.getState().setLang('en');
        });

        await waitFor(() => {
            expect(dbService.saveSettings).toHaveBeenCalledWith(expect.objectContaining({
                lang: 'en'
            }));
        });
    });
});

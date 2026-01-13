/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { dbService } from '../../src/services/idb';

describe('Database Integrity (HMAC) Protection', () => {

    beforeEach(async () => {
        vi.clearAllMocks();
        // Clear IDB and localStorage before each test
        localStorage.clear();
        (dbService as any).resetInternalState();
        await dbService.clear();

        // Mock electron for SafeStorage (optional, will fallback to plain base64)
        Object.defineProperty(window, 'electron', {
            value: {
                encryptKey: vi.fn(async (k) => k),
                decryptKey: vi.fn(async (k) => k)
            },
            configurable: true
        });
    });

    it('should save and retrieve encrypted blob with valid HMAC', async () => {
        const testData = JSON.stringify({ secret: 'top_secret_value', entries: [] });

        await dbService.saveEncryptedBlob(testData);

        const retrieved = await dbService.getEncryptedBlob();
        expect(retrieved).toEqual(testData);
    });

    it('should detect data tampering (HMAC mismatch)', async () => {
        const testData = JSON.stringify({ amount: 1000 });
        const testKey = 'main_blob';

        // 1. Normal save
        await dbService.saveEncryptedBlob(testData);

        // 2. Manually tamper with the raw data in IndexedDB
        const request = indexedDB.open('WinVaultDB');
        await new Promise((resolve) => {
            request.onsuccess = async (event: any) => {
                const db = event.target.result;
                const tx = db.transaction(['vault_data'], 'readwrite');
                const store = tx.objectStore('vault_data');

                // Get the raw stored object (StoredData interface)
                const getReq = store.get(testKey);
                getReq.onsuccess = () => {
                    const tamperedValue = getReq.result;
                    // Change the data string without updating the HMAC
                    tamperedValue.data = JSON.stringify({ amount: 999999 });
                    store.put(tamperedValue, testKey);
                    resolve(null);
                };
            };
        });

        // 3. Try to get data via dbService
        // It should throw an error or return null depending on code branch
        try {
            await dbService.getEncryptedBlob();
            // Should not reach here
            expect(true).toBe(false);
        } catch (error: any) {
            // 4. Verify detection
            expect(error.message).toBe('Data integrity check failed');
        }
    });

    it('should detect HMAC key replacement', async () => {
        const testData = JSON.stringify({ val: 'secure' });

        await dbService.saveEncryptedBlob(testData);

        // Replace the integrity key in localStorage with a different one
        // Base64 of 'different'
        localStorage.setItem('__wv_integrity_key', btoa('different_random_key_value_that_is_long_enough'));
        (dbService as any).resetInternalState();

        try {
            await dbService.getEncryptedBlob();
            expect(true).toBe(false);
        } catch (error: any) {
            expect(error.message).toBe('Data integrity check failed');
        }
    });
});

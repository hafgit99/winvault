/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DB Service properly regarding hoisting
vi.mock('../../src/services/idb', () => ({
    dbService: {
        saveConfig: vi.fn(),
        getConfig: vi.fn()
    }
}));

import { hashPassword, verifyPassword } from '../../src/utils';
import { dbService } from '../../src/services/idb';

describe('Authentication Security', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should hash password and return salt', async () => {
        const result = await hashPassword('my-secret-password');

        expect(result.hash).toBeDefined();
        expect(result.hash.length).toBeGreaterThan(0);
        expect(result.salt).toBeDefined();
        expect(result.salt).toBeInstanceOf(Uint8Array);
    });

    it('should store salt directly when hashing new password', async () => {
        await hashPassword('new-user-password');

        expect(vi.mocked(dbService).saveConfig).toHaveBeenCalledWith('masterSalt', expect.any(String));
    });

    it('should verify correct password successfully', async () => {
        // 1. Hash a password
        const { hash, salt } = await hashPassword('correct-horse');

        // 2. Mock retrieval of the salt used
        // Salt is stored as hex string
        const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
        vi.mocked(dbService).getConfig.mockResolvedValue(saltHex);

        // 3. Verify
        const isValid = await verifyPassword('correct-horse', hash);
        expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
        const { hash, salt } = await hashPassword('correct-horse');

        const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
        vi.mocked(dbService).getConfig.mockResolvedValue(saltHex);

        const isValid = await verifyPassword('WRONG-password', hash);
        expect(isValid).toBe(false);
    });

    it('should fail securely if salt is missing', async () => {
        vi.mocked(dbService).getConfig.mockResolvedValue(null);

        // Should fallback to default salt or fail safe
        // (logic depends on utils.ts implementation of fallback)
        const isValid = await verifyPassword('any', 'some-random-hash');
        expect(isValid).toBe(false);
    });
});

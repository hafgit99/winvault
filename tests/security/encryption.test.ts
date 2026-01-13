import { describe, it, expect } from 'vitest';
import * as crypto from 'crypto';

describe('Encryption Primitive Tests', () => {
    it('should generate secure random buffer', () => {
        const buf = crypto.randomBytes(32);
        expect(buf.length).toBe(32);
        // Ensure not empty
        expect(buf.some(b => b !== 0)).toBe(true);
    });

    it('should implement PBKDF2 correctly', () => {
        const password = 'test-password';
        const salt = crypto.randomBytes(16);
        const iterations = 100000;
        const keyLen = 32;
        const digest = 'sha256';

        const key = crypto.pbkdf2Sync(password, salt, iterations, keyLen, digest);
        expect(key.length).toBe(32);
    });
});

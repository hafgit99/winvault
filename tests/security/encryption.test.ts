import { describe, it, expect } from 'vitest';
import * as crypto from 'crypto';

describe('Encryption Primitive Tests', () => {
    it('should generate secure random buffer', () => {
        const buf = crypto.randomBytes(32);
        expect(buf.length).toBe(32);
        // Ensure not empty
        expect(buf.some(b => b !== 0)).toBe(true);
    });

    it('should implement PBKDF2 with 100,000 iterations', () => {
        const password = 'test-password';
        const salt = crypto.randomBytes(16);
        const iterations = 100000;
        const keyLen = 32;

        const key = crypto.pbkdf2Sync(password, salt, iterations, keyLen, 'sha256');
        expect(key.length).toBe(32);
    });

    it('should encrypt and decrypt correctly using AES-256-GCM', () => {
        const key = crypto.randomBytes(32);
        const iv = crypto.randomBytes(12);
        const text = 'Veri Gizliliği Testi';

        // Encrypt
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        // Decrypt
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        expect(decrypted).toBe(text);
    });
});

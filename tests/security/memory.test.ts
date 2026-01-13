/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SecureString, MemoryManager } from '../../src/utils/memorySecurity';

describe('Memory Security Utils', () => {

    describe('SecureString', () => {
        it('should create and retrieve value correctly', () => {
            const secret = 'superSecret123';
            const secure = new SecureString(secret);

            expect(secure.toString()).toBe(secret);
            expect(secure.destroyed).toBe(false);
        });

        it('should destroy data when destroy() is called', () => {
            const secret = 'superSecret123';
            const secure = new SecureString(secret);

            secure.destroy();

            expect(secure.destroyed).toBe(true);
            expect(() => secure.toString()).toThrow('SecureString has been destroyed');

            // Access private data to verify zeroing (this is technically accessing private prop, but valid for checking memory state in test)
            const internalData = (secure as any).data;
            expect(internalData.length).toBe(0);
        });

        it('should handle multiple destroy calls gracefully', () => {
            const secure = new SecureString('test');
            secure.destroy();
            expect(() => secure.destroy()).not.toThrow();
            expect(secure.destroyed).toBe(true);
        });
    });

    describe('MemoryManager', () => {
        beforeEach(() => {
            // Reset MemoryManager state if possible or ensure clean slate
            MemoryManager.cleanupAll();
        });

        afterEach(() => {
            MemoryManager.stopAutoCleanup();
            MemoryManager.cleanupAll();
        });

        it('should register and cleanup sensitive data', () => {
            const s1 = new SecureString('secret1');
            const s2 = new SecureString('secret2');

            MemoryManager.registerSensitive(s1);
            MemoryManager.registerSensitive(s2);

            MemoryManager.cleanupAll();

            expect(s1.destroyed).toBe(true);
            expect(s2.destroyed).toBe(true);
        });

        it('should unregister sensitive data', () => {
            const s1 = new SecureString('secret1');

            MemoryManager.registerSensitive(s1);
            MemoryManager.unregisterSensitive(s1);

            MemoryManager.cleanupAll();

            // Should NOT be destroyed because it was unregistered
            expect(s1.destroyed).toBe(false);
        });

        it('createSecurePassword should return managed SecureString', () => {
            const secure = MemoryManager.createSecurePassword('managed-secret');

            expect(secure).toBeInstanceOf(SecureString);

            MemoryManager.cleanupAll();
            expect(secure.destroyed).toBe(true);
        });

        it('usePassword should return string and destroy secure object', () => {
            const secure = MemoryManager.createSecurePassword('one-time-use');

            const value = MemoryManager.usePassword(secure);

            expect(value).toBe('one-time-use');
            expect(secure.destroyed).toBe(true);

            // Verify it was unregistered
            const fakeSensitiveSet = (MemoryManager as any).sensitiveData;
            expect(fakeSensitiveSet.has(secure)).toBe(false);
        });

        it('auto cleanup should run periodically', () => {
            vi.useFakeTimers();

            const s1 = new SecureString('temp');
            MemoryManager.registerSensitive(s1);
            MemoryManager.startAutoCleanup(1000); // 1 sec interval

            expect(s1.destroyed).toBe(false);

            vi.advanceTimersByTime(1100);

            expect(s1.destroyed).toBe(true);

            vi.useRealTimers();
        });
    });
});

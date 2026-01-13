/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdvancedSessionManager } from '../../src/utils/advancedSessionManager';

describe('Advanced Session Manager Security', () => {

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();

        // Mock Blob.text for jsdom
        if (!Blob.prototype.text) {
            Blob.prototype.text = function () {
                const blob = this;
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsText(blob);
                });
            };
        }

        // Mock crypto functions
        if (!global.crypto.randomUUID) {
            // @ts-ignore
            global.crypto.randomUUID = () => 'test-uuid-1234';
        }

        // Aggressive Mocking of DB and Crypto to avoid hangs
        vi.spyOn(AdvancedSessionManager as any, 'storeSecureSession').mockImplementation(async (data: any) => {
            localStorage.setItem('session_' + data.sessionId, JSON.stringify(data));
        });

        vi.spyOn(AdvancedSessionManager as any, 'loadSecureSession').mockImplementation(async (id: string) => {
            const data = localStorage.getItem('session_' + id);
            return data ? JSON.parse(data) : null;
        });

        vi.spyOn(AdvancedSessionManager as any, 'generateSessionKey').mockImplementation(async () => {
            return {} as any; // Dummy key
        });

        vi.spyOn(AdvancedSessionManager as any, 'generateDeviceFingerprint').mockImplementation(async () => {
            return 'test-device-fp';
        });

        vi.spyOn(AdvancedSessionManager as any, 'generateKeyFingerprint').mockImplementation(async () => {
            return 'test-key-fp';
        });

        // Mock localStorage for session storage simulation
        const storage: Record<string, string> = {};
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: (key: string) => storage[key] || null,
                setItem: (key: string, value: string) => { storage[key] = value; },
                removeItem: (key: string) => { delete storage[key]; },
                clear: () => { for (const key in storage) delete storage[key]; }
            },
            writable: true,
            configurable: true
        });
    });

    it('should create a session with correct expiration time', async () => {
        const config = { maxInactivityTime: 15 * 60 * 1000 };
        await AdvancedSessionManager.initialize(config);

        const session = await AdvancedSessionManager.createSecureSession('user-fingerprint');

        expect(session.sessionId).toBeDefined();
        // createdAt now + duration = expiresAt
        expect(session.expiresAt).toBeGreaterThan(session.createdAt);
    });

    it('should mark session as invalid after inactivity timeout', async () => {
        const inactivityMs = 15 * 60 * 1000;
        await AdvancedSessionManager.initialize({ maxInactivityTime: inactivityMs });

        const session = await AdvancedSessionManager.createSecureSession();

        // Fast forward 16 minutes
        vi.advanceTimersByTime(16 * 60 * 1000);

        const status = await AdvancedSessionManager.validateSession(session.sessionId);
        expect(status.isValid).toBe(false);
        expect(status.reason).toBe('Session inactive');
    });

    it('should reset inactivity timer on activity (validation)', async () => {
        const inactivityMs = 10 * 60 * 1000; // 10 min
        await AdvancedSessionManager.initialize({ maxInactivityTime: inactivityMs });

        const session = await AdvancedSessionManager.createSecureSession();

        // Wait 8 minutes
        vi.advanceTimersByTime(8 * 60 * 1000);

        // Perform activity (validate session)
        let status = await AdvancedSessionManager.validateSession(session.sessionId);
        expect(status.isValid).toBe(true);

        // Wait another 8 minutes
        vi.advanceTimersByTime(8 * 60 * 1000);

        // Total 16 mins passed since start, but last activity was 8 mins ago.
        status = await AdvancedSessionManager.validateSession(session.sessionId);
        expect(status.isValid).toBe(true);
    });
});

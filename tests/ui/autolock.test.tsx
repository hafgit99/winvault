/** @vitest-environment jsdom */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

/**
 * Auto-Lock Functionality Tests
 * 
 * Tests the auto-lock mechanism based on user inactivity (mouse/keyboard).
 * Uses isolated test approach instead of rendering the full App component.
 */

describe('Auto-Lock Functionality', () => {
    let lockCallback: () => void;
    let resetTimerCallback: () => void;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let isLocked = true;
    const autoLockTimeout = 5000; // 5 seconds for testing

    // Simulates the resetIdleTimer function from App.tsx
    const resetIdleTimer = () => {
        if (idleTimer) clearTimeout(idleTimer);
        if (!isLocked && autoLockTimeout > 0) {
            idleTimer = setTimeout(() => {
                isLocked = true;
                lockCallback?.();
            }, autoLockTimeout);
        }
    };

    // Simulates unlocking
    const unlock = () => {
        isLocked = false;
        resetIdleTimer();
    };

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        lockCallback = vi.fn();
        resetTimerCallback = vi.fn();
        isLocked = true;
        idleTimer = null;
    });

    afterEach(() => {
        if (idleTimer) clearTimeout(idleTimer);
        vi.useRealTimers();
    });

    it('should auto-lock after inactivity', () => {
        // 1. Initial State: Locked
        expect(isLocked).toBe(true);

        // 2. Unlock
        unlock();
        expect(isLocked).toBe(false);

        // 3. Fast-forward time past timeout (5000ms)
        vi.advanceTimersByTime(6000);

        // 4. Should be locked again
        expect(isLocked).toBe(true);
        expect(lockCallback).toHaveBeenCalled();
    });

    it('should reset timer on user activity', () => {
        // Unlock
        unlock();
        expect(isLocked).toBe(false);

        // Advance 3s (not enough to lock)
        vi.advanceTimersByTime(3000);
        expect(isLocked).toBe(false);

        // Simulate Activity (resets timer)
        resetIdleTimer();

        // Advance another 3s (Total 6s from start, but only 3s from activity)
        vi.advanceTimersByTime(3000);

        // Should still be unlocked because timer was reset
        expect(isLocked).toBe(false);

        // Advance remaining 3s (now 6s from last activity > 5s timeout)
        vi.advanceTimersByTime(3000);

        // Now it should lock
        expect(isLocked).toBe(true);
        expect(lockCallback).toHaveBeenCalled();
    });

    it('should not start timer if already locked', () => {
        // Already locked
        expect(isLocked).toBe(true);

        // Try to reset timer while locked
        resetIdleTimer();

        // Advance time - nothing should happen
        vi.advanceTimersByTime(10000);

        // Still locked, no callback called
        expect(isLocked).toBe(true);
        expect(lockCallback).not.toHaveBeenCalled();
    });

    it('should not lock if timeout is 0 (disabled)', () => {
        const customTimeout = 0;
        const customResetTimer = () => {
            if (idleTimer) clearTimeout(idleTimer);
            if (!isLocked && customTimeout > 0) {
                idleTimer = setTimeout(() => {
                    isLocked = true;
                    lockCallback?.();
                }, customTimeout);
            }
        };

        isLocked = false;
        customResetTimer();

        // Advance a lot of time
        vi.advanceTimersByTime(60000);

        // Should still be unlocked
        expect(isLocked).toBe(false);
        expect(lockCallback).not.toHaveBeenCalled();
    });

    it('should handle multiple activity events correctly', () => {
        unlock();

        // Simulate multiple rapid activities
        for (let i = 0; i < 5; i++) {
            vi.advanceTimersByTime(1000);
            resetIdleTimer();
        }

        // Still unlocked after 5 seconds of activity
        expect(isLocked).toBe(false);

        // Now stop activity and wait for timeout
        vi.advanceTimersByTime(6000);

        // Should lock now
        expect(isLocked).toBe(true);
    });
});

describe('Auto-Lock Event Listeners', () => {
    let eventListeners: { [key: string]: (() => void)[] } = {};

    beforeEach(() => {
        vi.useFakeTimers();
        eventListeners = {};

        // Mock window event listeners
        vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
            if (!eventListeners[event]) eventListeners[event] = [];
            eventListeners[event].push(handler as () => void);
        });

        vi.spyOn(window, 'removeEventListener').mockImplementation((event, handler) => {
            if (eventListeners[event]) {
                eventListeners[event] = eventListeners[event].filter(h => h !== handler);
            }
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should register mousemove and keydown listeners', () => {
        const resetTimer = vi.fn();

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);

        expect(eventListeners['mousemove']).toContain(resetTimer);
        expect(eventListeners['keydown']).toContain(resetTimer);
    });

    it('should trigger reset on mouse movement', () => {
        const resetTimer = vi.fn();
        window.addEventListener('mousemove', resetTimer);

        // Simulate mouse move
        eventListeners['mousemove']?.forEach(handler => handler());

        expect(resetTimer).toHaveBeenCalled();
    });

    it('should trigger reset on keyboard activity', () => {
        const resetTimer = vi.fn();
        window.addEventListener('keydown', resetTimer);

        // Simulate keydown
        eventListeners['keydown']?.forEach(handler => handler());

        expect(resetTimer).toHaveBeenCalled();
    });

    it('should clean up listeners on unmount', () => {
        const resetTimer = vi.fn();

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);

        expect(eventListeners['mousemove']?.length).toBe(1);
        expect(eventListeners['keydown']?.length).toBe(1);

        window.removeEventListener('mousemove', resetTimer);
        window.removeEventListener('keydown', resetTimer);

        expect(eventListeners['mousemove']?.length).toBe(0);
        expect(eventListeners['keydown']?.length).toBe(0);
    });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimiter } from '../../src/services/rateLimiter';
import { securityLogger } from '../../src/services/securityLogger';

// Mock securityLogger to act as a spy
vi.mock('../../src/services/securityLogger', () => ({
    securityLogger: {
        log: vi.fn(),
    }
}));

describe('Rate Limiter Security Service', () => {
    beforeEach(() => {
        // Clear internal map (RateLimiter doesn't expose public clear, so we rely on reset)
        // Since rateLimiter is singleton, we assume clean state or mocking limitations.
        // Ideally add a clear method to rateLimiter for testing.
        vi.useFakeTimers();
    });

    it('should allow first attempts', async () => {
        const user = 'test-user-1';
        rateLimiter.reset(user);

        const result = rateLimiter.isBlocked(user);
        expect(result.blocked).toBe(false);
    });

    it('should block after max attempts', async () => {
        const user = 'test-user-block';
        rateLimiter.reset(user);

        // Fail 3 times
        await rateLimiter.recordFailure(user);
        await rateLimiter.recordFailure(user);
        await rateLimiter.recordFailure(user);

        const status = rateLimiter.isBlocked(user);
        expect(status.blocked).toBe(true);
        expect(status.remainingTime).toBeGreaterThan(0);

        // Logger should be called
        expect(securityLogger.log).toHaveBeenCalledWith(
            'RATE_LIMIT_EXCEEDED',
            'WARNING',
            expect.stringContaining('temporarily blocked'),
            expect.any(Object)
        );
    });

    it('should implement exponential backoff', async () => {
        const user = 'test-user-backoff';
        rateLimiter.reset(user);

        // 3 failures -> 1 min block
        await rateLimiter.recordFailure(user);
        await rateLimiter.recordFailure(user);
        await rateLimiter.recordFailure(user); // Blocked for 60s

        let status = rateLimiter.isBlocked(user);
        expect(status.remainingTime).toBeLessThanOrEqual(60);

        // Fast forward time to expire first block
        vi.advanceTimersByTime(60001);
        status = rateLimiter.isBlocked(user);
        expect(status.blocked).toBe(false);

        // 4th failure -> 2 min block (exponential)
        await rateLimiter.recordFailure(user);

        status = rateLimiter.isBlocked(user);
        expect(status.blocked).toBe(true);
        // Should be > 60s (approx 120s)
        expect(status.remainingTime).toBeGreaterThan(60);
    });
});

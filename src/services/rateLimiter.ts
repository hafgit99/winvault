import { securityLogger } from './securityLogger';

interface UnblockMetadata {
  expiresAt: number;
  attempts: number;
}

class RateLimiter {
  private attempts: Map<string, UnblockMetadata> = new Map();

  // Configuration
  private readonly MAX_ATTEMPTS = 3;
  private readonly BASE_LOCKOUT_TIME = 60 * 1000; // 1 minute
  private readonly MAX_LOCKOUT_TIME = 60 * 60 * 1000; // 1 hour

  /**
   * Check if the specific identifier (IP or Username Hash) is blocked
   */
  isBlocked(identifier: string): { blocked: boolean; remainingTime?: number } {
    const data = this.attempts.get(identifier);

    if (!data) return { blocked: false };

    const now = Date.now();
    if (data.attempts >= this.MAX_ATTEMPTS && now < data.expiresAt) {
      return {
        blocked: true,
        remainingTime: Math.ceil((data.expiresAt - now) / 1000)
      };
    }

    // Auto-reset if time passed
    // We do NOT delete here to preserve attempt count for backoff calculation.
    // Successful login will call reset() to clear this.

    return { blocked: false };
  }

  /**
   * Register a failed attempt
   */
  async recordFailure(identifier: string): Promise<void> {
    const now = Date.now();
    const data = this.attempts.get(identifier) || { attempts: 0, expiresAt: 0 };

    data.attempts++;

    if (data.attempts >= this.MAX_ATTEMPTS) {
      // Calculate exponential backoff
      // attempts: 3 -> 1 min
      // attempts: 4 -> 2 min
      // attempts: 5 -> 4 min ...
      const multiplier = Math.pow(2, data.attempts - this.MAX_ATTEMPTS);
      const lockoutDuration = Math.min(this.BASE_LOCKOUT_TIME * multiplier, this.MAX_LOCKOUT_TIME);

      data.expiresAt = now + lockoutDuration;

      await securityLogger.log(
        'RATE_LIMIT_EXCEEDED',
        'WARNING',
        `User/IP ${identifier} temporarily blocked for ${lockoutDuration / 1000}s`,
        { attempts: data.attempts }
      );
    } else {
      // Reset expiry on new failure window start
      if (data.expiresAt === 0) data.expiresAt = now + (5 * 60 * 1000); // 5 min window
    }

    this.attempts.set(identifier, data);

    if (data.attempts > this.MAX_ATTEMPTS) {
      // Log repeated failures after block as highly suspicious
      await securityLogger.log(
        'SUSPICIOUS_ACTIVITY',
        'WARNING',
        `Repeated login failure from ${identifier} (${data.attempts} attempts)`
      );
    }
  }

  /**
   * Reset attempts on success
   */
  reset(identifier: string): void {
    if (this.attempts.has(identifier)) {
      this.attempts.delete(identifier);
    }
  }

  /**
   * Get device fingerprint (IP simulation for Desktop)
   * In Electron, this would ideally use system hardware IDs.
   * Here we use a stable hash of available navigator data.
   */
  async getDeviceFingerprint(): Promise<string> {
    const raw = [
      navigator.platform,
      navigator.hardwareConcurrency,
      navigator.language,
      // @ts-ignore
      navigator.deviceMemory,
    ].join('|');

    const msgBuffer = new TextEncoder().encode(raw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 12);
  }
}

export const rateLimiter = new RateLimiter();
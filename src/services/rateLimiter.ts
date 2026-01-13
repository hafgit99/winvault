import { RateLimitResult } from '../types';

// Enhanced Rate Limiter with Temporary Lockouts
interface AttemptRecord {
  count: number;
  lastAttempt: number;
  lockedUntil: number;
  deviceId: string;
}

export class EnhancedRateLimiter {
  private attempts = new Map<string, AttemptRecord>();
  private readonly deviceId: string;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
  }

  // Check if current attempt is allowed
  async checkAttempt(lang: string = 'tr'): Promise<RateLimitResult> {
    const record = this.attempts.get(this.deviceId) || {
      count: 0,
      lastAttempt: 0,
      lockedUntil: 0,
      deviceId: this.deviceId
    };

    // Check if device is currently locked
    if (Date.now() < record.lockedUntil) {
      const remainingTime = record.lockedUntil - Date.now();
      return {
        allowed: false,
        waitTime: remainingTime,
        lockDuration: this.formatDuration(remainingTime, lang)
      };
    }

    // Calculate progressive delay
    const delay = this.calculateDelay(record.count);
    if (record.count > 0 && Date.now() - record.lastAttempt < delay) {
      return {
        allowed: false,
        waitTime: delay,
        lockDuration: this.formatDuration(delay, lang)
      };
    }

    // Calculate remaining attempts before lockout
    const remainingAttempts = Math.max(0, this.getAttemptsBeforeLockout(record.count) - record.count);

    return {
      allowed: true,
      waitTime: 0,
      remainingAttempts
    };
  }

  // Record a failed attempt
  recordFailedAttempt(lang: string = 'tr'): RateLimitResult {
    const record = this.attempts.get(this.deviceId) || {
      count: 0,
      lastAttempt: 0,
      lockedUntil: 0,
      deviceId: this.deviceId
    };

    record.count++;
    record.lastAttempt = Date.now();

    // Check if should trigger lockout
    const lockDuration = this.getLockoutDuration(record.count);
    if (lockDuration > 0) {
      record.lockedUntil = Date.now() + lockDuration;
      this.attempts.set(this.deviceId, record);

      return {
        allowed: false,
        waitTime: lockDuration,
        lockDuration: this.formatDuration(lockDuration, lang)
      };
    }

    this.attempts.set(this.deviceId, record);

    // Return remaining attempts
    const remainingAttempts = Math.max(0, this.getAttemptsBeforeLockout(record.count) - record.count);
    return {
      allowed: true,
      waitTime: 0,
      remainingAttempts
    };
  }

  // Clear successful attempt (reset counter)
  clearFailedAttempts(): void {
    this.attempts.delete(this.deviceId);
  }

  // Get current lockout status
  getLockoutStatus(lang: string = 'tr'): RateLimitResult {
    const record = this.attempts.get(this.deviceId);
    if (!record || Date.now() >= record.lockedUntil) {
      return { allowed: true, waitTime: 0 };
    }

    const remainingTime = record.lockedUntil - Date.now();
    return {
      allowed: false,
      waitTime: remainingTime,
      lockDuration: this.formatDuration(remainingTime, lang)
    };
  }

  // Calculate progressive delay between attempts
  private calculateDelay(attempts: number): number {
    if (attempts <= 3) return 0; // No delay for first 3 attempts
    if (attempts <= 5) return 5000; // 5 seconds
    if (attempts <= 7) return 30000; // 30 seconds
    return 900000; // 15 minutes for 8+ attempts
  }

  // Get lockout duration based on attempt count
  private getLockoutDuration(attempts: number): number {
    if (attempts === 5) return 5 * 60 * 1000; // 5 minutes
    if (attempts === 10) return 60 * 60 * 1000; // 1 hour
    if (attempts >= 15) return 24 * 60 * 60 * 1000; // 24 hours
    return 0; // No lockout
  }

  // Get attempts count before triggering lockout
  private getAttemptsBeforeLockout(currentAttempts: number): number {
    if (currentAttempts < 5) return 5;
    if (currentAttempts < 10) return 10;
    return 15; // Final threshold before 24hr lock
  }

  // Format duration to human readable string
  private formatDuration(ms: number, lang: string = 'tr'): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (lang === 'en') {
      if (days > 0) return `${days} days`;
      if (hours > 0) return `${hours} hours`;
      if (minutes > 0) return `${minutes} minutes`;
      return `${seconds} seconds`;
    } else {
      if (days > 0) return `${days} gün`;
      if (hours > 0) return `${hours} saat`;
      if (minutes > 0) return `${minutes} dakika`;
      return `${seconds} saniye`;
    }
  }

  // Get device fingerprint for tracking
  private getDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas?.toDataURL(),
      !!(window as any).chrome,
      !!(window as any).opr
    ].join('|');

    return this.simpleHash(fingerprint);
  }

  // Simple hash function for device ID
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Export singleton instance
let rateLimiterInstance: EnhancedRateLimiter | null = null;

export const getRateLimiter = (deviceId?: string): EnhancedRateLimiter => {
  if (!rateLimiterInstance) {
    const defaultDeviceId = deviceId || 'default-device';
    rateLimiterInstance = new EnhancedRateLimiter(defaultDeviceId);
  }
  return rateLimiterInstance;
};

// Utility functions for React components
export const checkLoginAttempts = async (deviceId?: string, lang: string = 'tr'): Promise<RateLimitResult> => {
  const limiter = getRateLimiter(deviceId);
  return await limiter.checkAttempt(lang);
};

export const recordFailedLogin = (deviceId?: string, lang: string = 'tr'): RateLimitResult => {
  const limiter = getRateLimiter(deviceId);
  return limiter.recordFailedAttempt(lang);
};

export const clearFailedLogins = (deviceId?: string): void => {
  const limiter = getRateLimiter(deviceId);
  limiter.clearFailedAttempts();
};

export const getLockoutStatus = (deviceId?: string, lang: string = 'tr'): RateLimitResult => {
  const limiter = getRateLimiter(deviceId);
  return limiter.getLockoutStatus(lang);
};
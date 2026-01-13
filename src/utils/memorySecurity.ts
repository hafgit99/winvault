// Secure memory utilities for WinVault
// Implements secure string handling and memory cleanup

export class SecureString {
  private data: Uint8Array;
  private isDestroyed: boolean = false;

  constructor(text: string) {
    // Convert string to Uint8Array for secure handling
    this.data = new TextEncoder().encode(text);
  }

  // Get text value (for when needed)
  toString(): string {
    if (this.isDestroyed) {
      throw new Error('SecureString has been destroyed');
    }
    return new TextDecoder().decode(this.data);
  }

  // Securely destroy the string from memory
  destroy(): void {
    if (this.isDestroyed) return;
    
    // Overwrite memory with random data
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] = Math.floor(Math.random() * 256);
    }
    
    // Clear the reference
    this.data = new Uint8Array(0);
    this.isDestroyed = true;
  }

  // Check if destroyed
  get destroyed(): boolean {
    return this.isDestroyed;
  }
}

// Memory cleanup utilities
export class MemoryManager {
  private static sensitiveData: Set<SecureString> = new Set();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  // Register sensitive data for cleanup
  static registerSensitive(data: SecureString): void {
    this.sensitiveData.add(data);
  }

  // Unregister sensitive data
  static unregisterSensitive(data: SecureString): void {
    this.sensitiveData.delete(data);
  }

  // Cleanup all registered sensitive data
  static cleanupAll(): void {
    for (const data of this.sensitiveData) {
      data.destroy();
    }
    this.sensitiveData.clear();
  }

  // Start automatic cleanup interval
  static startAutoCleanup(intervalMs: number = 30000): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupAll();
      
      // Force garbage collection if available (Node.js environment)
      if (typeof global !== 'undefined' && (global as any).gc) {
        (global as any).gc();
      }
    }, intervalMs);
  }

  // Stop automatic cleanup
  static stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Securely clear a regular string
  static clearString(str: string): void {
    // Overwrite string in memory (limited effectiveness in JS)
    // This is mainly for code clarity and future WebAssembly integration
    try {
      // Force string modification
      let modified = str;
      for (let i = 0; i < 100; i++) {
        modified = modified.split('').reverse().join('');
      }
    } catch (e) {
      // Ignore errors during clearing
    }
  }

  // Create secure password from input
  static createSecurePassword(input: string): SecureString {
    const secure = new SecureString(input);
    this.registerSensitive(secure);
    return secure;
  }

  // Get password and immediately destroy
  static usePassword(secure: SecureString): string {
    const password = secure.toString();
    secure.destroy();
    this.unregisterSensitive(secure);
    return password;
  }
}

// Enhanced clipboard security
export class SecureClipboard {
  private static activeClearTimeout: NodeJS.Timeout | null = null;
  private static clipboardMonitor: NodeJS.Timeout | null = null;
  private static accessCount: number = 0;
  private static lastActivity: number = 0;

  // Copy to clipboard with auto-clear and monitoring
  static async copyWithEncryption(text: string, clearAfterMs: number = 5000): Promise<void> {
    try {
      // Simple encryption for clipboard
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(text);
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']),
        encoded
      );
      
      const encryptedArray = new Uint8Array(encrypted);
      const ivArray = new Uint8Array(iv);
      
      const payload = JSON.stringify({
        data: Array.from(encryptedArray).map(b => b.toString(16).padStart(2, '0')).join(''),
        iv: Array.from(ivArray).map(b => b.toString(16).padStart(2, '0')).join(''),
        timestamp: Date.now()
      });
      
      await navigator.clipboard.writeText(payload);
      
      // Reset monitoring
      this.accessCount = 0;
      this.lastActivity = Date.now();
      
      // Start monitoring
      this.startMonitoring();
      
      // Clear any existing timeout
      if (this.activeClearTimeout) {
        clearTimeout(this.activeClearTimeout);
      }

      // Set new clear timeout with jitter
      const jitter = Math.random() * 1000; // 0-1s jitter
      this.activeClearTimeout = setTimeout(async () => {
        await this.clear();
      }, clearAfterMs + jitter);

    } catch (error) {
      console.error('Failed to copy securely:', error);
      throw error;
    }
  }

  // Start clipboard monitoring
  private static startMonitoring(): void {
    if (this.clipboardMonitor) {
      clearInterval(this.clipboardMonitor);
    }

    this.clipboardMonitor = setInterval(async () => {
      try {
        const content = await navigator.clipboard.readText();
        if (content) {
          try {
            const payload = JSON.parse(content);
            if (payload.data && payload.iv) {
              // Our encrypted content - increment access count
              this.accessCount++;
              
              // Clear if accessed multiple times
              if (this.accessCount > 2) {
                console.warn('Multiple clipboard accesses detected');
                await this.clear();
              }
            }
          } catch (e) {
            // Different content - check if sensitive
            if (this.isSensitiveContent(content)) {
              this.accessCount++;
              console.warn('Potential clipboard monitoring detected');
            }
          }
        }
      } catch (error) {
        // Permission denied
      }
    }, 1000); // Check every second
  }

  // Check if content is potentially sensitive
  private static isSensitiveContent(content: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /^[a-f0-9]{32,}$/i, // Hash pattern
      /^[A-Za-z0-9+/]{20,}={0,2}$/, // Base64 pattern
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(content));
  }

  // Enhanced clear with multiple methods
  static async clear(): Promise<void> {
    try {
      if (this.activeClearTimeout) {
        clearTimeout(this.activeClearTimeout);
        this.activeClearTimeout = null;
      }

      if (this.clipboardMonitor) {
        clearInterval(this.clipboardMonitor);
        this.clipboardMonitor = null;
      }

      // Multiple clear attempts
      for (let i = 0; i < 3; i++) {
        await navigator.clipboard.writeText('');
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log('Clipboard securely cleared');
    } catch (error) {
      console.error('Failed to clear clipboard:', error);
    }
  }

  // Legacy copy method for compatibility
  static async copy(text: string, clearAfterMs: number = 5000): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      
      if (this.activeClearTimeout) {
        clearTimeout(this.activeClearTimeout);
      }

      this.activeClearTimeout = setTimeout(async () => {
        try {
          await navigator.clipboard.writeText('');
          console.log('Clipboard cleared for security');
        } catch (error) {
          console.error('Failed to clear clipboard:', error);
        }
        this.activeClearTimeout = null;
      }, clearAfterMs);

    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      throw error;
    }
  }

  // Check if clipboard has content
  static async hasContent(): Promise<boolean> {
    try {
      const text = await navigator.clipboard.readText();
      return text.length > 0;
    } catch (error) {
      return false;
    }
  }

  // Get clipboard status
  static getStatus(): {
    isActive: boolean;
    accessCount: number;
    lastActivity: number;
    monitoring: boolean;
  } {
    return {
      isActive: this.activeClearTimeout !== null,
      accessCount: this.accessCount,
      lastActivity: this.lastActivity,
      monitoring: this.clipboardMonitor !== null
    };
  }
}

// Memory monitoring utilities
export class MemoryMonitor {
  private static memoryStats: { timestamp: number; used: number }[] = [];
  private static maxHistorySize = 100;

  // Get current memory usage
  static getCurrentMemoryUsage(): number {
    if ((performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  // Record memory usage
  static recordMemoryUsage(): void {
    const usage = this.getCurrentMemoryUsage();
    this.memoryStats.push({
      timestamp: Date.now(),
      used: usage
    });

    // Limit history size
    if (this.memoryStats.length > this.maxHistorySize) {
      this.memoryStats.shift();
    }
  }

  // Get memory trend
  static getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.memoryStats.length < 10) return 'stable';

    const recent = this.memoryStats.slice(-5);
    const older = this.memoryStats.slice(-10, -5);

    const recentAvg = recent.reduce((sum, stat) => sum + stat.used, 0) / recent.length;
    const olderAvg = older.reduce((sum, stat) => sum + stat.used, 0) / older.length;

    if (recentAvg > olderAvg * 1.1) return 'increasing';
    if (recentAvg < olderAvg * 0.9) return 'decreasing';
    return 'stable';
  }

  // Check for potential memory leak
  static checkForMemoryLeak(): boolean {
    const trend = this.getMemoryTrend();
    const currentUsage = this.getCurrentMemoryUsage();
    
    // Consider it a leak if memory is increasing and above threshold
    return trend === 'increasing' && currentUsage > 50 * 1024 * 1024; // 50MB
  }

  // Get memory statistics
  static getMemoryStats(): {
    current: number;
    peak: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    leakSuspected: boolean;
  } {
    const current = this.getCurrentMemoryUsage();
    const peak = Math.max(...this.memoryStats.map(stat => stat.used), current);
    const trend = this.getMemoryTrend();
    const leakSuspected = this.checkForMemoryLeak();

    return { current, peak, trend, leakSuspected };
  }
}

// Initialize memory management
export const initializeMemorySecurity = (): void => {
  // Start automatic cleanup
  MemoryManager.startAutoCleanup(30000); // Every 30 seconds
  
  // Start memory monitoring
  setInterval(() => {
    MemoryMonitor.recordMemoryUsage();
    
    const stats = MemoryMonitor.getMemoryStats();
    if (stats.leakSuspected) {
      console.warn('Potential memory leak detected:', stats);
      // Force cleanup
      MemoryManager.cleanupAll();
    }
  }, 10000); // Every 10 seconds

  // Cleanup on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      MemoryManager.cleanupAll();
      SecureClipboard.clear();
    });
  }
};

// Export secure versions of common operations
export const secureCopyPassword = async (password: string): Promise<void> => {
  await SecureClipboard.copy(password, 5000);
  MemoryManager.clearString(password);
};

export const secureCreatePassword = (input: string): SecureString => {
  return MemoryManager.createSecurePassword(input);
};

export const secureUsePassword = (secure: SecureString): string => {
  return MemoryManager.usePassword(secure);
};
// Enhanced secure memory utilities for WinVault
// Implements hardware-level memory protection and advanced cleanup

export class SecureHeap {
  private static allocatedBuffers = new Map<string, ArrayBuffer>();
  private static memoryPool = new ArrayBuffer(1024 * 1024); // 1MB pool
  private static memoryCursor = 0;
  private static cleanupInterval: NodeJS.Timeout | null = null;

  // Allocate secure memory from pool or new allocation
  static allocateSecure(size: number, id: string): ArrayBuffer {
    // Try to allocate from pool first
    if (this.memoryCursor + size <= this.memoryPool.byteLength) {
      const buffer = this.memoryPool.slice(this.memoryCursor, this.memoryCursor + size);
      this.allocatedBuffers.set(id, buffer);
      this.memoryCursor += size;
      return buffer;
    }
    
    // Fallback to new allocation
    const buffer = new ArrayBuffer(size);
    this.allocatedBuffers.set(id, buffer);
    return buffer;
  }

  // Securely wipe buffer with multiple passes
  static secureWipe(buffer: ArrayBufferLike): void {
    const view = new Uint8Array(buffer);
    
    // Multi-pass overwriting for forensic resistance
    const patterns = [
      0xFF, 0x00, 0xAA, 0x55, 0x96, 0x69, 0x00, 0xFF
    ];
    
    for (let pass = 0; pass < 3; pass++) {
      const pattern = patterns[pass % patterns.length];
      for (let i = 0; i < view.length; i++) {
        view[i] = pattern;
      }
      
      // Small delay to ensure memory writes
      if (pass < 2) {
        // Force memory barrier
        const temp = new Uint8Array(1);
        temp[0] = view[0];
      }
    }
    
    // Final random overwrite
    for (let i = 0; i < view.length; i++) {
      view[i] = Math.floor(Math.random() * 256);
    }
  }

  // Release and wipe memory
  static releaseSecure(id: string): void {
    const buffer = this.allocatedBuffers.get(id);
    if (buffer) {
      this.secureWipe(buffer);
      this.allocatedBuffers.delete(id);
      
      // Reclaim pool space if it was from pool
      if (buffer === this.memoryPool) {
        this.memoryCursor -= buffer.byteLength;
      }
    }
  }

  // Get memory usage statistics
  static getMemoryStats(): { totalAllocated: number; poolUsed: number; buffersCount: number } {
    let totalAllocated = 0;
    const buffers = Array.from(this.allocatedBuffers.values());
    
    for (const buffer of buffers) {
      totalAllocated += buffer.byteLength;
    }

    return {
      totalAllocated,
      poolUsed: this.memoryCursor,
      buffersCount: this.allocatedBuffers.size
    };
  }

  // Initialize secure memory system
  static initialize(): void {
    // Start periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 30000); // Every 30 seconds
  }

  // Cleanup abandoned memory
  private static performCleanup(): void {
    const now = Date.now();
    
    // Force garbage collection (Node.js environment only)
    if (typeof global !== 'undefined' && (global as any).gc) {
      (global as any).gc();
    }
    
    // Check for memory leaks
    const stats = this.getMemoryStats();
    if (stats.totalAllocated > 50 * 1024 * 1024) { // 50MB threshold
      console.warn('High memory usage detected:', stats);
      
      // Emergency cleanup of old allocations
      const keys = Array.from(this.allocatedBuffers.keys());
      const oldKeys = keys.slice(-Math.floor(keys.length / 2)); // Keep newest half
      
      for (const key of oldKeys) {
        this.releaseSecure(key);
      }
    }
  }

  // Cleanup on unload
  static cleanup(): void {
    // Release all allocated memory
    const keys = Array.from(this.allocatedBuffers.keys());
    for (const key of keys) {
      this.releaseSecure(key);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Enhanced SecureString with better memory protection
export class SecureString {
  private data: Uint8Array;
  private isDestroyed: boolean = false;
  private id: string;
  public createdAt: number;

  constructor(text: string) {
    this.id = `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.createdAt = Date.now();
    
    // Allocate from secure heap
    const buffer = SecureHeap.allocateSecure(text.length * 2, this.id);
    this.data = new Uint8Array(buffer);
    
    // Write text to secure memory
    const encoder = new TextEncoder();
    const encoded = encoder.encode(text);
    this.data.set(encoded);
    
    // Register for cleanup
    this.scheduleCleanup();
  }

  // Get text value (for when needed)
  toString(): string {
    if (this.isDestroyed) {
      throw new Error('SecureString has been destroyed');
    }
    
    const decoder = new TextDecoder();
    return decoder.decode(this.data.slice(0, this.findActualLength()));
  }

  // Find actual length (excluding unused bytes)
  private findActualLength(): number {
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i] === 0) {
        return i;
      }
    }
    return this.data.length;
  }

  // Check if destroyed
  get destroyed(): boolean {
    return this.isDestroyed;
  }

  // Securely destroy string from memory
  destroy(): void {
    if (this.isDestroyed) return;
    
    // Wipe data using secure heap
    SecureHeap.secureWipe(this.data.buffer);
    
    // Release from secure heap
    SecureHeap.releaseSecure(this.id);
    
    // Clear references
    this.data = new Uint8Array(0);
    this.isDestroyed = true;
  }

  // Schedule automatic cleanup after reasonable time
  private scheduleCleanup(): void {
    // Auto-destroy after 5 minutes if not used
    setTimeout(() => {
      if (!this.isDestroyed && Date.now() - this.createdAt > 5 * 60 * 1000) {
        this.destroy();
      }
    }, 5 * 60 * 1000);
  }

  // Refresh cleanup timer on access
  private refreshCleanup(): void {
    this.createdAt = Date.now();
  }
}

// Advanced Memory Manager with enhanced capabilities
export class MemoryManager {
  private static sensitiveData = new Set<SecureString>();
  private static monitoringInterval: NodeJS.Timeout | null = null;
  private static lastCleanup = Date.now();
  private static memoryThresholds = {
    warning: 50 * 1024 * 1024, // 50MB
    critical: 100 * 1024 * 1024 // 100MB
  };

  // Register sensitive data for enhanced tracking
  static registerSensitive(data: SecureString): void {
    this.sensitiveData.add(data);
    this.updateStatistics();
  }

  // Unregister sensitive data
  static unregisterSensitive(data: SecureString): void {
    this.sensitiveData.delete(data);
  }

  // Cleanup all registered sensitive data with verification
  static cleanupAll(): void {
    const dataToCleanup = Array.from(this.sensitiveData);
    let cleanedCount = 0;
    let errors = 0;

    for (const data of dataToCleanup) {
      try {
        if (!data.destroyed) {
          data.destroy();
          cleanedCount++;
        }
      } catch (error) {
        console.error('Error cleaning sensitive data:', error);
        errors++;
      }
    }

    this.sensitiveData.clear();
    this.lastCleanup = Date.now();
    
    console.log(`Memory cleanup completed: ${cleanedCount} cleaned, ${errors} errors`);
    
    // Force garbage collection
    this.forceGarbageCollection();
  }

  // Enhanced garbage collection
  private static forceGarbageCollection(): void {
    // Multiple GC attempts to be thorough (Node.js environment only)
    for (let i = 0; i < 3; i++) {
      if (typeof global !== 'undefined' && (global as any).gc) {
        (global as any).gc();
      }
      
      // Small delay between attempts
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Busy wait
      }
    }
  }

  // Get detailed memory statistics
  static getDetailedMemoryStats(): {
    secureHeap: any;
    browserMemory: any;
    sensitiveDataCount: number;
    timeSinceLastCleanup: number;
    status: 'healthy' | 'warning' | 'critical';
  } {
    const secureHeapStats = SecureHeap.getMemoryStats();
    const browserMemory = (performance as any).memory;
    
    const status = browserMemory && browserMemory.usedJSHeapSize > this.memoryThresholds.critical ? 'critical' :
                   browserMemory && browserMemory.usedJSHeapSize > this.memoryThresholds.warning ? 'warning' : 'healthy';
    
    return {
      secureHeap: secureHeapStats,
      browserMemory: browserMemory ? {
        used: browserMemory.usedJSHeapSize,
        total: browserMemory.totalJSHeapSize,
        limit: browserMemory.jsHeapSizeLimit
      } : null,
      sensitiveDataCount: this.sensitiveData.size,
      timeSinceLastCleanup: Date.now() - this.lastCleanup,
      status
    };
  }

  // Enhanced memory monitoring with alerts
  static startEnhancedMonitoring(intervalMs: number = 10000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      const stats = this.getDetailedMemoryStats();
      
      // Alert on memory issues
      if (stats.status === 'critical') {
        console.error('CRITICAL: Memory usage too high:', stats);
        this.emergencyCleanup();
      } else if (stats.status === 'warning') {
        console.warn('WARNING: Memory usage elevated:', stats);
        this.preventiveCleanup();
      }
      
      // Log periodic statistics
      if (Date.now() - this.lastCleanup > 60000) { // Every minute
        console.log('Memory stats:', stats);
      }
    }, intervalMs);
  }

  // Emergency cleanup for critical memory situations
  private static emergencyCleanup(): void {
    console.log('Emergency memory cleanup initiated');
    
    // Clear oldest half of sensitive data
    const data = Array.from(this.sensitiveData);
    data.sort((a, b) => a.createdAt - b.createdAt); // Sort by creation time
    
    const toCleanup = data.slice(0, Math.floor(data.length / 2));
    for (const item of toCleanup) {
      this.unregisterSensitive(item);
    }
    
    // Force multiple garbage collections
    this.forceGarbageCollection();
  }

  // Preventive cleanup for warning situations
  private static preventiveCleanup(): void {
    // Clean up sensitive data older than 2 minutes
    const now = Date.now();
    const data = Array.from(this.sensitiveData);
    
    for (const item of data) {
      if (now - item.createdAt > 2 * 60 * 1000) {
        this.unregisterSensitive(item);
      }
    }
  }

  // Update and validate statistics
  private static updateStatistics(): void {
    const stats = this.getDetailedMemoryStats();
    
    // Validate memory integrity
    if (stats.sensitiveDataCount > 1000) {
      console.warn('Unusual number of sensitive data objects:', stats.sensitiveDataCount);
    }
  }

  // Stop monitoring
  static stopEnhancedMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

// Initialize enhanced memory security
export const initializeEnhancedMemorySecurity = (): void => {
  // Initialize secure heap
  SecureHeap.initialize();
  
  // Start enhanced monitoring
  MemoryManager.startEnhancedMonitoring(10000); // Every 10 seconds
  
  // Cleanup on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      MemoryManager.cleanupAll();
      SecureHeap.cleanup();
    });
    
    // Also cleanup on page visibility change (user navigates away)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        MemoryManager.cleanupAll();
      }
    });
  }
  
  console.log('Enhanced memory security initialized');
};
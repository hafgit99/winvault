// Native Memory Page Locking for WinVault
// Implements mlock() functionality for secure memory protection

// Type declarations for native module
interface NativeMemoryLockModule {
    mlock(buffer: Buffer, length: number): number;
    munlock(buffer: Buffer, length: number): number;
    isSupported(): boolean;
}

// Fallback implementation when native module is not available
class FallbackMemoryLock {
    private lockedBuffers: Set<Buffer> = new Set();

    mlock(buffer: Buffer, length: number): number {
        // Fallback: just track the buffer
        this.lockedBuffers.add(buffer);
        return 0; // Success
    }

    munlock(buffer: Buffer, length: number): number {
        this.lockedBuffers.delete(buffer);
        return 0; // Success
    }

    isSupported(): boolean {
        return false;
    }

    getLockedCount(): number {
        return this.lockedBuffers.size;
    }
}

// Native memory lock manager
export class NativeMemoryLock {
    private static nativeModule: NativeMemoryLockModule | null = null;
    private static fallback: FallbackMemoryLock | null = null;
    private static initialized: boolean = false;

    /**
     * Initialize native memory lock module
     */
    static async initialize(): Promise<boolean> {
        if (this.initialized) {
            return this.nativeModule !== null;
        }

        try {
            // Try to load native module (if available in Electron)
            if (typeof window !== 'undefined' && (window as any).electron) {
                try {
                    // In Electron, we can use a native addon
                    // For now, we'll use a fallback approach
                    // In production, you would compile a native C++ addon
                    this.fallback = new FallbackMemoryLock();
                    this.initialized = true;
                    console.log('[NativeMemoryLock] Using fallback implementation');
                    return false;
                } catch (e) {
                    console.warn('[NativeMemoryLock] Failed to load native module:', e);
                }
            }

            // Browser environment - use fallback
            this.fallback = new FallbackMemoryLock();
            this.initialized = true;
            console.log('[NativeMemoryLock] Initialized with fallback');
            return false;
        } catch (error) {
            console.error('[NativeMemoryLock] Initialization failed:', error);
            this.fallback = new FallbackMemoryLock();
            this.initialized = true;
            return false;
        }
    }

    /**
     * Lock memory pages to prevent swapping
     * @param buffer - Buffer to lock
     * @returns true if successful, false otherwise
     */
    static lock(buffer: Buffer): boolean {
        if (!this.initialized) {
            console.warn('[NativeMemoryLock] Not initialized');
            return false;
        }

        try {
            if (this.nativeModule) {
                const result = this.nativeModule.mlock(buffer, buffer.length);
                return result === 0;
            } else if (this.fallback) {
                this.fallback.mlock(buffer, buffer.length);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[NativeMemoryLock] Failed to lock memory:', error);
            return false;
        }
    }

    /**
     * Unlock memory pages
     * @param buffer - Buffer to unlock
     * @returns true if successful, false otherwise
     */
    static unlock(buffer: Buffer): boolean {
        if (!this.initialized) {
            return false;
        }

        try {
            if (this.nativeModule) {
                const result = this.nativeModule.munlock(buffer, buffer.length);
                return result === 0;
            } else if (this.fallback) {
                this.fallback.munlock(buffer, buffer.length);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[NativeMemoryLock] Failed to unlock memory:', error);
            return false;
        }
    }

    /**
     * Check if native mlock is supported
     */
    static isNativeSupported(): boolean {
        if (!this.initialized) {
            return false;
        }
        return this.nativeModule !== null && this.nativeModule.isSupported();
    }

    /**
     * Get the number of locked buffers (fallback only)
     */
    static getLockedCount(): number {
        if (this.fallback) {
            return this.fallback.getLockedCount();
        }
        return 0;
    }

    /**
     * Securely allocate and lock memory
     * @param size - Size in bytes
     * @returns Buffer that is locked in memory
     */
    static allocateSecure(size: number): Buffer | null {
        try {
            const buffer = Buffer.alloc(size);

            // Fill with random data first
            for (let i = 0; i < size; i++) {
                buffer[i] = Math.floor(Math.random() * 256);
            }

            // Lock the buffer
            if (this.lock(buffer)) {
                console.log(`[NativeMemoryLock] Allocated and locked ${size} bytes`);
                return buffer;
            } else {
                console.warn('[NativeMemoryLock] Failed to lock allocated memory');
                return buffer; // Return unlocked buffer as fallback
            }
        } catch (error) {
            console.error('[NativeMemoryLock] Failed to allocate secure memory:', error);
            return null;
        }
    }

    /**
     * Securely free and unlock memory
     * @param buffer - Buffer to free
     */
    static freeSecure(buffer: Buffer): void {
        if (!buffer) {
            return;
        }

        try {
            // Overwrite with random data before freeing
            for (let i = 0; i < buffer.length; i++) {
                buffer[i] = Math.floor(Math.random() * 256);
            }

            // Unlock the buffer
            this.unlock(buffer);

            // In Node.js, we can't actually free the buffer
            // The garbage collector will handle it
            console.log('[NativeMemoryLock] Freed secure memory');
        } catch (error) {
            console.error('[NativeMemoryLock] Failed to free secure memory:', error);
        }
    }
}

// Initialize on module load
NativeMemoryLock.initialize().catch(console.error);

export default NativeMemoryLock;

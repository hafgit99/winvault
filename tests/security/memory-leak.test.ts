/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SecureString, MemoryManager, MemoryMonitor } from '../../src/utils/memorySecurity';
import { encryptData, decryptData } from '../../src/utils';

// Helper functions for memory testing
function getMemoryUsage(): number {
    if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
}

async function forceGC(): Promise<void> {
    // Force garbage collection if available
    if (typeof global !== 'undefined' && (global as any).gc) {
        (global as any).gc();
    }

    // Wait a bit for GC to complete
    await new Promise(resolve => setTimeout(resolve, 100));
}

describe('Memory Leak Tests', () => {
    beforeEach(() => {
        // Reset MemoryMonitor state
        MemoryMonitor['memoryStats'] = [];
    });

    afterEach(() => {
        MemoryManager.stopAutoCleanup();
        MemoryManager.cleanupAll();
    });

    describe('Encryption Operations Memory Leak', () => {
        it('should not leak memory after 1000 encrypt operations', async () => {
            const initialMemory = getMemoryUsage();

            // Perform 1000 encryption operations
            for (let i = 0; i < 1000; i++) {
                const data = { test: 'data', index: i };
                await encryptData(data, 'test-password');
            }

            // Force garbage collection if available
            await forceGC();

            const finalMemory = getMemoryUsage();
            const leak = finalMemory - initialMemory;

            // Memory leak should be less than 5MB
            expect(leak).toBeLessThan(5 * 1024 * 1024);
        });

        it('should not leak memory after 1000 decrypt operations', async () => {
            const encrypted = await encryptData({ test: 'data' }, 'test-password');
            const initialMemory = getMemoryUsage();

            // Perform 1000 decryption operations
            for (let i = 0; i < 1000; i++) {
                await decryptData(encrypted, 'test-password');
            }

            await forceGC();

            const finalMemory = getMemoryUsage();
            const leak = finalMemory - initialMemory;

            expect(leak).toBeLessThan(5 * 1024 * 1024);
        });

        it('should not leak memory after mixed encrypt/decrypt operations', async () => {
            const initialMemory = getMemoryUsage();

            // Perform 500 encrypt + decrypt cycles
            for (let i = 0; i < 500; i++) {
                const data = { test: 'data', index: i };
                const encrypted = await encryptData(data, 'test-password');
                await decryptData(encrypted, 'test-password');
            }

            await forceGC();

            const finalMemory = getMemoryUsage();
            const leak = finalMemory - initialMemory;

            expect(leak).toBeLessThan(10 * 1024 * 1024);
        });
    });

    describe('SecureString Memory Leak', () => {
        it('should not leak memory after creating and destroying 1000 SecureStrings', async () => {
            const initialMemory = getMemoryUsage();

            // Create and destroy 1000 SecureStrings
            for (let i = 0; i < 1000; i++) {
                const secure = new SecureString(`secret-${i}`);
                secure.destroy();
            }

            await forceGC();

            const finalMemory = getMemoryUsage();
            const leak = finalMemory - initialMemory;

            expect(leak).toBeLessThan(2 * 1024 * 1024);
        });

        it('should not leak memory when SecureString is not destroyed', async () => {
            const initialMemory = getMemoryUsage();

            // Create 100 SecureStrings without destroying
            const strings: SecureString[] = [];
            for (let i = 0; i < 100; i++) {
                strings.push(new SecureString(`secret-${i}`));
            }

            await forceGC();

            const midMemory = getMemoryUsage();
            const leak1 = midMemory - initialMemory;

            // Now destroy them
            for (const str of strings) {
                str.destroy();
            }

            await forceGC();

            const finalMemory = getMemoryUsage();
            const leak2 = finalMemory - midMemory;

            // Memory should decrease after destruction
            expect(leak2).toBeLessThan(0);
        });

        it('should properly clean up SecureString data', () => {
            const secure = new SecureString('sensitive-data');

            // Access private data to verify zeroing
            const internalData = (secure as any).data;
            const originalLength = internalData.length;

            expect(originalLength).toBeGreaterThan(0);

            secure.destroy();

            const destroyedData = (secure as any).data;
            expect(destroyedData.length).toBe(0);
            expect(secure.destroyed).toBe(true);
        });
    });

    describe('MemoryManager Memory Leak', () => {
        it('should not leak memory after registering and unregistering 1000 items', async () => {
            const initialMemory = getMemoryUsage();

            // Register and unregister 1000 items
            for (let i = 0; i < 1000; i++) {
                const secure = new SecureString(`secret-${i}`);
                MemoryManager.registerSensitive(secure);
                MemoryManager.unregisterSensitive(secure);
            }

            await forceGC();

            const finalMemory = getMemoryUsage();
            const leak = finalMemory - initialMemory;

            expect(leak).toBeLessThan(2 * 1024 * 1024);
        });

        it('should properly cleanup all registered items', () => {
            // Register 100 items
            const items: SecureString[] = [];
            for (let i = 0; i < 100; i++) {
                const secure = new SecureString(`secret-${i}`);
                items.push(secure);
                MemoryManager.registerSensitive(secure);
            }

            // Verify all are registered
            expect((MemoryManager as any).sensitiveData.size).toBe(100);

            // Cleanup all
            MemoryManager.cleanupAll();

            // Verify all are destroyed
            for (const item of items) {
                expect(item.destroyed).toBe(true);
            }

            // Verify set is empty
            expect((MemoryManager as any).sensitiveData.size).toBe(0);
        });

        it('should not leak memory after auto-cleanup cycles', async () => {
            vi.useFakeTimers();

            const initialMemory = getMemoryUsage();

            // Register 50 items
            for (let i = 0; i < 50; i++) {
                const secure = new SecureString(`secret-${i}`);
                MemoryManager.registerSensitive(secure);
            }

            // Run 10 auto-cleanup cycles
            MemoryManager.startAutoCleanup(100);
            for (let i = 0; i < 10; i++) {
                vi.advanceTimersByTime(110);
            }

            vi.useRealTimers();
            await forceGC();

            const finalMemory = getMemoryUsage();
            const leak = finalMemory - initialMemory;

            expect(leak).toBeLessThan(1 * 1024 * 1024);
        });
    });

    describe('MemoryMonitor Memory Leak', () => {
        it('should not leak memory after 10000 memory recordings', async () => {
            const initialMemory = getMemoryUsage();

            // Record memory 10000 times
            for (let i = 0; i < 10000; i++) {
                MemoryMonitor.recordMemoryUsage();
            }

            await forceGC();

            const finalMemory = getMemoryUsage();
            const leak = finalMemory - initialMemory;

            // Should not leak more than 1MB
            expect(leak).toBeLessThan(1 * 1024 * 1024);
        });

        it('should properly limit history size', () => {
            // Record more than maxHistorySize
            for (let i = 0; i < 200; i++) {
                MemoryMonitor.recordMemoryUsage();
            }

            // History should be limited to 100
            expect(MemoryMonitor['memoryStats'].length).toBeLessThanOrEqual(100);
        });

        it('should correctly detect memory trends', () => {
            // Record memory with increasing trend
            for (let i = 0; i < 20; i++) {
                // Simulate increasing memory
                MemoryMonitor['memoryStats'].push({
                    timestamp: Date.now(),
                    used: 10000000 + (i * 1000000)
                });
            }

            const trend = MemoryMonitor.getMemoryTrend();
            expect(trend).toBe('increasing');
        });

        it('should correctly detect memory leaks', () => {
            // Record memory with increasing trend above threshold
            for (let i = 0; i < 20; i++) {
                MemoryMonitor['memoryStats'].push({
                    timestamp: Date.now(),
                    used: 60 * 1024 * 1024 + (i * 5 * 1024 * 1024)
                });
            }

            const isLeaking = MemoryMonitor.checkForMemoryLeak();
            expect(isLeaking).toBe(true);
        });
    });

    describe('Large Data Memory Leak', () => {
        it('should not leak memory with large data objects', async () => {
            const initialMemory = getMemoryUsage();

            // Create large data objects (1MB each)
            for (let i = 0; i < 100; i++) {
                const largeData = {
                    data: 'x'.repeat(1024 * 1024), // 1MB string
                    index: i,
                    metadata: { key: 'value'.repeat(100) }
                };
                await encryptData(largeData, 'test-password');
            }

            await forceGC();

            const finalMemory = getMemoryUsage();
            const leak = finalMemory - initialMemory;

            // Should not leak more than 10MB after processing 100MB of data
            expect(leak).toBeLessThan(10 * 1024 * 1024);
        });

        it('should not leak memory with many small objects', async () => {
            const initialMemory = getMemoryUsage();

            // Create 10000 small objects
            for (let i = 0; i < 10000; i++) {
                const smallData = {
                    id: i,
                    value: `test-${i}`
                };
                await encryptData(smallData, 'test-password');
            }

            await forceGC();

            const finalMemory = getMemoryUsage();
            const leak = finalMemory - initialMemory;

            expect(leak).toBeLessThan(20 * 1024 * 1024);
        });
    });

    describe('Stress Test Memory Leak', () => {
        it('should not leak memory under heavy load', async () => {
            const initialMemory = getMemoryUsage();

            // Simulate heavy usage: encryption + SecureString + clipboard
            for (let i = 0; i < 500; i++) {
                // Encrypt
                const data = { test: 'data', index: i };
                await encryptData(data, 'test-password');

                // Create SecureString
                const secure = new SecureString(`password-${i}`);
                MemoryManager.registerSensitive(secure);

                // Record memory
                MemoryMonitor.recordMemoryUsage();

                // Cleanup
                secure.destroy();
                MemoryManager.unregisterSensitive(secure);
            }

            await forceGC();

            const finalMemory = getMemoryUsage();
            const leak = finalMemory - initialMemory;

            expect(leak).toBeLessThan(15 * 1024 * 1024);
        });

        it('should maintain stable memory over time', async () => {
            const memorySnapshots: number[] = [];

            // Take 10 snapshots over time
            for (let cycle = 0; cycle < 10; cycle++) {
                // Do some work
                for (let i = 0; i < 100; i++) {
                    const data = { test: 'data', index: cycle * 100 + i };
                    await encryptData(data, 'test-password');
                }

                await forceGC();

                // Record memory
                const mem = getMemoryUsage();
                memorySnapshots.push(mem);
            }

            // Check if memory is stable (variance < 20%)
            const avg = memorySnapshots.reduce((a, b) => a + b, 0) / memorySnapshots.length;
            const maxDeviation = Math.max(...memorySnapshots.map(m => Math.abs(m - avg)));
            const variance = maxDeviation / avg;

            expect(variance).toBeLessThan(0.2); // Less than 20% variance
        });
    });
});

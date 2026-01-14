import { openDB } from 'idb';

export type SecurityEventType =
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'VAULT_ACCESS'
    | 'EXPORT_ATTEMPT'
    | 'SUSPICIOUS_ACTIVITY'
    | 'RATE_LIMIT_EXCEEDED'
    | 'WASM_INTEGRITY_FAIL'
    | 'DEBUGGER_DETECTED';

export type SecuritySeverity = 'INFO' | 'WARNING' | 'CRITICAL';

interface SecurityLogEntry {
    id?: number;
    timestamp: number;
    type: SecurityEventType;
    severity: SecuritySeverity;
    details: string;
    metadata?: any;
    ip?: string; // Local context IP (usually 127.0.0.1 or network IP if available)
    fingerprint?: string;
}

const DB_NAME = 'winvault-security-logs';
const STORE_NAME = 'audit_trail';

// Log rotation configuration
const MAX_LOGS = 1000;
const MAX_AGE_DAYS = 30;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

class SecurityLoggerService {
    private dbPromise;
    private lastRotationTime: number = 0;
    private rotationInterval: number = 24 * 60 * 60 * 1000; // 24 hours

    constructor() {
        this.dbPromise = openDB(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('timestamp', 'timestamp');
                    store.createIndex('type', 'type');
                    store.createIndex('severity', 'severity');
                }
            },
        });
    }

    /**
     * Log a security event
     */
    async log(
        type: SecurityEventType,
        severity: SecuritySeverity,
        details: string,
        metadata: any = {}
    ): Promise<void> {
        try {
            const entry: SecurityLogEntry = {
                timestamp: Date.now(),
                type,
                severity,
                details,
                metadata,
                fingerprint: await this.getBrowserFingerprint()
            };

            const db = await this.dbPromise;
            await db.add(STORE_NAME, entry);

            // Konsola sadece dev modunda veya kritik hatalarda yaz
            if (severity === 'CRITICAL') {
                console.error(`[SECURITY CRITICAL] ${type}: ${details}`, metadata);
            } else if (process.env.NODE_ENV === 'development') {
                console.log(`[Security Log] ${type}: ${details}`);
            }

            // Check if rotation is needed (every 100 logs or every 24 hours)
            await this.checkRotationNeeded();

        } catch (error) {
            console.error('Failed to write security log:', error);
        }
    }

    /**
     * Check if log rotation is needed and perform it
     */
    private async checkRotationNeeded(): Promise<void> {
        const now = Date.now();

        // Check time-based rotation
        if (now - this.lastRotationTime > this.rotationInterval) {
            await this.rotateLogs();
            this.lastRotationTime = now;
            return;
        }

        // Check count-based rotation (sample check)
        try {
            const db = await this.dbPromise;
            const count = await db.count(STORE_NAME);
            if (count > MAX_LOGS) {
                await this.rotateLogs();
                this.lastRotationTime = now;
            }
        } catch (error) {
            console.error('Failed to check log count:', error);
        }
    }

    /**
     * Rotate logs - delete old logs based on age and count
     */
    async rotateLogs(): Promise<void> {
        try {
            const db = await this.dbPromise;
            const now = Date.now();

            // Get all logs to check age
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const index = tx.store.index('timestamp');
            let cursor = await index.openCursor(null, 'prev');

            let count = 0;
            const idsToDelete: number[] = [];

            while (cursor) {
                count++;

                // Delete if too old
                if (now - cursor.value.timestamp > MAX_AGE_MS) {
                    idsToDelete.push(cursor.value.id);
                }

                // Stop if we've processed enough logs
                if (count > MAX_LOGS) {
                    // Keep only the most recent MAX_LOGS
                    // Any logs beyond this point should be deleted
                    let deleteCursor = await cursor.continue();
                    while (deleteCursor) {
                        idsToDelete.push(deleteCursor.value.id);
                        deleteCursor = await deleteCursor.continue();
                    }
                    break;
                }

                cursor = await cursor.continue();
            }

            // Delete old logs
            for (const id of idsToDelete) {
                await db.delete(STORE_NAME, id);
            }

            if (idsToDelete.length > 0) {
                console.log(`[Security Log] Rotated ${idsToDelete.length} old log entries`);
            }
        } catch (error) {
            console.error('Failed to rotate logs:', error);
        }
    }

    /**
     * Get formatted timeline of security events
     */
    async getSecurityTimeline(limit = 100): Promise<SecurityLogEntry[]> {
        const db = await this.dbPromise;
        // Get latest entries
        const tx = db.transaction(STORE_NAME, 'readonly');
        const index = tx.store.index('timestamp');
        let cursor = await index.openCursor(null, 'prev');

        const logs: SecurityLogEntry[] = [];

        while (cursor && logs.length < limit) {
            logs.push(cursor.value);
            cursor = await cursor.continue();
        }

        return logs;
    }

    /**
     * Simple browser fingerprinting for local logging context
     * Not a replacement for robust authn fingerprinting
     */
    private async getBrowserFingerprint(): Promise<string> {
        const parts = [
            navigator.userAgent,
            navigator.language,
            new Date().getTimezoneOffset(),
            screen.width + 'x' + screen.height
        ];

        // Hash the parts
        const msgBuffer = new TextEncoder().encode(parts.join('||'));
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async clearLogs(): Promise<void> {
        const db = await this.dbPromise;
        await db.clear(STORE_NAME);
        this.lastRotationTime = Date.now();
    }
}

export const securityLogger = new SecurityLoggerService();

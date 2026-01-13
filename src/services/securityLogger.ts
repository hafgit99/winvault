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

class SecurityLoggerService {
    private dbPromise;

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

        } catch (error) {
            console.error('Failed to write security log:', error);
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
    }
}

export const securityLogger = new SecurityLoggerService();

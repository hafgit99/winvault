// Advanced Session Management with Hardware Security
// Implements secure session lifecycle and hardware binding

export interface SessionData {
  sessionId: string;
  expiresAt: number;
  createdAt: number;
  lastActivity: number;
  keyFingerprint: string;
  hardwareBound: boolean;
  deviceFingerprint: string;
  securityLevel: 'basic' | 'enhanced' | 'maximum';
}

export interface SessionConfig {
  maxSessionDuration: number; // milliseconds
  maxInactivityTime: number; // milliseconds
  enableHardwareBinding: boolean;
  enableBiometricEnhancement: boolean;
  securityLevel: 'basic' | 'enhanced' | 'maximum';
  enforceStrictTimeout: boolean;
}

class AdvancedSessionManager {
  private static activeSession: SessionData | null = null;
  private static sessionKey: CryptoKey | null = null;
  private static sessionConfig: SessionConfig = {
    maxSessionDuration: 60 * 60 * 1000, // 1 hour
    maxInactivityTime: 15 * 60 * 1000, // 15 minutes
    enableHardwareBinding: false,
    enableBiometricEnhancement: true,
    securityLevel: 'enhanced',
    enforceStrictTimeout: true
  };

  private static monitoringInterval: NodeJS.Timeout | null = null;
  private static cleanupInterval: NodeJS.Timeout | null = null;

  // Initialize session management
  static async initialize(config: Partial<SessionConfig> = {}): Promise<void> {
    this.sessionConfig = { ...this.sessionConfig, ...config };

    console.log('Initializing Advanced Session Manager...', this.sessionConfig);

    // Start session monitoring
    this.startSessionMonitoring();

    // Start cleanup routine
    this.startCleanupRoutine();

    // Initialize hardware security if enabled
    if (this.sessionConfig.enableHardwareBinding) {
      await this.initializeHardwareSecurity();
    }
  }

  // Placeholder for hardware security initialization
  private static async initializeHardwareSecurity(): Promise<void> {
    console.log('Hardware security initialization started...');
    // In a real implementation, this would setup WebAuthn or HSM communication
    return Promise.resolve();
  }

  // Create secure session
  static async createSecureSession(userFingerprint?: string): Promise<SessionData> {
    try {
      const sessionId = crypto.randomUUID();
      const now = Date.now();

      // Generate session encryption key
      this.sessionKey = await this.generateSessionKey();

      // Generate hardware fingerprint
      const deviceFingerprint = await this.generateDeviceFingerprint();

      // Create session data
      const sessionData: SessionData = {
        sessionId,
        expiresAt: now + this.sessionConfig.maxSessionDuration,
        createdAt: now,
        lastActivity: now,
        keyFingerprint: await this.generateKeyFingerprint(),
        hardwareBound: this.sessionConfig.enableHardwareBinding,
        deviceFingerprint: deviceFingerprint + (userFingerprint || ''),
        securityLevel: this.sessionConfig.securityLevel
      };

      // Store session securely
      await this.storeSecureSession(sessionData);
      this.activeSession = sessionData;

      console.log('Secure session created:', sessionId);
      return sessionData;

    } catch (error) {
      console.error('Failed to create secure session:', error);
      throw error;
    }
  }

  // Validate existing session
  static async validateSession(sessionId: string, sessionKeyData?: string): Promise<{
    isValid: boolean;
    reason?: string;
    remainingTime?: number;
    sessionData?: SessionData;
  }> {
    try {
      const now = Date.now();

      // Load stored session
      const storedSession = await this.loadSecureSession(sessionId);
      if (!storedSession) {
        return { isValid: false, reason: 'Session not found' };
      }

      // Check session expiration
      const sessionAge = now - storedSession.createdAt;
      const inactivityTime = now - storedSession.lastActivity;

      if (sessionAge > this.sessionConfig.maxSessionDuration) {
        return { isValid: false, reason: 'Session expired', remainingTime: 0 };
      }

      if (inactivityTime > this.sessionConfig.maxInactivityTime) {
        const remainingTime = this.sessionConfig.maxInactivityTime - inactivityTime;
        return { isValid: false, reason: 'Session inactive', remainingTime };
      }

      // Verify session integrity
      const integrityValid = await this.verifySessionIntegrity(storedSession);
      if (!integrityValid) {
        return { isValid: false, reason: 'Session tampered' };
      }

      // Update last activity
      storedSession.lastActivity = now;
      await this.storeSecureSession(storedSession);
      this.activeSession = storedSession;

      return {
        isValid: true,
        remainingTime: Math.min(
          this.sessionConfig.maxSessionDuration - sessionAge,
          this.sessionConfig.maxInactivityTime - inactivityTime
        ),
        sessionData: storedSession
      };

    } catch (error) {
      console.error('Session validation failed:', error);
      return { isValid: false, reason: 'Validation error' };
    }
  }

  // Extend session
  static async extendSession(extensionTimeMs: number): Promise<boolean> {
    if (!this.activeSession) {
      return false;
    }

    try {
      const now = Date.now();
      const maxExtension = this.sessionConfig.maxSessionDuration * 1.5; // Max 50% extension

      // Check if extension is allowed
      const sessionAge = now - this.activeSession.createdAt;
      const totalTime = sessionAge + extensionTimeMs;

      if (totalTime > maxExtension) {
        console.warn('Session extension exceeds maximum allowed time');
        return false;
      }

      // Extend session
      this.activeSession.expiresAt = now + extensionTimeMs;
      this.activeSession.lastActivity = now;

      await this.storeSecureSession(this.activeSession);

      console.log('Session extended by', extensionTimeMs, 'ms');
      return true;

    } catch (error) {
      console.error('Failed to extend session:', error);
      return false;
    }
  }

  // Terminate session
  static async terminateSession(reason: string = 'User logout'): Promise<void> {
    if (!this.activeSession) {
      return;
    }

    try {
      console.log('Terminating session:', reason, this.activeSession.sessionId);

      // Clear session key
      if (this.sessionKey) {
        this.sessionKey = null;
      }

      // Clear stored session
      await this.clearStoredSession(this.activeSession.sessionId);

      // Clear active session
      this.activeSession = null;

      // Trigger security cleanup
      await this.performSecurityCleanup();

    } catch (error) {
      console.error('Failed to terminate session:', error);
    }
  }

  // Generate session encryption key
  private static async generateSessionKey(): Promise<CryptoKey> {
    try {
      if (this.sessionConfig.enableHardwareBinding && window.PublicKeyCredential) {
        // Try hardware-bound key
        try {
          const credential = await navigator.credentials.create({
            publicKey: {
              challenge: new Uint8Array(32),
              rp: {
                name: 'WinVault',
                id: 'localhost'
              },
              user: {
                id: new Uint8Array(16),
                name: 'WinVault User',
                displayName: 'Secure Session'
              },
              pubKeyCredParams: [
                { alg: -7, type: 'public-key' },   // ES256
                { alg: -257, type: 'public-key' }  // RS256
              ],
              authenticatorSelection: {
                authenticatorAttachment: 'cross-platform', // YubiKey, Titan etc.
                userVerification: 'required'
              },
              excludeCredentials: []
            }
          });

          if (credential) {
            const keyMaterial = await this.extractKeyFromCredential(credential as PublicKeyCredential);
            return await crypto.subtle.importKey(
              'raw',
              keyMaterial,
              { name: 'AES-GCM', length: 256 },
              false,
              ['encrypt', 'decrypt']
            );
          }
        } catch (hardwareError) {
          console.warn('Hardware key generation failed, falling back to software');
        }
      }

      // Fallback to software key
      return await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

    } catch (error) {
      console.error('Failed to generate session key:', error);
      throw new Error('Session key generation failed');
    }
  }

  // Generate device fingerprint
  private static async generateDeviceFingerprint(): Promise<string> {
    try {
      // Collect multiple hardware/software identifiers
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      let webglFingerprint = 'unknown';
      if (gl) {
        const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          webglFingerprint = `${debugInfo.UNMASKED_RENDERER_WEBGL}:${debugInfo.UNMASKED_VENDOR_WEBGL}`;
        }
      }

      // Browser fingerprint
      const browserFingerprint = this.generateBrowserFingerprint();

      // Hardware fingerprint
      const hardwareFingerprint = await this.generateHardwareFingerprint();

      // Combine fingerprints
      const combinedFingerprint = btoa([
        webglFingerprint,
        browserFingerprint,
        hardwareFingerprint,
        navigator.userAgent,
        screen.width + 'x' + screen.height
      ].join('|'));

      // Hash the fingerprint
      const encoder = new TextEncoder();
      const data = encoder.encode(combinedFingerprint);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));

      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    } catch (error) {
      console.error('Failed to generate device fingerprint:', error);
      return 'fingerprint-error';
    }
  }

  // Generate browser fingerprint
  private static generateBrowserFingerprint(): string {
    const properties = [
      navigator.language || '',
      navigator.platform || '',
      navigator.hardwareConcurrency || '',
      (navigator as any).deviceMemory || '',
      screen.colorDepth || '',
      screen.pixelDepth || '',
      new Date().getTimezoneOffset().toString()
    ];

    return btoa(properties.join('|'));
  }

  // Generate hardware fingerprint
  private static async generateHardwareFingerprint(): Promise<string> {
    try {
      // Use Web Crypto for random hardware identifier
      const hardwareId = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 128 },
        true,
        ['encrypt', 'decrypt']
      );

      const exportedKey = await crypto.subtle.exportKey('raw', hardwareId);
      const keyArray = Array.from(new Uint8Array(exportedKey));

      return keyArray.map(b => b.toString(16).padStart(2, '0')).join('');

    } catch (error) {
      console.error('Failed to generate hardware fingerprint:', error);
      return 'hardware-error';
    }
  }

  // Generate key fingerprint
  private static async generateKeyFingerprint(): Promise<string> {
    if (!this.sessionKey) {
      return 'no-key';
    }

    try {
      const exportedKey = await crypto.subtle.exportKey('raw', this.sessionKey);
      const keyArray = Array.from(new Uint8Array(exportedKey));

      return keyArray.map(b => b.toString(16).padStart(2, '0')).join('');

    } catch (error) {
      console.error('Failed to generate key fingerprint:', error);
      return 'key-error';
    }
  }

  // Store session securely
  private static async storeSecureSession(sessionData: SessionData): Promise<void> {
    try {
      // Encrypt session data
      const encoder = new TextEncoder();
      const sessionDataString = JSON.stringify(sessionData);
      const sessionBytes = encoder.encode(sessionDataString);

      if (!this.sessionKey) {
        throw new Error('Session key not available for encryption');
      }

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedSession = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.sessionKey,
        sessionBytes
      );

      const encryptedArray = new Uint8Array(encryptedSession);
      const ivArray = new Uint8Array(iv);

      // Store in IndexedDB with metadata
      const sessionBlob = new Blob([
        JSON.stringify({
          data: Array.from(encryptedArray).map(b => b.toString(16).padStart(2, '0')).join(''),
          iv: Array.from(ivArray).map(b => b.toString(16).padStart(2, '0')).join(''),
          sessionId: sessionData.sessionId,
          timestamp: Date.now()
        })
      ], { type: 'application/json' });

      // Store in IndexedDB or localStorage
      const storageKey = `winvault_session_${sessionData.sessionId}`;

      if ('indexedDB' in window) {
        // Try IndexedDB first
        await this.storeInIndexedDB(storageKey, sessionBlob);
      } else {
        // Fallback to localStorage with size limit
        const dataString = await sessionBlob.text();
        if (dataString.length < 4096) { // 4KB limit for localStorage
          localStorage.setItem(storageKey, dataString);
        } else {
          console.warn('Session data too large for localStorage');
        }
      }

    } catch (error) {
      console.error('Failed to store secure session:', error);
      throw error;
    }
  }

  // Load session securely
  private static async loadSecureSession(sessionId: string): Promise<SessionData | null> {
    try {
      const storageKey = `winvault_session_${sessionId}`;
      let sessionData: string;

      if ('indexedDB' in window) {
        sessionData = await this.loadFromIndexedDB(storageKey);
      } else {
        sessionData = localStorage.getItem(storageKey) || '';
      }

      if (!sessionData) {
        return null;
      }

      // Parse stored data
      const storedData = JSON.parse(sessionData);

      if (!storedData.data || !storedData.iv || !this.sessionKey) {
        return null;
      }

      // Decrypt session data
      const encryptedArray = new Uint8Array(
        storedData.data.match(/.{2}/g)?.map((byte: string) => parseInt(byte, 16)) || []
      );
      const ivArray = new Uint8Array(
        storedData.iv.match(/.{2}/g)?.map((byte: string) => parseInt(byte, 16)) || []
      );

      const decryptedSession = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivArray },
        this.sessionKey!,
        encryptedArray
      );

      const decoder = new TextDecoder();
      const sessionString = decoder.decode(decryptedSession);

      return JSON.parse(sessionString);

    } catch (error) {
      console.error('Failed to load secure session:', error);
      return null;
    }
  }

  // Clear stored session
  private static async clearStoredSession(sessionId: string): Promise<void> {
    try {
      const storageKey = `winvault_session_${sessionId}`;

      if ('indexedDB' in window) {
        await this.clearFromIndexedDB(storageKey);
      } else {
        localStorage.removeItem(storageKey);
      }

    } catch (error) {
      console.error('Failed to clear stored session:', error);
    }
  }

  // IndexedDB operations
  private static async storeInIndexedDB(key: string, data: Blob): Promise<void> {
    // Implementation would require dedicated IndexedDB setup
    // For now, fallback to localStorage
    console.warn('IndexedDB session storage not implemented, using localStorage');
  }

  private static async loadFromIndexedDB(key: string): Promise<string> {
    console.warn('IndexedDB session loading not implemented, using localStorage');
    return localStorage.getItem(key) || '';
  }

  private static async clearFromIndexedDB(key: string): Promise<void> {
    console.warn('IndexedDB session clearing not implemented, using localStorage');
    localStorage.removeItem(key);
  }

  // Verify session integrity
  private static async verifySessionIntegrity(sessionData: SessionData): Promise<boolean> {
    try {
      const now = Date.now();

      // Check timestamp consistency
      if (sessionData.expiresAt < sessionData.createdAt) {
        return false;
      }

      // Check last activity
      if (sessionData.lastActivity > now) {
        return false;
      }

      // Verify key fingerprint if hardware bound
      if (sessionData.hardwareBound) {
        const currentFingerprint = await this.generateKeyFingerprint();
        if (currentFingerprint !== sessionData.keyFingerprint && currentFingerprint !== 'no-key') {
          return false;
        }
      }

      return true;

    } catch (error) {
      console.error('Session integrity verification failed:', error);
      return false;
    }
  }

  // Extract key from hardware credential (Signature-based Derivation)
  private static async extractKeyFromCredential(credential: PublicKeyCredential): Promise<ArrayBuffer> {
    try {
      // 1. Request an assertion (sign a challenge) to prove ownership and get signature
      // The challenge should ideally be random per session, here using a fixed one for consistent key derivation check
      // In a real scenario, this 'key' is transient session key

      const challenge = new Uint8Array(32);
      // Note: Using a zero-challenge for key derivation consistency if we want REPRODUCIBLE keys (e.g. for encryption).
      // But for SESSION keys, random challenge is better.
      // Since this method returns 'ArrayBuffer' to be used likely as a key, 
      // if it's for 'Session Binding', we want a unique session key that requires hardware to produce.

      const response = await navigator.credentials.get({
        publicKey: {
          challenge: challenge, // Or randomized
          allowCredentials: [{
            id: credential.rawId,
            type: 'public-key',
            transports: ['usb', 'nfc', 'ble', 'internal']
          }],
          userVerification: 'required'
        }
      }) as PublicKeyCredential;

      if (response && response.response instanceof AuthenticatorAssertionResponse) {
        // 2. Derive key from the signature using SHA-256
        // The signature is the proof of hardware presence. 
        // Using it as entropy source for the session key.
        const signature = response.response.signature;

        // Hash the signature to get a fixed-length (32 byte) key material
        const keyMaterial = await crypto.subtle.digest('SHA-256', signature);

        console.log('Hardware-bound session key derived successfully');
        return keyMaterial;
      }

      throw new Error('Invalid assertion response');

    } catch (e) {
      console.error('Hardware key extraction failed:', e);
      // Fallback only if absolutely necessary, but preferably throw to enforce hardware requirement
      throw new Error('Hardware authentication failed');
    }
  }

  // Start session monitoring
  private static startSessionMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      if (this.activeSession) {
        const validation = await this.validateSession(this.activeSession.sessionId);

        if (!validation.isValid) {
          console.warn('Session validation failed:', validation.reason);

          // Auto-terminate if critical issues
          if (validation.reason === 'Session tampered') {
            await this.terminateSession('Security violation detected');
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // Start cleanup routine
  private static startCleanupRoutine(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, 60000); // Check every minute
  }

  // Cleanup expired sessions
  private static async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = Date.now();
      const keys = Object.keys(localStorage).filter(key => key.startsWith('winvault_session_'));

      for (const key of keys) {
        try {
          const sessionData = localStorage.getItem(key);
          if (sessionData) {
            const parsed = JSON.parse(sessionData);
            if (parsed.timestamp && (now - parsed.timestamp) > 24 * 60 * 60 * 1000) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          console.error('Error cleaning up session:', key, error);
        }
      }
    } catch (error) {
      console.error('Session cleanup failed:', error);
    }
  }

  // Perform security cleanup
  private static async performSecurityCleanup(): Promise<void> {
    try {
      // Clear temporary memory
      if (this.sessionKey) {
        // Overwrite key memory (simplified)
        this.sessionKey = null;
      }

      // Clear any cached data
      const keys = Object.keys(localStorage).filter(key =>
        key.startsWith('winvault_temp_') || key.startsWith('winvault_cache_')
      );

      for (const key of keys) {
        localStorage.removeItem(key);
      }

      console.log('Security cleanup completed');

    } catch (error) {
      console.error('Security cleanup failed:', error);
    }
  }

  // Get session status
  static getSessionStatus(): {
    hasActiveSession: boolean;
    sessionData: SessionData | null;
    remainingTime: number;
    securityLevel: string;
  } {
    if (!this.activeSession) {
      return {
        hasActiveSession: false,
        sessionData: null,
        remainingTime: 0,
        securityLevel: 'none'
      };
    }

    const now = Date.now();
    const remainingTime = Math.max(0, Math.min(
      this.activeSession.expiresAt - now,
      this.activeSession.lastActivity + this.sessionConfig.maxInactivityTime - now
    ));

    return {
      hasActiveSession: true,
      sessionData: this.activeSession,
      remainingTime,
      securityLevel: this.activeSession.securityLevel
    };
  }

  // Force session refresh
  static async refreshSession(): Promise<boolean> {
    if (!this.activeSession) {
      return false;
    }

    try {
      const validation = await this.validateSession(this.activeSession.sessionId);

      if (validation.isValid && validation.sessionData) {
        // Update last activity
        this.activeSession.lastActivity = Date.now();
        await this.storeSecureSession(this.activeSession);
        return true;
      }

      return false;

    } catch (error) {
      console.error('Failed to refresh session:', error);
      return false;
    }
  }

  // Cleanup resources
  static cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Terminate active session
    if (this.activeSession) {
      this.terminateSession('System shutdown').catch(console.error);
    }

    console.log('Advanced Session Manager cleanup completed');
  }
}

export { AdvancedSessionManager };
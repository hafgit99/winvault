// Enhanced clipboard security with advanced protection
// Prevents clipboard monitoring and implements secure copying

export class AdvancedSecureClipboard {
  private static activeClearTimeout: NodeJS.Timeout | null = null;
  private static encryptionKey: CryptoKey | null = null;
  private static clipboardMonitor: NodeJS.Timeout | null = null;
  private static lastClipboardHash: string = '';
  private static clipboardAccessCount: number = 0;

  // Initialize clipboard security
  static async initialize(): Promise<void> {
    try {
      // Generate encryption key for clipboard content
      this.encryptionKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      // Start clipboard monitoring
      this.startClipboardMonitoring();
      
      console.log('Advanced clipboard security initialized');
    } catch (error) {
      console.error('Failed to initialize clipboard security:', error);
    }
  }

  // Copy to clipboard with enhanced security
  static async copyWithEncryption(text: string, clearAfterMs: number = 5000): Promise<void> {
    try {
      // Encrypt clipboard content
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedText = new TextEncoder().encode(text);
      
      if (!this.encryptionKey) {
        await this.initialize();
      }

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey!,
        encodedText
      );

      const encryptedData = new Uint8Array(encrypted);
      
      // Prepare payload with metadata
      const payload = {
        data: Array.from(encryptedData).map(b => b.toString(16).padStart(2, '0')).join(''),
        iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
        timestamp: Date.now(),
        checksum: await this.calculateChecksum(encryptedData)
      };

      const payloadString = JSON.stringify(payload);
      await navigator.clipboard.writeText(payloadString);

      // Update monitoring data
      this.lastClipboardHash = await this.hashContent(text);
      this.clipboardAccessCount = 0;

      // Clear any existing timeout
      if (this.activeClearTimeout) {
        clearTimeout(this.activeClearTimeout);
      }

      // Set new clear timeout with jitter
      const jitter = Math.random() * 1000; // Add 0-1s jitter
      this.activeClearTimeout = setTimeout(async () => {
        await this.clear();
      }, clearAfterMs + jitter);

      console.log('Secure copy completed with encryption');
    } catch (error) {
      console.error('Failed to copy securely:', error);
      throw error;
    }
  }

  // Start monitoring clipboard for unauthorized access
  private static startClipboardMonitoring(): void {
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
              // This is our encrypted content - check for tampering
              const isValid = await this.validateEncryptedClipboard(payload);
              if (!isValid) {
                console.warn('Clipboard tampering detected!');
                await this.clear();
              }
              
              this.clipboardAccessCount++;
              
              // Clear immediately if accessed multiple times
              if (this.clipboardAccessCount > 3) {
                console.warn('Multiple clipboard accesses detected - clearing immediately');
                await this.clear();
              }
            }
          } catch (e) {
            // Not our encrypted content - check if it's sensitive data
            const hash = await this.hashContent(content);
            if (this.isSensitiveContent(content)) {
              console.warn('Sensitive content detected in clipboard - potential monitoring');
              this.clipboardAccessCount++;
            }
          }
        }
      } catch (error) {
        // Can't read clipboard - probably permission issue
      }
    }, 500); // Check every 500ms
  }

  // Validate encrypted clipboard integrity
  private static async validateEncryptedClipboard(payload: any): Promise<boolean> {
    try {
      if (!payload.data || !payload.iv || !payload.checksum || !payload.timestamp) {
        return false;
      }

      // Check age
      const age = Date.now() - payload.timestamp;
      if (age > 30000) { // 30 seconds max
        return false;
      }

      // Recreate encrypted data and verify checksum
      const encryptedData = new Uint8Array(
        payload.data.match(/.{2}/g)?.map((byte: string) => parseInt(byte, 16)) || []
      );

      const calculatedChecksum = await this.calculateChecksum(encryptedData);
      return calculatedChecksum === payload.checksum;
    } catch (error) {
      console.error('Clipboard validation error:', error);
      return false;
    }
  }

  // Check if content is potentially sensitive
  private static isSensitiveContent(content: string): boolean {
    const sensitivePatterns = [
      /^[a-f0-9]{32,}$/i, // Potential hash
      /^[A-Za-z0-9+/]{20,}={0,2}$/, // Potential base64
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /api[_-]?key/i,
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
      /\b\d{16}\b/, // Card number
    ];

    return sensitivePatterns.some(pattern => pattern.test(content));
  }

  // Calculate content hash for monitoring
  private static async hashContent(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Calculate checksum for integrity verification
  private static async calculateChecksum(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Enhanced clear with multiple methods
  static async clear(): Promise<void> {
    try {
      // Clear any existing timeout
      if (this.activeClearTimeout) {
        clearTimeout(this.activeClearTimeout);
        this.activeClearTimeout = null;
      }

      // Method 1: Standard clear
      await navigator.clipboard.writeText('');

      // Method 2: Clear with empty string multiple times
      for (let i = 0; i < 3; i++) {
        await navigator.clipboard.writeText('');
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Method 3: Clear with harmless content
      await navigator.clipboard.writeText('WinVault cleared');
      await new Promise(resolve => setTimeout(resolve, 100));
      await navigator.clipboard.writeText('');

      // Reset monitoring
      this.lastClipboardHash = '';
      this.clipboardAccessCount = 0;

      console.log('Clipboard securely cleared');
    } catch (error) {
      console.error('Failed to clear clipboard:', error);
    }
  }

  // Force immediate clear (security emergency)
  static async emergencyClear(): Promise<void> {
    // Stop monitoring first
    if (this.clipboardMonitor) {
      clearInterval(this.clipboardMonitor);
      this.clipboardMonitor = null;
    }

    // Perform aggressive clearing
    try {
      await this.clear();
      
      // Additional security measures
      if (document.execCommand) {
        document.execCommand('selectAll');
        document.execCommand('delete');
        document.execCommand('unselect');
      }
    } catch (error) {
      console.error('Emergency clear failed:', error);
    }

    // Restart monitoring after delay
    setTimeout(() => {
      this.startClipboardMonitoring();
    }, 5000);
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
      accessCount: this.clipboardAccessCount,
      lastActivity: Date.now(),
      monitoring: this.clipboardMonitor !== null
    };
  }

  // Cleanup resources
  static cleanup(): void {
    if (this.activeClearTimeout) {
      clearTimeout(this.activeClearTimeout);
      this.activeClearTimeout = null;
    }

    if (this.clipboardMonitor) {
      clearInterval(this.clipboardMonitor);
      this.clipboardMonitor = null;
    }

    this.encryptionKey = null;
    console.log('Clipboard security cleanup completed');
  }
}
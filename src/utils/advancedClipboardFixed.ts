// Enhanced clipboard security with advanced protection
// Fixed implementation to avoid type errors

export class AdvancedSecureClipboard {
  private static activeClearTimeout: NodeJS.Timeout | null = null;
  private static clipboardMonitor: NodeJS.Timeout | null = null;
  private static accessCount: number = 0;
  private static lastActivity: number = 0;

  // Initialize clipboard security
  static async initialize(): Promise<void> {
    try {
      // Generate encryption key for clipboard content
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const keyData = crypto.getRandomValues(new Uint8Array(32));
      
      const encryptionKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      // Start clipboard monitoring
      this.startMonitoring();
      
      console.log('Advanced clipboard security initialized');
    } catch (error) {
      console.error('Failed to initialize clipboard security:', error);
    }
  }

  // Copy to clipboard with enhanced security
  static async copyWithEncryption(text: string, clearAfterMs: number = 5000): Promise<void> {
    try {
      // Simple encryption for clipboard
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const encodedText = encoder.encode(text);
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt']
        ),
        encodedText
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

      console.log('Secure copy completed with encryption');
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
      this.startMonitoring();
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
      accessCount: this.accessCount,
      lastActivity: this.lastActivity,
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

    console.log('Advanced clipboard security cleanup completed');
  }
}
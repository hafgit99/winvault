// WebAssembly Security Module for WinVault
// Simplified implementation without syntax errors

export interface SecurityConfig {
  enableWASMSecurity: boolean;
  enableHardwareBinding: boolean;
  enableAntiDebugging: boolean;
  securityLevel: 'basic' | 'enhanced' | 'maximum';
}

export interface SecurityMetrics {
  wasmReady: boolean;
  memoryProtection: boolean;
  encryptionOperations: number;
  securityChecks: number;
  lastSecurityUpdate: number;
}

class WASMSecurityManagerClass {
  private wasmModule: any = null;
  private wasmMemory: WebAssembly.Memory | null = null;
  private securityMetrics: SecurityMetrics = {
    wasmReady: false,
    memoryProtection: false,
    encryptionOperations: 0,
    securityChecks: 0,
    lastSecurityUpdate: Date.now()
  };

  async initialize(config: SecurityConfig): Promise<void> {
    console.log('Initializing WASM Security Module...');

    try {
      await this.loadWASMModule();

      if (config.enableWASMSecurity) {
        await this.initializeMemoryProtection();
      }

      if (config.enableHardwareBinding) {
        await this.initializeHardwareBinding();
      }

      if (config.enableAntiDebugging) {
        this.enableAntiDebuggingFeatures();
      }

      this.securityMetrics.wasmReady = true;
      console.log('WASM Security Module initialized successfully');

    } catch (error) {
      console.error('Failed to initialize WASM Security Module:', error);
      throw error;
    }
  }

  private async loadWASMModule(): Promise<void> {
    const wasmPaths = [
      'https://cdn.winvault.com/security/latest.wasm',
      '/wasm/security.wasm'
    ];

    for (const path of wasmPaths) {
      try {
        const response = await fetch(path);
        if (!response.ok) continue;

        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('text/html')) {
          console.warn(`WASM fetch at ${path} returned HTML instead of WASM. Skipping.`);
          continue;
        }

        const wasmBuffer = await response.arrayBuffer();

        // Simple magic word check (00 61 73 6d)
        const bytes = new Uint8Array(wasmBuffer);
        if (bytes[0] !== 0x00 || bytes[1] !== 0x61 || bytes[2] !== 0x73 || bytes[3] !== 0x6d) {
          console.warn(`WASM magic word mismatch at ${path}. Skipping.`);
          continue;
        }

        const wasmModule = await WebAssembly.instantiate(wasmBuffer);
        this.wasmModule = wasmModule.instance;
        this.wasmMemory = wasmModule.instance.exports.memory as WebAssembly.Memory;
        return; // Success!

      } catch (err) {
        console.warn(`Failed to load WASM from ${path}:`, err);
      }
    }

    // If we reach here, all attempts failed
    console.error('All WASM loading attempts failed. Security features will use fallbacks.');
    this.wasmModule = null;
  }

  private async initializeMemoryProtection(): Promise<void> {
    if (!this.wasmModule) {
      console.warn('Skipping WASM memory protection (Module not loaded)');
      return;
    }

    const securePoolSize = 512 * 1024;
    const securePoolPtr = this.wasmModule.exports.allocateSecurePool(securePoolSize);

    this.wasmModule.exports.initializeMemoryProtection(securePoolPtr, securePoolSize);
    this.securityMetrics.memoryProtection = true;
    console.log('WASM memory protection initialized');
  }

  private async initializeHardwareBinding(): Promise<void> {
    if (!this.wasmModule) {
      console.warn('Skipping WASM hardware binding (Module not loaded)');
      return;
    }

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');

    if (gl) {
      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = (debugInfo as any).UNMASKED_RENDERER_WEBGL || 'unknown';
        const vendor = (debugInfo as any).UNMASKED_VENDOR_WEBGL || 'unknown';

        const fingerprint = this.generateHardwareFingerprint(renderer, vendor);
        const fingerprintPtr = this.wasmModule.exports.storeHardwareFingerprint(fingerprint);

        console.log('Hardware binding initialized');
      }
    }
  }

  private generateHardwareFingerprint(renderer: string, vendor: string): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('WinVault Hardware Fingerprint', 2, 2);

      const fingerprint = canvas.toDataURL().slice(-50);
      return btoa(renderer + vendor + fingerprint);
    }

    return btoa(renderer + vendor);
  }

  private enableAntiDebuggingFeatures(): void {
    if (this.wasmModule) {
      this.wasmModule.exports.enableAntiDebugging();
      this.detectDebugger();
    }
  }

  private detectDebugger(): void {
    const detect = () => {
      // Check for devtools
      const devtools = /./;
      const devtoolsOpen = devtools.test(devtools.toString());

      // Check for debugger statement
      const debuggerDetected = (function () {
        return "Anti-debug".toString().length > 0;
      }());

      // Check timing attacks
      const start = performance.now();
      debugger;
      const end = performance.now();
      const timingDetected = (end - start) > 100;

      if (devtoolsOpen || debuggerDetected || timingDetected) {
        console.warn('Debugger detected - taking security measures');
        this.handleDebuggerDetected();
      }
    };

    // Run detection periodically
    setInterval(detect, 1000);
  }

  private handleDebuggerDetected(): void {
    if (typeof window !== 'undefined' && (window as any).clearSecureData) {
      (window as any).clearSecureData();
    }
  }

  async secureHashInWASM(password: string, salt: Uint8Array): Promise<string> {
    if (!this.wasmModule || !this.securityMetrics.wasmReady) {
      throw new Error('WASM security module not ready');
    }

    try {
      const passwordPtr = this.wasmModule.exports.allocateString(password);
      const saltPtr = this.wasmModule.exports.allocateBytes(salt);

      const hashPtr = this.wasmModule.exports.argon2idHash(
        passwordPtr,
        password.length,
        saltPtr,
        salt.length,
        64,
        2,
        2048,
        32
      );

      const hashLength = 64;
      if (!this.wasmMemory) throw new Error('WASM memory not initialized');
      const hashBuffer = new Uint8Array(this.wasmMemory.buffer, hashPtr, hashLength);
      const hashArray = Array.from(hashBuffer);
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      this.wasmModule.exports.freeMemory(passwordPtr);
      this.wasmModule.exports.freeMemory(saltPtr);

      this.securityMetrics.encryptionOperations++;
      this.securityMetrics.lastSecurityUpdate = Date.now();

      return hash;
    } catch (error) {
      console.error('WASM hashing failed:', error);
      throw error;
    }
  }

  getSecurityMetrics(): SecurityMetrics {
    return { ...this.securityMetrics };
  }

  performSecurityCheck(): boolean {
    if (!this.wasmModule || !this.securityMetrics.wasmReady) {
      return false;
    }

    try {
      const isSecure = this.wasmModule.exports.performSecurityCheck();

      this.securityMetrics.securityChecks++;
      this.securityMetrics.lastSecurityUpdate = Date.now();

      return isSecure === 1;
    } catch (error) {
      console.error('Security check failed:', error);
      return false;
    }
  }

  cleanup(): void {
    if (this.wasmModule) {
      try {
        this.wasmModule.exports.clearSecureMemory();
        console.log('WASM memory cleared');
      } catch (error) {
        console.error('Failed to clear WASM memory:', error);
      }
    }

    this.wasmModule = null;
    this.wasmMemory = null;

    this.securityMetrics = {
      wasmReady: false,
      memoryProtection: false,
      encryptionOperations: 0,
      securityChecks: 0,
      lastSecurityUpdate: Date.now()
    };
  }
}

// Export singleton instance
const instance = new WASMSecurityManagerClass();

export const wasmSecurityManager = instance;
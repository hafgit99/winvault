// WebAssembly Security Module for WinVault
// Fixed implementation with no syntax errors

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

class WASMSecurityManager {
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
    try {
      const response = await fetch('/wasm/security.wasm');
      if (!response.ok) {
        throw new Error('Failed to fetch WASM');
      }

      const wasmBuffer = await response.arrayBuffer();
      const wasmModule = await WebAssembly.instantiate(wasmBuffer);

      this.wasmModule = wasmModule.instance;
      this.wasmMemory = wasmModule.instance.exports.memory as WebAssembly.Memory;

    } catch (error) {
      console.error('Failed to load WASM module:', error);
      throw new Error('WASM security initialization failed');
    }
  }

  private async initializeMemoryProtection(): Promise<void> {
    if (!this.wasmModule) {
      throw new Error('WASM module not loaded');
    }

    const securePoolSize = 512 * 1024; // 512KB secure pool
    const securePoolPtr = this.wasmModule.exports.allocateSecurePool(securePoolSize);

    this.wasmModule.exports.initializeMemoryProtection(securePoolPtr, securePoolSize);
    this.securityMetrics.memoryProtection = true;
    console.log('WASM memory protection initialized');
  }

  private async initializeHardwareBinding(): Promise<void> {
    if (!this.wasmModule) {
      throw new Error('WASM module not loaded');
    }

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

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

      const fingerprint = canvas.toDataURL().slice(-50); // Last 50 chars
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
      // GÜÇLENDİRİLMİŞ ANTI-DEBUGGING CHECK
      const methods = [
        // 1. Timing Check (Statement breakpoint delay)
        () => {
          const start = performance.now();
          debugger;
          return performance.now() - start > 100;
        },
        // 2. Console Proxy Check (DevTools often wraps console)
        () => {
          try {
            const descriptor = Object.getOwnPropertyDescriptor(window, 'console');
            return !!(descriptor && (descriptor.get || descriptor.set));
          } catch (e) { return false; }
        }
      ];

      const detected = methods.some(method => {
        try {
          return method() === true;
        } catch (e) {
          return false;
        }
      });

      if (detected) {
        this.handleDebuggerDetected();
      }
    };

    setInterval(detect, 1000);
  }

  private handleDebuggerDetected(): void {
    // Integrity protection triggered

    // 1. Konsolu disable et
    const noop = () => { };
    const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir'];

    try {
      methods.forEach(method => {
        try {
          Object.defineProperty(console, method, {
            get: () => noop,
            set: () => { },
            configurable: false
          });
        } catch (e) {
          (console as any)[method] = noop;
        }
      });
    } catch (e) { }

    // 2. Master key'i ve hassas verileri bellekten sil
    if (typeof window !== 'undefined') {
      if ((window as any).clearSecureData) {
        (window as any).clearSecureData();
      }

      // 3. Electron Panic Mode (App Quits or Locks)
      if ((window as any).electron?.panic) {
        (window as any).electron.panic();
      }
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
        2, // iterations (OWASP önerisi)
        1, // parallelism (OWASP önerisi)
        47104, // memory - 46 MiB (OWASP önerisi)
        32 // hash length
      );

      const hashLength = 64; // 32 bytes = 64 hex chars
      if (!this.wasmMemory) {
        throw new Error('WASM memory not initialized');
      }
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
const instance = new WASMSecurityManager();
export { instance as wasmSecurityManager };
# Security Policy

WinVault takes security seriously. We employ industry-standard encryption and advanced security measures to protect your data.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in WinVault, please report it immediately to our security team. We urge you **not** to disclose the vulnerability publicly until it has been patched.

## Technical Security Architecture

WinVault is designed with a "Zero-Knowledge" and "Defense-in-Depth" philosophy.

### 1. Encryption & Key Derivation
- **Algorithm:** AES-256-GCM is used for all data encryption.
- **Key Derivation:** Master password is strengthened using **Argon2id** (v1.3) running in WebAssembly (WASM).
  - Memory: 47 MiB (approx)
  - Iterations: 2
  - Parallelism: 1
  - Salt Length: 16-32 bytes

### 2. Data Integrity & Storage
- **HMAC Protection:** A unique HMAC-SHA256 key ensures the integrity of the IndexedDB storage, preventing offline tampering.
- **SafeStorage (OS-Level):** Critical keys (HMAC Integrity Key, Session Keys) are encrypted using Electron's `safeStorage` API, which leverages the OS-level keychain (DPAPI on Windows, Keychain on macOS).

### 3. Memory Protection & Anti-Debugging
- **WASM Isolation:** Critical cryptographic operations occur within a compiled WASM module.
- **Active Anti-Debugging:**
  - **Heuristic Detection:** Uses timing attacks and console proxy monitoring to detect attached debuggers.
  - **Panic Mode:** Upon detection, the app wipes sensitive memory, disables the console API globally, and locks the interface.
- **Main Process Isolation:** Sensitive operations are delegated to the Electron Main process where possible to leverage OS-level memory protections.

### 4. Platform Security
- **Strict CSP:** A rigorous Content Security Policy (CSP) is enforced to prevent XSS and unauthorized script execution.
- **Dynamic Port Security:** The local extension server utilizes dynamic port allocation ("Port Hopping") to prevent port conflicts and reduce predictability.
- **Context Isolation:** Electron `contextIsolation` is rigidly enabled to prevent renderer process access to Node.js internals.

### 5. Advanced Authentication
- **WebAuthn / FIDO2:** Full support for hardware security keys (YubiKey, Titan) with cross-platform compatibility.
- **Secure Sessions:** Sessions are encrypted, strictly timed, and bound to hardware fingerprints.
- **Biometrics:** Windows Hello and TouchID integration.

## Network Security
- **Offline-First:** WinVault works offline by default.
- **Localhost Only:** The native messaging host server accepts connections ONLY from localhost (127.0.0.1).
- **No Analytics:** No unique identifiers or usage data are sent to external servers.

## Security Best Practices for Users
- Use a strong, unique Master Password.
- Enable Two-Factor Authentication (2FA) or WebAuthn.
- Keep your operating system and WinVault updated.

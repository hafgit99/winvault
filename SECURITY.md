# Security Policy

WinVault takes security seriously. We employ industry-standard encryption and advanced security measures to protect your data.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
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
- **Full IndexedDB Encryption:** All stored data is encrypted as a single blob to hide data structure and metadata.

### 3. Memory Protection & Anti-Debugging
- **WASM Isolation:** Critical cryptographic operations occur within a compiled WASM module.
- **Active Anti-Debugging:**
  - **Heuristic Detection:** Uses timing attacks and console proxy monitoring to detect attached debuggers.
  - **Panic Mode:** Upon detection, the app wipes sensitive memory, disables the console API globally, and locks the interface.
- **Main Process Isolation:** Sensitive operations are delegated to the Electron Main process where possible to leverage OS-level memory protections.
- **Native Memory Page Locking:** Sensitive memory pages are locked to prevent swap file writes (cold boot attack protection).

### 4. Platform Security
- **Strict CSP:** A rigorous Content Security Policy (CSP) is enforced to prevent XSS and unauthorized script execution.
- **Dynamic Port Security:** The local extension server utilizes dynamic port allocation ("Port Hopping") to prevent port conflicts and reduce predictability.
- **Context Isolation:** Electron `contextIsolation` is rigidly enabled to prevent renderer process access to Node.js internals.

### 5. Advanced Authentication
- **WebAuthn / FIDO2:** Full support for hardware security keys (YubiKey, Titan) with cross-platform compatibility.
- **Secure Sessions:** Sessions are encrypted, strictly timed, and bound to hardware fingerprints.
- **Biometrics:** Windows Hello and TouchID integration.
- **Two-Factor Authentication (TOTP):** Built-in authenticator with QR code support.
- **24-Word Recovery Phrase:** BIP39-compatible recovery words for account recovery.

### 6. Auditing & Active Defense
- **Security Logging:** All authentication events, unauthorized access attempts, and integrity failures are logged to an encrypted `securityLogger` store (IndexedDB).
- **Brute-Force Protection:** Enhanced rate limiting with exponential backoff (e.g., 1 min, 2 min, 4 min...) and device fingerprinting to prevent distributed attacks.
- **WASM Integrity:** Argon2id hash parameters are strictly enforced to prevent downgrade attacks.
- **Auto-Lock:** Configurable inactivity timeout with automatic session termination.

### 7. Clipboard Security
- **Automatic Clearing:** Clipboard is automatically cleared 5 seconds after copying sensitive data.
- **Timer Reset:** Multiple copy operations reset the timer to prevent premature clearing.
- **Secure Clipboard API:** Uses AdvancedSecureClipboard for enhanced protection.

### 8. Password Generation Security
- **Cryptographic Randomness:** Uses `crypto.getRandomValues()` for true randomness.
- **Entropy Validation:** Generated passwords meet minimum 64-bit entropy requirement.
- **Pattern Prevention:** Algorithms prevent predictable or repeating character patterns.

## Network Security
- **Offline-First:** WinVault works offline by default.
- **Localhost Only:** Native messaging and extension servers accept connections ONLY from localhost (127.0.0.1).
- **No Analytics:** No unique identifiers or usage data are sent to external servers.
- **Port Hopping:** Local servers use dynamic port allocation to resist conflict and analysis.

## Security Testing

WinVault maintains a comprehensive test suite with **97 automated tests** covering:

| Test Category | Coverage |
|--------------|----------|
| Encryption & Decryption | AES-256-GCM, key derivation, data integrity |
| Authentication | Password verification, 2FA, biometrics, rate limiting |
| Session Management | Timeout, hardware binding, session validation |
| Memory Security | Anti-debugging, secure memory allocation |
| Clipboard | Timer-based clearing, secure copy operations |
| Password Generator | Entropy scoring, character distribution, uniqueness |
| Form Validation | URL validation, injection prevention |
| UI Security | Auto-lock, theme persistence, responsive layout |

All tests are run using Vitest with jsdom environment for realistic browser simulation.

## Security Best Practices for Users
- Use a strong, unique Master Password (minimum 12 characters recommended).
- Enable Two-Factor Authentication (2FA) or WebAuthn.
- Keep your operating system and WinVault updated.
- Store your 24-word recovery phrase in a secure offline location.
- Configure auto-lock timeout based on your security needs.
- Never share your master password or recovery phrase.

## Security Audit Trail

WinVault maintains an encrypted audit log of security-relevant events:
- Failed login attempts
- Successful authentications
- Settings changes
- Data export operations
- Integrity verification failures
- Rate limiting triggers

This log helps identify potential security issues and unauthorized access attempts.

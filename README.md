# WinVault - Next Gen Secure Password Manager

WinVault is a secure, offline-first password manager built with Electron, React, and WebAssembly. It prioritizes security, performance, and user experience, featuring advanced encryption standards and modern authentication methods.

<div align="center">
<img width="800" alt="WinVault Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 🛡️ Security Features

WinVault utilizes military-grade encryption and advanced protection mechanisms:

- **Zero-Knowledge Architecture:** Your data never leaves your device unencrypted.
- **Argon2id & WASM Core:** State-of-the-art key derivation (Argon2id) running in isolated WebAssembly memory for maximum protection.
- **Security Auditing & Logging:** Comprehensive `securityLogger` tracks failed logins, integrity breaches, and suspicious activity in an encrypted audit trail.
- **Enhanced Rate Limiting:** Intelligent protection using exponential backoff and device fingerprinting to thwart brute-force attacks.
- **Platform Hardening:**
  - **Strict CSP:** Comprehensive Content Security Policy to prevent XSS.
  - **Memory Protection:** Active anti-debugging with panic mode and OS-level key encryption (SafeStorage).
  - **Secure Auto-Type:** Fileless credential injection using direct memory streams (stdin pipe) to reduce forensic footprint.
- **Hardware Integration:** 
  - **WebAuthn / FIDO2:** Support for YubiKey/Titan keys via cross-platform credentials.
  - **Biometrics:** Windows Hello and TouchID integration.
- **Data Integrity:** Database protected by HMAC-SHA256 signature verification.

> For a deep dive into our security architecture, please read [SECURITY.md](SECURITY.md).

## 🚀 Key Features

- **Modern Dashboard:** Intuitive interface built with React and TailwindCSS.
- **Vault Management:** Securely store logins, credit cards, identities, and secure notes.
- **TOTP Authenticator:** Built-in Two-Factor Authentication code generator.
- **Password Generator:** Customizable, cryptographically strong password generation with entropy scoring.
- **Data Import/Export:** Seamless migration with encrypted JSON and CSV support.
- **Biometric Unlock:** Windows Hello and TouchID integration.
- **CLI Support:** Command-line interface for scripting and automation.
- **Multi-Language:** Full support for English and Turkish interfaces.
- **Responsive Layout:** Optimized Mini Mode and Full Mode for different workflows.
- **Auto-Lock:** Configurable inactivity timeout for enhanced security.
- **Clipboard Protection:** Automatic clipboard clearing after configurable timeout (default 5 seconds).

## 🛠️ Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn

### Installation

#### Windows

Download the latest installer from the [Releases](../../releases) page and run the setup.

#### Linux

Choose your preferred package format:

**AppImage (Universal Linux)** - Works on all Linux distributions:
```bash
chmod +x WinVault-2.1.0-x86_64.AppImage
./WinVault-2.1.0-x86_64.AppImage
```

**DEB Package (Debian/Ubuntu/Mint)** - Install via package manager:
```bash
sudo dpkg -i WinVault_2.1.0_amd64.deb
sudo apt-get install -f  # Install dependencies if needed
```

**Available Versions:**
- **x86_64 (Intel/AMD)**: `WinVault-2.1.0-x86_64.AppImage` (131 MB), `WinVault_2.1.0_amd64.deb` (85 MB)
- **ARM64 (Apple Silicon/ARM devices)**: `WinVault-2.1.0-arm64.AppImage` (131 MB), `WinVault_2.1.0_arm64.deb` (80 MB)

**Checksums:**
```
WinVault-2.1.0-x86_64.AppImage: a0cc6dcac0395547cff18d6839a8ea605d3effe0b293db6e90bcf43bee0f79ab
WinVault_2.1.0_amd64.deb: 17a017ed49fd137b06cba6decb7d0d2cbbfd3ac0a9849bb16bdd0abc97dd073b
WinVault-2.1.0-arm64.AppImage: 8496b1d5afc2c57f92bd4f63df8de460c93c5356b371eea46b4f16e630e52b3b
WinVault_2.1.0_arm64.deb: d889a98c6fad7a73904b6347602302cbd419b26e0f5db49595df87f96661d378
```

#### Development

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Start the development server (Browser mode):
   ```bash
   npm run dev
   ```

3. Run the Electron application locally:
   ```bash
   npm run electron:dev
   ```

4. Build Linux packages:
   ```bash
   npm run build:linux        # Build all Linux packages
   npm run build:linux:x64    # Build x64 only
   npm run build:linux:arm64  # Build ARM64 only
   npm run build:linux:appimage  # Build AppImage only
   npm run build:linux:deb   # Build DEB only
   ```

### 🧪 Running Tests

WinVault includes a comprehensive suite of **97 automated tests** covering security, vault operations, and UI functionality:

```bash
# Run all tests
npm test

# Run specific test categories
npm test tests/security/    # Security tests (encryption, session, rate limiting)
npm test tests/vault/       # Vault tests (generator, validation, integrity)
npm test tests/ui/          # UI tests (auto-lock, clipboard, responsive layout)

# Run a specific test file
npm test -- rateLimiter.test.ts
npm test -- generator.test.ts
```

#### Test Coverage

| Category | Tests | Description |
|----------|-------|-------------|
| **Security** | 41 | Encryption, authentication, session management, rate limiting, memory protection |
| **Vault** | 23 | Password generator, entropy validation, form validation, data integrity |
| **UI** | 33 | Auto-lock, clipboard timeout, theme persistence, language sync, responsive layout |

### Building for Production

To create an optimized executable/installer for your OS:

```bash
npm run build
# This triggers the full build pipeline including Vite and Electron Builder
```

### Command Line Interface (CLI)

WinVault includes a CLI for advanced users and automation:

```bash
# List all vault entries
winvault-cli list

# Search for entries
winvault-cli search "google"

# Get specific entry details
winvault-cli get <entry-id>
```

## 📋 Version History

- **v2.0.1** - Current stable release with comprehensive test coverage
- **v2.0.0** - Major release with WASM security core and enhanced encryption
- **v1.1.x** - Added biometric authentication and WebAuthn support
- **v1.0.x** - Initial release

## 🔒 License

Proprietary Software. Please refer to [EULA.txt](EULA.txt) for license terms.

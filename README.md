# WinVault - Next Gen Secure Password Manager

WinVault is a secure, offline-first password manager built with Electron, React, and WebAssembly. It prioritizes security, performance, and user experience, featuring advanced encryption standards and modern authentication methods.

<div align="center">
<img width="800" alt="WinVault Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 🛡️ Security Features

WinVault utilizes military-grade encryption and advanced protection mechanisms:

- **Zero-Knowledge Architecture:** Your data never leaves your device unencrypted.
- **Argon2id & WASM Core:** State-of-the-art key derivation (Argon2id) running in isolated WebAssembly memory for maximum protection.
- **Platform Hardening:**
  - **Strict CSP:** Comprehensive Content Security Policy to prevent XSS.
  - **Memory Protection:** Active anti-debugging with panic mode and OS-level key encryption (SafeStorage).
  - **Dynamic Ports:** Extension server uses port hopping to resist conflict and analysis.
- **Hardware Integration:** 
  - **WebAuthn / FIDO2:** Support for YubiKey/Titan keys via cross-platform credentials.
  - **Biometrics:** Windows Hello and TouchID integration.
- **Data Integrity:** Database protected by HMAC-SHA256 signature verification.

> For a deep dive into our security architecture, please read [SECURITY.md](SECURITY.md).

## 🚀 Key Features

- **Modern Dashboard:** Intuitive interface built with React and TailwindCSS.
- **Vault Management:** Securely store logins, credit cards, identities, and secure notes.
- **TOTP Authenticator:** Built-in Two-Factor Authentication code generator.
- **Password Generator:** Customizable, cryptographically strong password generation.
- **Data Import/Export:** Seamless migration with encrypted JSON and CSV support.
- **Biometric Unlock:** Windows Hello and TouchID integration.

## 🛠️ Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn

### Installation

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

### Building for Production

To create an optimized executable/installer for your OS:

```bash
npm run build
# This triggers the full build pipeline including Vite and Electron Builder
```

## 🔒 License

Proprietary Software. Please refer to [EULA.txt](EULA.txt) for license terms.

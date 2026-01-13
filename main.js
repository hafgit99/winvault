const { app, BrowserWindow, ipcMain, globalShortcut, dialog, safeStorage } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

let mainWindow;

// Helper: Get Active Window Title (Windows only for now)
const getActiveWindowTitle = () => {
  return new Promise((resolve, reject) => {
    const psScript = `
      Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        public class Win32 {
          [DllImport("user32.dll")]
          public static extern IntPtr GetForegroundWindow();
          [DllImport("user32.dll")]
          public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
        }
      "@
      $hwnd = [Win32]::GetForegroundWindow()
      $sb = [System.Text.StringBuilder]::new(256)
      [void][Win32]::GetWindowText($hwnd, $sb, 256)
      $sb.ToString()
    `;

    // Using powershell to execute
    const command = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"')}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Title Error:', error);
        resolve('');
        return;
      }
      resolve(stdout.trim());
    });
  });
};

// Helper: Send Keys via VBScript (More reliable for mixed characters than raw PS SendKeys)
const sendKeys = (username, password) => {
  // Escape special characters for SendKeys: + ^ % ~ ( ) { } [ ]
  // VBScript SendKeys special chars: + ^ % ~ ( ) { } [ ]
  const escape = (str) => {
    if (!str) return '';
    return str.replace(/([+^%~(){}[\]])/g, "{$1}");
  };

  const userEsc = escape(username);
  const passEsc = escape(password);

  const vbsContent = `
    Set WshShell = WScript.CreateObject("WScript.Shell")
    WScript.Sleep 500
    WshShell.SendKeys "${userEsc}"
    WScript.Sleep 300
    WshShell.SendKeys "{TAB}"
    WScript.Sleep 300
    WshShell.SendKeys "${passEsc}"
    WScript.Sleep 300
    WshShell.SendKeys "{ENTER}"
  `;

  const tempPath = path.join(os.tmpdir(), `autotype_${Date.now()}.vbs`);
  fs.writeFileSync(tempPath, vbsContent);

  exec(`cscript //Nologo "${tempPath}"`, (err) => {
    if (err) console.error("AutoType Error:", err);
    // Cleanup
  });
};

// Biometric Helpers (Windows Hello via PowerShell)
const checkBiometryAvailability = () => {
  return new Promise((resolve) => {
    const psScript = `
      Add-Type -AssemblyName System.Runtime.WindowsRuntime
      $asb = [System.Runtime.InteropServices.WindowsRuntime.AsyncInfo]
      [Windows.Security.Credentials.UI.UserConsentVerifier, Windows.Security.Credentials.UI, ContentType=WindowsRuntime] | Out-Null
      $res = [Windows.Security.Credentials.UI.UserConsentVerifier]::CheckAvailabilityAsync().GetResults()
      $res -eq "Available"
    `;
    const command = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"')}"`;
    exec(command, (error, stdout) => {
      resolve(stdout.trim().toLowerCase() === 'true');
    });
  });
};

const promptBiometry = (reason) => {
  return new Promise((resolve) => {
    const psScript = `
      Add-Type -AssemblyName System.Runtime.WindowsRuntime
      [Windows.Security.Credentials.UI.UserConsentVerifier, Windows.Security.Credentials.UI, ContentType=WindowsRuntime] | Out-Null
      $operation = [Windows.Security.Credentials.UI.UserConsentVerifier]::RequestVerificationAsync("${reason}")
      $result = $operation.GetResults()
      $result -eq "Verified"
    `;
    const command = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"')}"`;
    exec(command, (error, stdout) => {
      resolve(stdout.trim().toLowerCase() === 'true');
    });
  });
};

function createWindow() {
  // Geliştirme ortamında (isPackaged false ise) public klasöründen, 
  // üretimde (build sonrası) build klasöründen ikonu al.
  const isDev = !app.isPackaged;
  const iconPath = isDev
    ? path.join(__dirname, 'public/favicon.ico')
    : path.join(__dirname, 'build/favicon.ico');

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 360,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: isDev,
      sandbox: true,
      webSecurity: true,
      disableBlinkFeatures: 'Auxclick'
    },
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    title: 'WinVault',
    icon: iconPath,
    show: false
  });

  // Security
  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error(`Unable to load preload ${preloadPath}: ${error.message}`);
  });

  // CSP Settings
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; connect-src 'self' http://127.0.0.1:* https: ws:;"
        ],
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY']
      }
    });
  });

  const isDevelopment = process.env.ELECTRON_START_URL;
  const startUrl = isDevelopment
    ? process.env.ELECTRON_START_URL
    : `file://${path.join(__dirname, 'build/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDevelopment) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Global Panic: Ctrl+Shift+Space 
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('global-shortcut-triggered');
    }
  });

  // Auto-Type: Ctrl+Alt+A
  globalShortcut.register('CommandOrControl+Alt+A', async () => {
    console.log("Auto-Type Triggered");
    try {
      const title = await getActiveWindowTitle();
      console.log("Active Window:", title);
      // Ignore if WinVault itself is active
      if (title.includes("WinVault")) {
        // Maybe just focus?
        return;
      }

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('auto-type-request', title);
      }
    } catch (e) {
      console.error(e);
    }
  });


}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// --- IPC LISTENERS ---

ipcMain.on('set-mini-mode', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.setSize(380, 650, true); // Telefon boyutu
    win.setAlwaysOnTop(true, 'floating'); // Her zaman üstte
  }
});

ipcMain.on('set-normal-mode', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.setSize(1000, 700, true); // Normal boyut
    win.setAlwaysOnTop(false);
    win.center();
  }
});

ipcMain.on('panic-action', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.minimize();
  }
});

ipcMain.on('perform-auto-type', (event, { username, password }) => {
  sendKeys(username, password);
});

ipcMain.handle('select-backup-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// Backup Encryption Helper - AES-256-GCM
const encryptBackupData = (data) => {
  const key = crypto.randomBytes(32); // 256-bit key
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(data, 'utf-8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  // Format: base64(iv) + '.' + base64(authTag) + '.' + base64(key) + '.' + encrypted
  return Buffer.from(iv).toString('base64') + '.' +
    authTag.toString('base64') + '.' +
    key.toString('base64') + '.' +
    encrypted;
};

const decryptBackupData = (encryptedData) => {
  const parts = encryptedData.split('.');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted backup format');
  }

  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const key = Buffer.from(parts[2], 'base64');
  const encrypted = parts[3];

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'base64', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
};

ipcMain.handle('save-backup-file', async (event, filePath, content) => {
  try {
    const encrypted = encryptBackupData(content);
    fs.writeFileSync(filePath, encrypted, 'utf-8');
    return true;
  } catch (e) {
    console.error("Backup Save Error:", e);
    return false;
  }
});

ipcMain.handle('load-backup-file', async (event, filePath) => {
  try {
    const encrypted = fs.readFileSync(filePath, 'utf-8');
    // Eğer şifreli format değilse (eski backup), direkt döndür
    if (!encrypted.includes('.') || encrypted.split('.').length !== 4) {
      return encrypted;
    }
    const decrypted = decryptBackupData(encrypted);
    return decrypted;
  } catch (e) {
    console.error("Backup Load Error:", e);
    return null;
  }
});

ipcMain.handle('save-file', async (event, { name, data }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;

  // Sanitize filename to remove invalid characters
  const safeName = name.replace(/[<>:"/\\|?*]/g, '_');

  const { filePath } = await dialog.showSaveDialog(win, {
    defaultPath: safeName,
    title: 'Dosyayı Kaydet'
  });

  if (filePath) {
    try {
      let cleanBase64 = data;

      // Robustly extract base64 data (everything after the first comma)
      const commaIndex = data.indexOf(',');
      if (commaIndex !== -1) {
        cleanBase64 = data.substring(commaIndex + 1);
      }

      // Validate base64 data
      if (!cleanBase64 || cleanBase64.trim() === '') {
        console.error("Empty base64 data");
        return false;
      }

      fs.writeFileSync(filePath, Buffer.from(cleanBase64, 'base64'));
      console.log(`File saved successfully: ${filePath}`);
      return true;
    } catch (e) {
      console.error("File Save Error:", e);
      return false;
    }
  }
  return false; // User canceled
});

ipcMain.handle('check-biometry', async () => {
  return await checkBiometryAvailability();
});

ipcMain.handle('prompt-biometry', async (event, reason) => {
  return await promptBiometry(reason);
});

ipcMain.handle('encrypt-key', async (event, key) => {
  if (!safeStorage.isEncryptionAvailable()) return null;
  const buffer = safeStorage.encryptString(key);
  return buffer.toString('base64');
});

ipcMain.handle('decrypt-key', async (event, encryptedKey) => {
  if (!safeStorage.isEncryptionAvailable()) return null;
  const buffer = Buffer.from(encryptedKey, 'base64');
  return safeStorage.decryptString(buffer);
});

// Hardware ID (Motherboard Serial)
ipcMain.handle('get-device-id', async () => {
  return new Promise((resolve) => {
    // First try: Baseboard Serial Number
    exec('wmic baseboard get serialnumber', (error, stdout) => {
      let serial = '';
      if (!error && stdout) {
        serial = stdout.replace('SerialNumber', '').trim();
      }

      // Validation: If empty or default string, fallback to CPU ID or UUID
      if (!serial || serial === 'Default String' || serial.length < 3) {
        exec('wmic csproduct get uuid', (err2, stdout2) => {
          if (!err2 && stdout2) {
            resolve(stdout2.replace('UUID', '').trim());
          } else {
            resolve('UNKNOWN-HWID-' + Math.random().toString(36).substring(7));
          }
        });
      } else {
        resolve(serial);
      }
    });
  });
});

// --- BROWSER EXTENSION SERVER (Native Messaging Compatible) ---
const http = require('http');
const EXT_PORT = 19845;

// Rate limiting for security
const rateLimiter = new Map();

const rateLimitCheck = (clientIP) => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 200;

  if (!rateLimiter.has(clientIP)) {
    rateLimiter.set(clientIP, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  const client = rateLimiter.get(clientIP);
  if (now > client.resetTime) {
    rateLimiter.set(clientIP, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (client.count >= maxRequests) {
    return { allowed: false, waitTime: client.resetTime - now };
  }

  client.count++;
  return { allowed: true };
};

// Validate localhost connection only
const isLocalhost = (ip) => {
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
};

// HTTP Server for Native Messaging Host communication
const extServer = http.createServer((req, res) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  // CORS for extension (if needed for fallback)
  const origin = req.headers.origin || '';
  if (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Native-Host, X-Request-Id');
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only allow localhost connections
  const clientIP = req.socket.remoteAddress || req.connection.remoteAddress || '';
  if (!isLocalhost(clientIP)) {
    console.warn('[ExtServer] Rejected non-localhost connection:', clientIP);
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Only localhost connections allowed' }));
    return;
  }

  // Rate limiting check
  const rateLimitResult = rateLimitCheck(clientIP);
  if (!rateLimitResult.allowed) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Rate limit exceeded', waitTime: rateLimitResult.waitTime }));
    return;
  }

  // Verify Native Host header
  const nativeHostHeader = (req.headers['x-native-host'] || '').toLowerCase().trim();

  if (req.url !== '/api/status' && nativeHostHeader !== 'winvault') {
    console.warn(`[ExtServer] Invalid X-Native-Host: "${nativeHostHeader}" (Expected: "winvault") from URL: ${req.url}`);
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid request source', received: nativeHostHeader }));
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);


    // --- API Status Check (for debugging) ---
    if (url.pathname === '/api/status' && req.method === 'GET') {
      const isLocked = !mainWindow || mainWindow.isDestroyed();
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'online',
        version: '2.0.0',
        appReady: !isLocked,
        timestamp: Date.now()
      }));
      return;
    }

    // --- Native Messaging API: Message Handler ---
    if (url.pathname === '/api/native-message' && req.method === 'POST') {
      if (!mainWindow || mainWindow.isDestroyed()) {
        res.writeHead(503);
        res.end(JSON.stringify({ error: 'WinVault is not ready' }));
        return;
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
        // Size protection (max 64KB)
        if (body.length > 64 * 1024) {
          req.socket.destroy();
        }
      });

      req.on('end', async () => {
        try {
          const message = JSON.parse(body);
          const { action, requestId, domain, username, password } = message;

          if (!requestId) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Request ID required' }));
            return;
          }

          console.log(`[ExtServer] Native message: ${action} (${requestId})`);

          // Handle different actions
          switch (action) {
            case 'SEARCH':
              if (!domain) {
                res.writeHead(400);
                res.end(JSON.stringify({ requestId, error: 'Domain required' }));
                return;
              }

              // Setup response handler
              let responded = false;
              const searchTimeout = setTimeout(() => {
                if (!responded) {
                  responded = true;
                  res.writeHead(408);
                  res.end(JSON.stringify({ requestId, error: 'Search timeout' }));
                }
              }, 4000);

              const searchHandler = (event, results) => {
                if (responded) return;
                responded = true;
                clearTimeout(searchTimeout);

                res.writeHead(200);
                res.end(JSON.stringify({
                  requestId,
                  results: results || [],
                  appStatus: 'unlocked'
                }));
              };

              ipcMain.once('extension-search-response', searchHandler);
              mainWindow.webContents.send('extension-search-request', domain);
              break;

            case 'SAVE':
              if (!domain || !username || !password) {
                res.writeHead(400);
                res.end(JSON.stringify({ requestId, error: 'Missing fields' }));
                return;
              }

              let saveResponded = false;
              const saveTimeout = setTimeout(() => {
                if (!saveResponded) {
                  saveResponded = true;
                  res.writeHead(408);
                  res.end(JSON.stringify({ requestId, error: 'Save timeout' }));
                }
              }, 4000);

              const saveHandler = (event, result) => {
                if (saveResponded) return;
                saveResponded = true;
                clearTimeout(saveTimeout);

                res.writeHead(200);
                res.end(JSON.stringify({
                  requestId,
                  ok: result && result.ok,
                  message: result?.message || 'Saved'
                }));
              };

              ipcMain.once('extension-save-response', saveHandler);
              mainWindow.webContents.send('extension-save-request', { domain, username, password });
              break;

            default:
              res.writeHead(400);
              res.end(JSON.stringify({ requestId, error: 'Unknown action' }));
          }

        } catch (error) {
          console.error('[ExtServer] Parse error:', error.message);
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });

      return;
    }

    // 404 for other paths
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));

  } catch (e) {
    console.error('[ExtServer] Error:', e.message);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

// Start extension server with Port Hopping
let currentPort = EXT_PORT;
const startServer = (port) => {
  extServer.listen(port, '127.0.0.1', () => {
    console.log(`[ExtServer] WinVault Extension Server running on 127.0.0.1:${port}`);
  });
};

startServer(currentPort);

// Error handling for server
extServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[ExtServer] Port ${currentPort} is already in use, trying next...`);
    currentPort++;
    if (currentPort < EXT_PORT + 10) {
      setTimeout(() => {
        extServer.removeAllListeners('listening'); // Clean up old listeners if any
        try { extServer.close(); } catch (e) { }
        startServer(currentPort);
      }, 100);
    } else {
      console.error('[ExtServer] Could not find an available port.');
    }
  } else {
    console.error('[ExtServer] Server error:', err.message);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup on exit
app.on('will-quit', () => {
  extServer.close();
});
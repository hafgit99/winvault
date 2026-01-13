
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  setMiniMode: () => ipcRenderer.send('set-mini-mode'),
  setNormalMode: () => ipcRenderer.send('set-normal-mode'),
  onGlobalShortcut: (callback) => ipcRenderer.on('global-shortcut-triggered', callback),
  panic: () => ipcRenderer.send('panic-action'),
  onAutoTypeRequest: (callback) => ipcRenderer.on('auto-type-request', callback),
  performAutoType: (data) => ipcRenderer.send('perform-auto-type', data),
  selectBackupFolder: () => ipcRenderer.invoke('select-backup-folder'),
  saveBackupFile: (path, content) => ipcRenderer.invoke('save-backup-file', path, content),
  loadBackupFile: (path) => ipcRenderer.invoke('load-backup-file', path),
  checkBiometry: () => ipcRenderer.invoke('check-biometry'),
  promptBiometry: (reason) => ipcRenderer.invoke('prompt-biometry', reason),
  encryptKey: (key) => ipcRenderer.invoke('encrypt-key', key),
  decryptKey: (encryptedKey) => ipcRenderer.invoke('decrypt-key', encryptedKey),
  getDeviceId: () => ipcRenderer.invoke('get-device-id'),
  // File System
  saveFile: (name, data) => ipcRenderer.invoke('save-file', { name, data }),
  // Extension Hooks
  onExtensionSearchRequest: (callback) => ipcRenderer.on('extension-search-request', callback),
  sendExtensionSearchResponse: (results) => ipcRenderer.send('extension-search-response', results),
  onExtensionSaveRequest: (callback) => ipcRenderer.on('extension-save-request', callback),
  sendExtensionSaveResponse: (payload) => ipcRenderer.send('extension-save-response', payload)
});


const DB_NAME = 'WinVaultDB';
const DB_VERSION = 4; // Incremented for HMAC integrity
const STORE_DATA = 'vault_data'; // Şifreli veriler için
const STORE_FAKE_DATA = 'vault_fake_data'; // Sahte veriler için
const STORE_CONFIG = 'vault_config'; // Ayarlar ve güvenlik için

// Database Integrity için HMAC interface
interface StoredData {
  data: string;
  hmac: string; // SHA-256 HMAC
  timestamp: number;
}

interface IDBService {
  init: () => Promise<void>;
  saveData: (key: string, data: any) => Promise<void>;
  getData: (key: string) => Promise<any>;
  deleteData: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

let dbInstance: IDBDatabase | null = null;
let hmacKey: CryptoKey | null = null;

const resetInternalState = () => {
  dbInstance = null;
  hmacKey = null;
};

// HMAC key'i başlat veya yükle
// HMAC key'i başlat veya yükle
const initHmacKey = async (): Promise<CryptoKey> => {
  if (hmacKey) return hmacKey;

  // LocalStorage'dan key'i yükle veya yeni oluştur
  const storedKey = localStorage.getItem('__wv_integrity_key');
  const electron = (window as any).electron;

  if (storedKey) {
    let keyRawStr = storedKey;

    // SafeStorage ile şifrelenmiş mi kontrol et ve çöz
    if (electron && electron.decryptKey && !storedKey.match(/^[A-Za-z0-9+/=]+$/)) { // Basit base64 regex kontrolü veya try-catch
      // Not: SafeStorage genellikle hex veya farklı format dönebilir, ama biz decrypt deneyeceğiz.
      // WinVault encryptKey sonucu ne dönüyor? (Base64 veya Hex).
      // Güvenli yöntem: decryptKey çağır, hata verirse veya boş dönerse raw kabul et (eski veri uyumluluğu)
      try {
        const decrypted = await electron.decryptKey(storedKey);
        if (decrypted) keyRawStr = decrypted;
      } catch (e) {
        console.warn("HMAC Key decrypt failed, assuming plain base64 (legacy mode)", e);
      }
    }

    const keyData = Uint8Array.from(atob(keyRawStr), c => c.charCodeAt(0));
    hmacKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
  } else {
    // Yeni key oluştur
    hmacKey = await crypto.subtle.generateKey(
      { name: 'HMAC', hash: 'SHA-256' },
      true,
      ['sign', 'verify']
    );
    // Key'i sakla
    const exported = await crypto.subtle.exportKey('raw', hmacKey);
    const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));

    // Electron SafeStorage ile şifrele
    if (electron && electron.encryptKey) {
      try {
        const encryptedKey = await electron.encryptKey(keyBase64);
        localStorage.setItem('__wv_integrity_key', encryptedKey || keyBase64);
      } catch (e) {
        console.error("HMAC Key encryption failed", e);
        localStorage.setItem('__wv_integrity_key', keyBase64);
      }
    } else {
      localStorage.setItem('__wv_integrity_key', keyBase64);
    }
  }

  return hmacKey;
};

// HMAC hesapla
const calculateHmac = async (data: string): Promise<string> => {
  const key = await initHmacKey();
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

// HMAC doğrula
const verifyHmac = async (data: string, expectedHmac: string): Promise<boolean> => {
  const key = await initHmacKey();
  const encoder = new TextEncoder();
  const expectedBytes = Uint8Array.from(atob(expectedHmac), c => c.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, expectedBytes, encoder.encode(data));
};

const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve();
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", request.error);
      reject("Veritabanı açılamadı.");
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Ana veri deposu (Şifreli içerik için)
      if (!db.objectStoreNames.contains(STORE_DATA)) {
        db.createObjectStore(STORE_DATA);
      }

      // Konfigürasyon deposu (Ayarlar, Hash vb. için)
      if (!db.objectStoreNames.contains(STORE_CONFIG)) {
        db.createObjectStore(STORE_CONFIG);
      }

      // Fake data store
      if (!db.objectStoreNames.contains(STORE_FAKE_DATA)) {
        db.createObjectStore(STORE_FAKE_DATA);
      }

      // Version 3 migration - Security enhancements
      if (event.oldVersion < 3) {
        console.log('Migrating to security enhanced version 3');
        // Migration will be handled in the app layer
      }
    };
  });
};

const saveData = async (storeName: string, key: string, value: any): Promise<void> => {
  await initDB();
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject("DB not initialized");

    const transaction = dbInstance.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(value, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// HMAC ile veri kaydet (bütünlük korumalı)
const saveDataWithHmac = async (storeName: string, key: string, data: string): Promise<void> => {
  const hmac = await calculateHmac(data);
  const storedData: StoredData = {
    data,
    hmac,
    timestamp: Date.now()
  };
  await saveData(storeName, key, storedData);
};

const getData = async (storeName: string, key: string): Promise<any> => {
  await initDB();
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject("DB not initialized");

    const transaction = dbInstance.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// HMAC ile veri oku ve doğrula (bütünlük kontrolü)
const getDataWithHmac = async (storeName: string, key: string): Promise<string | null> => {
  const stored = await getData(storeName, key);

  // Eski format (HMAC'siz) kontrolü
  if (!stored) return null;
  if (typeof stored === 'string') return stored; // Eski format

  // Yeni format (StoredData)
  const storedData = stored as StoredData;
  if (!storedData.data || !storedData.hmac) {
    console.warn('Invalid stored data format');
    return null;
  }

  // HMAC doğrulaması
  const isValid = await verifyHmac(storedData.data, storedData.hmac);
  if (!isValid) {
    console.error('HMAC verification failed! Data integrity compromised.');
    throw new Error('Data integrity check failed');
  }

  return storedData.data;
};

const deleteData = async (storeName: string, key: string): Promise<void> => {
  await initDB();
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject("DB not initialized");

    const transaction = dbInstance.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const clear = async (): Promise<void> => {
  await initDB();
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject("DB not initialized");
    const transaction = dbInstance.transaction([STORE_DATA, STORE_CONFIG], 'readwrite');

    transaction.objectStore(STORE_DATA).clear();
    transaction.objectStore(STORE_CONFIG).clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const dbService = {
  init: initDB, // Exposed init method
  // Şifreli ana veriyi kaydet/getir (HMAC ile)
  saveEncryptedBlob: (data: string) => saveDataWithHmac(STORE_DATA, 'main_blob', data),
  getEncryptedBlob: () => getDataWithHmac(STORE_DATA, 'main_blob'),

  // Sahte şifreli veriyi kaydet/getir
  saveFakeEncryptedBlob: (data: string) => saveData(STORE_FAKE_DATA, 'fake_blob', data),
  getFakeEncryptedBlob: () => getData(STORE_FAKE_DATA, 'fake_blob'),

  // Güvenlik ayarlarını kaydet/getir (Hash, 2FA vb.)
  saveSecurityConfig: (config: any) => saveData(STORE_CONFIG, 'security', config),
  getSecurityConfig: () => getData(STORE_CONFIG, 'security'),

  // Genel ayarları kaydet/getir
  saveSettings: (settings: any) => saveData(STORE_CONFIG, 'settings', settings),
  getSettings: () => getData(STORE_CONFIG, 'settings'),

  // Kategorileri kaydet/getir
  saveCategories: (categories: any) => saveData(STORE_CONFIG, 'categories', categories),
  getCategories: () => getData(STORE_CONFIG, 'categories'),

  // Genel config kaydet/getir
  saveConfig: (key: string, value: any) => saveData(STORE_CONFIG, key, value),
  getConfig: (key: string) => getData(STORE_CONFIG, key),

  clear: clear,
  resetInternalState: resetInternalState
};

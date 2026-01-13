/**
 * WinVault Browser Extension - Background Service Worker
 * 
 * Güvenlik Özellikleri:
 * - Native Messaging ile güvenli iletişim (port açılmaz)
 * - Otomatik bağlantı yönetimi
 * - İstek zaman aşımı koruması
 * - Bellek temizleme
 * 
 * @version 2.0.0
 */

const NATIVE_HOST_NAME = "com.winvault.extension";
const REQUEST_TIMEOUT = 5000; // 5 saniye
const CONNECTION_RETRY_DELAY = 1000;
const MAX_RETRIES = 3;

// Bağlantı durumu
let nativePort = null;
let isConnecting = false;
let connectionRetries = 0;
let pendingRequests = new Map();
let messageIdCounter = 0;

// Güvenli ID üretimi
function generateRequestId() {
    return `${Date.now()}-${++messageIdCounter}-${Math.random().toString(36).substring(2, 8)}`;
}

// Native Host'a bağlan
function connectToNativeHost() {
    if (nativePort || isConnecting) {
        return Promise.resolve(!!nativePort);
    }

    isConnecting = true;

    return new Promise((resolve) => {
        try {
            console.log("[WinVault] Native Host'a bağlanılıyor...");
            nativePort = chrome.runtime.connectNative(NATIVE_HOST_NAME);

            nativePort.onMessage.addListener(handleNativeMessage);

            nativePort.onDisconnect.addListener(() => {
                const error = chrome.runtime.lastError;
                console.log("[WinVault] Native Host bağlantısı kesildi:", error?.message || "Bilinmiyor");

                nativePort = null;
                isConnecting = false;

                // Bekleyen tüm istekleri hata ile sonlandır
                pendingRequests.forEach((pending, id) => {
                    pending.reject(new Error("Bağlantı kesildi"));
                    pendingRequests.delete(id);
                });

                // Rozet güncelle
                updateBadge("!", "#ef4444");
            });

            // Bağlantı testi gönder
            nativePort.postMessage({ action: "PING", requestId: "init" });

            connectionRetries = 0;
            isConnecting = false;
            console.log("[WinVault] Native Host bağlantısı başarılı");
            updateBadge("", "#22c55e");
            resolve(true);

        } catch (error) {
            console.error("[WinVault] Native Host bağlantı hatası:", error);
            nativePort = null;
            isConnecting = false;
            connectionRetries++;

            if (connectionRetries < MAX_RETRIES) {
                setTimeout(() => connectToNativeHost().then(resolve), CONNECTION_RETRY_DELAY);
            } else {
                updateBadge("!", "#ef4444");
                resolve(false);
            }
        }
    });
}

// Native Host'tan gelen mesajları işle
function handleNativeMessage(message) {
    console.log("[WinVault] Native mesaj alındı:", message.action || message.requestId);

    if (message.requestId && pendingRequests.has(message.requestId)) {
        const pending = pendingRequests.get(message.requestId);
        clearTimeout(pending.timeout);

        if (message.error) {
            pending.reject(new Error(message.error));
        } else {
            pending.resolve(message);
        }

        pendingRequests.delete(message.requestId);

        // Hassas verileri bellekten temizle
        if (message.results) {
            setTimeout(() => secureWipeObject(message), 100);
        }
    }

    // PONG yanıtı - bağlantı onayı
    if (message.action === "PONG") {
        console.log("[WinVault] Native mesaj alındı:", message.action || message.requestId);
        updateBadge("", "#22c55e");
    }

    // Uygulama durumu değişiklikleri
    if (message.action === "APP_LOCKED") {
        updateBadge("🔒", "#f59e0b");
    } else if (message.action === "APP_UNLOCKED") {
        updateBadge("", "#22c55e");
    }
}

// Native Host'a güvenli mesaj gönder
function sendNativeMessage(action, data = {}) {
    return new Promise(async (resolve, reject) => {
        // Bağlantı kontrolü
        if (!nativePort) {
            const connected = await connectToNativeHost();
            if (!connected) {
                reject(new Error("WinVault uygulaması çalışmıyor veya bağlantı kurulamadı"));
                return;
            }
        }

        const requestId = generateRequestId();

        // Timeout ayarla
        const timeout = setTimeout(() => {
            if (pendingRequests.has(requestId)) {
                pendingRequests.delete(requestId);
                reject(new Error("İstek zaman aşımına uğradı (5 saniye)"));
            }
        }, REQUEST_TIMEOUT);

        // İsteği kaydet
        pendingRequests.set(requestId, { resolve, reject, timeout });

        // Mesajı gönder
        try {
            nativePort.postMessage({
                requestId,
                action,
                timestamp: Date.now(),
                ...data
            });
        } catch (error) {
            clearTimeout(timeout);
            pendingRequests.delete(requestId);

            // Bağlantı kopmuş olabilir, yeniden dene
            nativePort = null;
            reject(new Error("Mesaj gönderilemedi: " + error.message));
        }
    });
}

// Rozet güncelleme
function updateBadge(text, color) {
    try {
        chrome.action.setBadgeText({ text });
        chrome.action.setBadgeBackgroundColor({ color });
    } catch (e) {
        // Service worker henüz hazır değilse hata yoksay
    }
}

// Hassas verileri bellekten temizle
function secureWipeObject(obj) {
    if (!obj || typeof obj !== 'object') return;

    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            obj[key] = '0'.repeat(obj[key].length);
        } else if (typeof obj[key] === 'object') {
            secureWipeObject(obj[key]);
        }
    }
}

// Extension başlatıldığında
chrome.runtime.onInstalled.addListener(() => {
    console.log("[WinVault] Extension kuruldu/güncellendi");
    updateBadge("", "#64748b");
});

chrome.runtime.onStartup.addListener(() => {
    console.log("[WinVault] Extension başlatıldı");
    connectToNativeHost();
});

// Popup veya content script'ten mesaj dinle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Origin doğrulama - sadece kendi extension'ımızdan
    if (sender.id !== chrome.runtime.id) {
        console.warn("[WinVault] Bilinmeyen kaynak reddedildi:", sender.id);
        sendResponse({ error: "Yetkisiz istek" });
        return false;
    }

    // Şifre arama
    if (request.type === "SEARCH_PASSWORD") {
        const domain = sanitizeDomain(request.domain);

        if (!domain) {
            sendResponse({ error: "Geçersiz domain" });
            return false;
        }

        sendNativeMessage("SEARCH", { domain })
            .then(response => {
                sendResponse({
                    results: response.results || [],
                    appStatus: response.appStatus
                });
            })
            .catch(error => {
                console.error("[WinVault] Arama hatası:", error.message);
                sendResponse({ error: error.message });
            });

        return true; // Async yanıt için
    }

    // Şifre kaydetme
    if (request.type === "SAVE_PASSWORD") {
        const { domain, username, password } = request;

        if (!domain || !username || !password) {
            sendResponse({ error: "Eksik bilgi" });
            return false;
        }

        sendNativeMessage("SAVE", {
            domain: sanitizeDomain(domain),
            username: String(username).substring(0, 256),
            password: String(password).substring(0, 1024)
        })
            .then(response => {
                sendResponse({ ok: response.ok, message: response.message });
            })
            .catch(error => {
                console.error("[WinVault] Kayıt hatası:", error.message);
                sendResponse({ ok: false, error: error.message });
            });

        return true;
    }

    // Bağlantı durumu kontrolü
    if (request.type === "CHECK_STATUS") {
        sendNativeMessage("PING", {})
            .then(() => {
                sendResponse({ connected: true, status: "ready" });
            })
            .catch(error => {
                sendResponse({ connected: false, status: "disconnected", error: error.message });
            });

        return true;
    }

    // Credential doldurma isteği content script'e ilet
    if (request.type === "FILL_CREDENTIALS" && request.tabId) {
        chrome.tabs.sendMessage(request.tabId, {
            type: "FILL_CREDENTIALS",
            username: request.username,
            password: request.password
        }, (response) => {
            sendResponse(response || { success: false });
        });

        return true;
    }
});

// Domain sanitizasyonu
function sanitizeDomain(domain) {
    if (!domain || typeof domain !== 'string') return null;

    // Tehlikeli karakterleri temizle
    let clean = domain.trim().toLowerCase();
    clean = clean.replace(/[<>'"&]/g, '');

    // Maksimum uzunluk
    if (clean.length > 253) {
        clean = clean.substring(0, 253);
    }

    // Basit domain doğrulama
    if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(clean) && clean.length > 2) {
        return null;
    }

    return clean || null;
}

// Tab değişikliklerini dinle (opsiyonel otomatik arama için)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
            // Otomatik rozet güncelleme yapılabilir
        }
    } catch (e) {
        // Tab erişilemez
    }
});

console.log("[WinVault] Background service worker yüklendi");

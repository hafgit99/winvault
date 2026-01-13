/**
 * WinVault - Native Messaging Host
 * 
 * Bu script tarayıcı extension'ı ile Electron uygulaması arasında
 * güvenli bir köprü oluşturur.
 * 
 * Güvenlik Özellikleri:
 * - Stdin/Stdout üzerinden güvenli iletişim (port açılmaz)
 * - İstek doğrulama
 * - Zaman aşımı koruması
 * - Bellek temizleme
 * 
 * @version 2.0.0
 */

const http = require('http');
const crypto = require('crypto');

// Konfigürasyon
const CONFIG = {
    ELECTRON_PORT: 19845,
    ELECTRON_HOST: '127.0.0.1',
    REQUEST_TIMEOUT: 4000,
    MAX_MESSAGE_SIZE: 1024 * 1024, // 1MB
    DEBUG: false
};

// Mesaj okuma buffer'ı
let messageBuffer = Buffer.alloc(0);
let expectedLength = null;

// Debug log
function logDebug(...args) {
    if (CONFIG.DEBUG) {
        process.stderr.write(`[NativeHost] ${args.join(' ')}\n`);
    }
}

// Extension'a mesaj gönder (Native Messaging protokolü)
function sendMessage(msg) {
    try {
        const buffer = Buffer.from(JSON.stringify(msg));
        const header = Buffer.alloc(4);
        header.writeUInt32LE(buffer.length, 0);

        process.stdout.write(header);
        process.stdout.write(buffer);

        logDebug('Mesaj gönderildi:', msg.requestId || 'system');
    } catch (error) {
        logDebug('Mesaj gönderme hatası:', error.message);
    }
}

// Electron uygulamasına HTTP isteği gönder
function sendToElectron(action, data, requestId) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Electron yanıt vermedi (timeout)'));
        }, CONFIG.REQUEST_TIMEOUT);

        const postData = JSON.stringify({
            action,
            requestId,
            timestamp: Date.now(),
            ...data
        });

        const options = {
            hostname: CONFIG.ELECTRON_HOST,
            port: CONFIG.ELECTRON_PORT,
            path: '/api/native-message',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'X-Native-Host': 'winvault',
                'X-Request-Id': requestId
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;

                // Boyut kontrolü
                if (responseData.length > CONFIG.MAX_MESSAGE_SIZE) {
                    req.destroy();
                    clearTimeout(timeout);
                    reject(new Error('Yanıt çok büyük'));
                }
            });

            res.on('end', () => {
                clearTimeout(timeout);

                try {
                    if (res.statusCode === 200) {
                        const json = JSON.parse(responseData);
                        resolve(json);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                    }
                } catch (e) {
                    reject(new Error('Geçersiz JSON yanıtı'));
                }
            });
        });

        req.on('error', (error) => {
            clearTimeout(timeout);

            if (error.code === 'ECONNREFUSED') {
                reject(new Error('WinVault uygulaması çalışmıyor'));
            } else {
                reject(new Error(`Bağlantı hatası: ${error.message}`));
            }
        });

        req.write(postData);
        req.end();
    });
}

// Gelen mesajı işle
async function handleMessage(msg) {
    const { requestId, action, ...data } = msg;

    if (!requestId) {
        sendMessage({ error: 'İstek ID\'si eksik' });
        return;
    }

    logDebug(`İstek alındı: ${action} (${requestId})`);

    try {
        switch (action) {
            case 'PING':
                // Basit canlılık kontrolü
                sendMessage({
                    requestId,
                    action: 'PONG',
                    timestamp: Date.now()
                });
                break;

            case 'SEARCH':
                // Şifre arama
                if (!data.domain) {
                    sendMessage({ requestId, error: 'Domain gerekli' });
                    return;
                }

                const searchResult = await sendToElectron('SEARCH', { domain: data.domain }, requestId);
                sendMessage({
                    requestId,
                    results: searchResult.results || [],
                    appStatus: searchResult.appStatus
                });
                break;

            case 'SAVE':
                // Şifre kaydetme
                if (!data.domain || !data.username || !data.password) {
                    sendMessage({ requestId, error: 'Eksik bilgi' });
                    return;
                }

                const saveResult = await sendToElectron('SAVE', {
                    domain: data.domain,
                    username: data.username,
                    password: data.password
                }, requestId);

                sendMessage({
                    requestId,
                    ok: saveResult.ok,
                    message: saveResult.message
                });

                // Hassas verileri temizle
                data.password = null;
                break;

            default:
                sendMessage({ requestId, error: 'Bilinmeyen komut: ' + action });
        }
    } catch (error) {
        logDebug('Hata:', error.message);
        sendMessage({
            requestId,
            error: error.message || 'İşlem başarısız'
        });
    }
}

// Stdin'den veri oku (Native Messaging protokolü)
process.stdin.on('data', (chunk) => {
    messageBuffer = Buffer.concat([messageBuffer, chunk]);

    // Birden fazla mesaj gelebilir, hepsini işle
    while (true) {
        // Önce 4 byte uzunluk header'ı oku
        if (expectedLength === null) {
            if (messageBuffer.length >= 4) {
                expectedLength = messageBuffer.readUInt32LE(0);
                messageBuffer = messageBuffer.slice(4);

                // Boyut kontrolü
                if (expectedLength > CONFIG.MAX_MESSAGE_SIZE) {
                    logDebug('Mesaj çok büyük:', expectedLength);
                    sendMessage({ error: 'Mesaj boyutu çok büyük' });
                    expectedLength = null;
                    messageBuffer = Buffer.alloc(0);
                    continue;
                }
            } else {
                break; // Daha fazla veri bekle
            }
        }

        // Mesaj gövdesini oku
        if (expectedLength !== null) {
            if (messageBuffer.length >= expectedLength) {
                const msgStr = messageBuffer.slice(0, expectedLength).toString('utf8');
                messageBuffer = messageBuffer.slice(expectedLength);
                expectedLength = null;

                try {
                    const msg = JSON.parse(msgStr);
                    handleMessage(msg);
                } catch (e) {
                    logDebug('JSON parse hatası:', e.message);
                    sendMessage({ error: 'Geçersiz JSON formatı' });
                }
            } else {
                break; // Daha fazla veri bekle
            }
        }
    }
});

// Stdin kapandığında temiz çıkış
process.stdin.on('end', () => {
    logDebug('Stdin kapandı, çıkış yapılıyor');
    process.exit(0);
});

// Yakalanmamış hataları yakala
process.on('uncaughtException', (error) => {
    logDebug('Yakalanmamış hata:', error.message);
    sendMessage({ error: 'Kritik hata: ' + error.message });
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logDebug('İşlenmemiş Promise reddi:', reason);
});

// Başlangıç mesajı
logDebug('Native Messaging Host başlatıldı');
sendMessage({ action: 'READY', version: '2.0.0' });

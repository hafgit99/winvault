/**
 * Aegis Vault Browser Extension - Content Script
 * 
 * Güvenlik Özellikleri:
 * - Site kısıtlaması (tehlikeli URL'ler engellenir)
 * - XSS koruması
 * - Form doldurma doğrulaması
 * - Hassas veri temizleme
 * 
 * @version 2.0.0
 */

(function () {
    'use strict';

    // Tehlikeli sayfalarda çalışma
    const BLOCKED_PROTOCOLS = ['chrome:', 'chrome-extension:', 'edge:', 'about:', 'file:', 'javascript:', 'data:'];
    const currentUrl = window.location.href.toLowerCase();

    if (BLOCKED_PROTOCOLS.some(protocol => currentUrl.startsWith(protocol))) {
        console.log("[Aegis] Bu sayfa desteklenmiyor");
        return;
    }

    // Zaten yüklenmişse tekrar yükleme
    if (window.__aegisVaultLoaded) {
        return;
    }
    window.__aegisVaultLoaded = true;

    console.log("[Aegis] Content script yüklendi:", window.location.hostname);

    // Form alanlarını bul
    function findLoginFields() {
        const inputs = document.querySelectorAll('input');
        let usernameField = null;
        let passwordField = null;

        inputs.forEach(input => {
            if (!input || input.type === 'hidden' || !isVisible(input)) return;

            const type = (input.type || '').toLowerCase();
            const name = (input.name || '').toLowerCase();
            const id = (input.id || '').toLowerCase();
            const autocomplete = (input.autocomplete || '').toLowerCase();
            const placeholder = (input.placeholder || '').toLowerCase();

            // Şifre alanı tespiti
            if (type === 'password') {
                passwordField = input;
            }

            // Kullanıcı adı / Email alanı tespiti
            if ((type === 'text' || type === 'email' || type === 'tel') && !usernameField) {
                const isUsername =
                    autocomplete.includes('username') ||
                    autocomplete.includes('email') ||
                    name.includes('user') ||
                    name.includes('email') ||
                    name.includes('login') ||
                    name.includes('mail') ||
                    id.includes('user') ||
                    id.includes('email') ||
                    id.includes('login') ||
                    placeholder.includes('kullanıcı') ||
                    placeholder.includes('user') ||
                    placeholder.includes('email') ||
                    placeholder.includes('e-posta');

                if (isUsername) {
                    usernameField = input;
                }
            }
        });

        // Şifre alanı varsa ama kullanıcı adı yoksa, şifre alanından önceki inputu dene
        if (passwordField && !usernameField) {
            const form = passwordField.closest('form');
            if (form) {
                const formInputs = form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
                for (let i = 0; i < formInputs.length; i++) {
                    if (formInputs[i] === passwordField && i > 0) {
                        usernameField = formInputs[i - 1];
                        break;
                    }
                }
            }
        }

        return { usernameField, passwordField };
    }

    // Element görünür mü kontrol et
    function isVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            element.offsetWidth > 0 &&
            element.offsetHeight > 0;
    }

    // Form alanlarını güvenli şekilde doldur
    function fillLoginForm(username, password) {
        const { usernameField, passwordField } = findLoginFields();
        let filled = false;

        // Kullanıcı adını doldur
        if (usernameField && username) {
            setInputValue(usernameField, username);
            filled = true;
        }

        // Şifreyi doldur
        if (passwordField && password) {
            setInputValue(passwordField, password);
            filled = true;
        }

        // Alternatif yöntem: Şifre alanı varsa ama kullanıcı adı alanı bulunamadıysa
        if (!usernameField && passwordField && username) {
            // Şifre alanından önceki tüm text inputları dene
            const allInputs = document.querySelectorAll('input[type="text"], input[type="email"]');
            for (const input of allInputs) {
                if (isVisible(input) && isNearPassword(input, passwordField)) {
                    setInputValue(input, username);
                    filled = true;
                    break;
                }
            }
        }

        // Hassas verileri temizle
        setTimeout(() => {
            username = null;
            password = null;
        }, 100);

        return filled;
    }

    // Input değerini ayarla ve olayları tetikle
    function setInputValue(input, value) {
        if (!input || !value) return;

        // React, Angular, Vue uyumluluğu için native setter kullan
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
        )?.set;

        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(input, value);
        } else {
            input.value = value;
        }

        // Olayları tetikle
        const events = ['input', 'change', 'blur'];
        events.forEach(eventType => {
            const event = new Event(eventType, { bubbles: true, cancelable: true });
            input.dispatchEvent(event);
        });

        // Focus ver
        input.focus();
    }

    // İki elementin yakınlığını kontrol et
    function isNearPassword(element, passwordField) {
        if (!element || !passwordField) return false;

        const elemRect = element.getBoundingClientRect();
        const passRect = passwordField.getBoundingClientRect();

        // Aynı formda mı?
        const elemForm = element.closest('form');
        const passForm = passwordField.closest('form');
        if (elemForm && passForm && elemForm === passForm) {
            return true;
        }

        // Y pozisyonu şifre alanından önce mi?
        return elemRect.bottom <= passRect.top + 100;
    }

    // Form submit olaylarını dinle (şifre yakalama için)
    function setupFormCapture() {
        document.addEventListener('submit', handleFormSubmit, true);

        // Dinamik formlar için MutationObserver
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.tagName === 'FORM') {
                        // Yeni form eklendi
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Form gönderimi işle
    function handleFormSubmit(event) {
        const form = event.target;
        if (!form || form.tagName !== 'FORM') return;

        const { usernameField, passwordField } = findLoginFieldsInForm(form);

        if (passwordField && passwordField.value) {
            const username = usernameField?.value || '';
            const password = passwordField.value;
            const domain = window.location.hostname;

            // Background'a bildir
            chrome.runtime.sendMessage({
                type: "CREDENTIAL_CAPTURED",
                data: {
                    domain,
                    username,
                    password,
                    url: window.location.href,
                    timestamp: Date.now()
                }
            }).catch(() => {
                // Extension bağlantı hatası
            });
        }
    }

    // Belirli bir formdaki login alanlarını bul
    function findLoginFieldsInForm(form) {
        const inputs = form.querySelectorAll('input');
        let usernameField = null;
        let passwordField = null;

        inputs.forEach(input => {
            const type = (input.type || '').toLowerCase();

            if (type === 'password' && input.value) {
                passwordField = input;
            }

            if ((type === 'text' || type === 'email') && input.value && !usernameField) {
                usernameField = input;
            }
        });

        return { usernameField, passwordField };
    }

    // Background'dan mesaj dinle
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        // Sadece bizim extension'ımızdan gelen mesajları kabul et
        if (sender.id !== chrome.runtime.id) {
            sendResponse({ success: false, error: "Yetkisiz" });
            return false;
        }

        if (request.type === "FILL_CREDENTIALS") {
            const { username, password } = request;

            if (!username && !password) {
                sendResponse({ success: false, error: "Veri yok" });
                return false;
            }

            const filled = fillLoginForm(username, password);
            sendResponse({ success: filled });

            // Hassas verileri temizle
            setTimeout(() => {
                request.username = null;
                request.password = null;
            }, 100);

            return false;
        }

        if (request.type === "FIND_LOGIN_FIELDS") {
            const { usernameField, passwordField } = findLoginFields();
            sendResponse({
                hasLoginForm: !!(usernameField || passwordField),
                hasUsername: !!usernameField,
                hasPassword: !!passwordField
            });
            return false;
        }
    });

    // DOM hazır olduğunda form yakalama başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupFormCapture);
    } else {
        setupFormCapture();
    }

})();

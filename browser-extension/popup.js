/**
 * WinVault Browser Extension - Popup Script
 * 
 * @version 2.0.0
 */

document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elementleri
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const currentDomainEl = document.getElementById('currentDomain');
    const searchBtn = document.getElementById('searchBtn');
    const loadingContainer = document.getElementById('loadingContainer');
    const errorContainer = document.getElementById('errorContainer');
    const resultsContainer = document.getElementById('resultsContainer');
    const noResults = document.getElementById('noResults');

    let currentTabId = null;
    let currentDomain = null;

    // Mevcut sekmenin domain'ini al
    async function getCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url) {
                currentTabId = tab.id;
                const url = new URL(tab.url);
                currentDomain = url.hostname;
                currentDomainEl.textContent = currentDomain;
                return true;
            }
        } catch (error) {
            console.error("Tab alınamadı:", error);
        }
        currentDomainEl.textContent = "Geçersiz sayfa";
        return false;
    }

    // Bağlantı durumunu kontrol et
    async function checkConnection() {
        try {
            const response = await chrome.runtime.sendMessage({ type: "CHECK_STATUS" });

            if (response.connected) {
                setStatus('connected', 'WinVault Bağlı');
                searchBtn.disabled = false;
                return true;
            } else {
                setStatus('error', 'Bağlantı Yok');
                showError(response.error || 'WinVault uygulaması çalışmıyor');
                return false;
            }
        } catch (error) {
            setStatus('error', 'Bağlantı Hatası');
            showError('Extension hatası: ' + error.message);
            return false;
        }
    }

    // Durum göstergesini güncelle
    function setStatus(type, text) {
        statusDot.className = 'status-dot ' + type;
        statusText.textContent = text;
    }

    // Hata göster
    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
        loadingContainer.classList.add('hidden');
        noResults.classList.add('hidden');
    }

    // Hata gizle
    function hideError() {
        errorContainer.classList.add('hidden');
    }

    // Sonuçları göster
    function showResults(results) {
        loadingContainer.classList.add('hidden');
        resultsContainer.innerHTML = '';

        if (!results || results.length === 0) {
            noResults.classList.remove('hidden');
            return;
        }

        noResults.classList.add('hidden');

        results.forEach(cred => {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <div class="result-site">${escapeHtml(cred.siteName || currentDomain)}</div>
                <div class="result-username">${escapeHtml(cred.username || 'Kullanıcı adı yok')}</div>
            `;

            item.addEventListener('click', () => {
                fillCredentials(cred.username, cred.password);
            });

            resultsContainer.appendChild(item);
        });
    }

    // Kimlik bilgilerini doldur
    async function fillCredentials(username, password) {
        if (!currentTabId) return;

        try {
            setStatus('connected', 'Dolduruluyor...');

            await chrome.runtime.sendMessage({
                type: "FILL_CREDENTIALS",
                tabId: currentTabId,
                username,
                password
            });

            setStatus('connected', 'Dolduruldu ✓');

            // Popup'ı kapat
            setTimeout(() => {
                window.close();
            }, 500);

        } catch (error) {
            showError('Doldurma hatası: ' + error.message);
        }
    }

    // Şifre ara
    async function searchPasswords() {
        if (!currentDomain) {
            showError('Geçerli bir web sitesinde değilsiniz');
            return;
        }

        hideError();
        noResults.classList.add('hidden');
        resultsContainer.innerHTML = '';
        loadingContainer.classList.remove('hidden');
        searchBtn.disabled = true;

        try {
            const response = await chrome.runtime.sendMessage({
                type: "SEARCH_PASSWORD",
                domain: currentDomain
            });

            if (response.error) {
                showError(response.error);
            } else {
                showResults(response.results);
            }
        } catch (error) {
            showError('Arama hatası: ' + error.message);
        } finally {
            searchBtn.disabled = false;
            loadingContainer.classList.add('hidden');
        }
    }

    // HTML escape
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Event listeners
    searchBtn.addEventListener('click', searchPasswords);

    // Enter tuşuyla arama
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !searchBtn.disabled) {
            searchPasswords();
        }
    });

    // Başlangıç
    const tabOk = await getCurrentTab();
    if (tabOk) {
        await checkConnection();
    } else {
        setStatus('error', 'Geçersiz Sayfa');
        searchBtn.disabled = true;
    }
});

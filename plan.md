DETAYLI İMLEMENTASYON PLANI
FAZ 1: WSL2 Ortamı Hazırlama (5 dk)
1.1 WSL2'ye Bağlanma
# Windows PowerShell'de
wsl
# Veya Windows Terminal'de WSL Ubuntu tab'ına tıkla
1.2 Sistem Güncelleme ve Temel Araçlar
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget vim build-essential
1.3 Node.js 20 LTS Kurulumu (nvm ile)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
node --version  # v20.x.x
npm --version   # 9.x.x
1.4 Linux Dependency'leri Kurulumu
sudo apt install -y \
  libnotify4 \
  libnss3 \
  libxtst6 \
  libx11-6 \
  libappindicator3-1 \
  libgtk-3-0 \
  libgbm1 \
  xdotool \
  wmctrl
---
FAZ 2: Proje Klasörüne Erişim (2 dk)
2.1 Seçenek: Windows Dosya Sisteminden Erişim
# WSL terminalinde
cd /mnt/c/Users/hrn21/OneDrive/Desktop/winvault17
ls -la
2.2 Alternatif: GitHub'dan Clone (Daha Hızlı)
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/hafgit99/winvault.git
cd winvault
---
FAZ 3: NPM Dependencies Kurulumu (3 dk)
3.1 NPM Install
npm ci
# Veya: npm install
3.2 Build Test (Windows mevcut build)
npm run build
---
FAZ 4: package.json Linux Build Konfigürasyonu (5 dk)
4.1 package.json Düzenleme
package.json dosyasında build bölümüne eklenecekler:
{
  build: {
    // Mevcut Windows konfigürasyonları...
    
    // Linux ekleme
    linux: {
      target: [
        {
          target: AppImage,
          arch: [x64, arm64]
        },
        {
          target: deb,
          arch: [x64, arm64]
        },
        {
          target: rpm,
          arch: [x64, arm64]
        }
      ],
      icon: build-assets/icons/linux/,
      category: Utility,
      maintainer: WinVault Team <support@winvault.app>,
      vendor: WinVault,
      synopsis: Secure Desktop Password Manager,
      description: WinVault is a zero-knowledge, military-grade encrypted password manager
    },
    appImage: {
      artifactName: --.
    },
    deb: {
      artifactName: __.,
      depends: [
        gconf2,
        gconf-service,
        libnotify4,
        libappindicator1,
        libxtst6,
        libnss3
      ]
    },
    rpm: {
      artifactName: --.
    }
  },
  scripts: {
    // Mevcut scriptler...
    
    build:linux: npm run build && electron-builder -l,
    build:linux:x64: npm run build && electron-builder -l --x64,
    build:linux:appimage: npm run build && electron-builder -l --AppImage,
    build:linux:deb: npm run build && electron-builder -l --deb,
    build:linux:rpm: npm run build && electron-builder -l --rpm
  }
}
4.2 NPM Scripts Güncelleme
{
  scripts: {
    build: vite build,
    build:win: npm run build && electron-builder -w,
    build:mac: npm run build && electron-builder -m,
    build:linux: npm run build && electron-builder -l,
    build:all: npm run build && electron-builder -wml
  }
}
---
FAZ 5: main.js Cross-Platform Refactoring (Gelişmiş - Opsiyonel)
5.1 Platform Detection Ekleme
// main.js başına
const platformAdapter = getPlatformAdapter();
5.2 Windows-Specific Kodları Değiştirme
- getActiveWindowTitle() → platformAdapter.getWindowTitle()
- sendKeys() → platformAdapter.autoType()
- checkBiometryAvailability() → platformAdapter.checkBiometryAvailable()
- promptBiometry() → platformAdapter.promptBiometry()
- getDeviceId() → platformAdapter.getDeviceId()
NOT: Bu FAZ 5 ileri seviye ve ilk kurulumda yapılmayabilir. Basit Linux build için FAZ 4 yeterli.
---
FAZ 6: İkon Hazırlama (Opsiyonel)
6.1 Linux İkon Klasörü Oluşturma
mkdir -p build-assets/icons/linux/{16x16,32x32,48x48,64x64,128x128,256x256,512x512,1024x1024}
6.2 İkon Dosyaları
- build-assets/icons/linux/1024x1024/winvault.png
- Diğer boyutlar için de resize edilebilir
6.3 .desktop Dosyası
# build-assets/com.winvault.app.desktop
[Desktop Entry]
Name=WinVault
GenericName=Password Manager
Comment=Secure Desktop Password Manager
Exec=winvault %U
Icon=winvault
Type=Application
Categories=Utility;Security;
StartupWMClass=WinVault
Keywords=password;security;manager;vault;encryption;
---
FAZ 7: İlk Linux Build ve Test (3 dk)
7.1 Build Çalıştırma
npm run build:linux
7.2 Build Sonucunu Kontrol Etme
ls -la dist/
# Beklenen çıktı:
# - winvault-2.1.0-x86_64.AppImage
# - winvault_2.1.0_amd64.deb
# - winvault-2.1.0-1.x86_64.rpm
7.3 AppImage Test
chmod +x dist/winvault-2.1.0-x86_64.AppImage
./dist/winvault-2.1.0-x86_64.AppImage
7.4 DEB Package Test
sudo apt install ./dist/winvault_2.1.0_amd64.deb
winvault
---
FAZ 8: WSL GUI Destek (Gelişmiş - Opsiyonel)
8.1 WSL2 GUI Ayarları
# Windows PowerShell'de
wsl --update --web-download
8.2 X11 Forwarding (WSL1)
Bu FAZ 8 ileri seviye - başlangıç için gerekli değil.
---
📊 Plan Özeti
| FAZ | Adı | Süre | Zorluk | Önemi |
|------|-----|-------|---------|--------|
| FAZ 1 | WSL2 Ortamı Hazırlama | 5 dk | 🟢 Kolay | 🔴 Zorunlu |
| FAZ 2 | Proje Klasörüne Erişim | 2 dk | 🟢 Kolay | 🔴 Zorunlu |
| FAZ 3 | NPM Dependencies Kurulumu | 3 dk | 🟢 Kolay | 🔴 Zorunlu |
| FAZ 4 | package.json Linux Konfigürasyonu | 5 dk | 🟡 Orta | 🔴 Zorunlu |
| FAZ 5 | main.js Cross-Platform Refactoring | 30 dk | 🔴 Zor | 🟢 Opsiyonel |
| FAZ 6 | İkon Hazırlama | 5 dk | 🟡 Orta | 🟡 Opsiyonel |
| FAZ 7 | İlk Linux Build ve Test | 3 dk | 🟢 Kolay | 🔴 Zorunlu |
| FAZ 8 | WSL GUI Desteği | 10 dk | 🔴 Zor | ⚪ Gelecekte |
Minimum Kurulum Süresi: ~18 dakika (FAZ 1-4, 7)
Tam Kurulum Süresi: ~45 dakika (Tüm FAZ'lar)
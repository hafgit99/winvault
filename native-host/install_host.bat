@echo off
setlocal EnableDelayedExpansion

:: ========================================
:: WinVault - Native Messaging Host Installer
:: ========================================

echo.
echo ========================================
echo  WinVault Native Host Installer
echo ========================================
echo.

:: Yönetici kontrolü
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [UYARI] Yonetici haklariniz olmadan devam ediliyor...
    echo         Hata olusursa, bu dosyayi sag tiklayip
    echo         "Yonetici olarak calistir" secerek yeniden deneyin.
    echo.
)

:: Mevcut dizin
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

:: Node.js kontrolü
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Node.js bulunamadi!
    echo        Lutfen Node.js yukleyin: https://nodejs.org
    pause
    exit /b 1
)

echo [*] Script dizini: %SCRIPT_DIR%

:: Extension ID'yi kullanıcıdan al
echo.
echo [!] Chrome/Edge'e extension'i yukledikten sonra
echo     extension ID'sini buraya girin.
echo.
echo     Extension ID'yi bulmak icin:
echo     Chrome: chrome://extensions
echo     Edge: edge://extensions
echo.
echo     Developer Mode acik iken extension'in altinda gorunen
echo     32 karakterlik ID'yi kopyalayin.
echo.
set /p "EXT_ID=Extension ID: "

if "%EXT_ID%"=="" (
    echo [HATA] Extension ID bos olamaz!
    pause
    exit /b 1
)

:: ID'yi doğrula (32 karakter, sadece küçük harf ve rakam)
echo %EXT_ID%| findstr /r "^[a-z0-9][a-z0-9]*$" >nul
if %errorlevel% neq 0 (
    echo [HATA] Gecersiz Extension ID formati!
    echo        ID sadece kucuk harf ve rakamlardan olusmalidir.
    pause
    exit /b 1
)

echo.
echo [*] Extension ID: %EXT_ID%

:: Batch wrapper oluştur
set "BAT_PATH=%SCRIPT_DIR%\winvault-host.bat"
echo @echo off > "%BAT_PATH%"
echo node "%SCRIPT_DIR%\host.js" >> "%BAT_PATH%"
echo [+] Host wrapper olusturuldu: %BAT_PATH%

:: Manifest dosyasını oluştur
set "MANIFEST_PATH=%SCRIPT_DIR%\manifest.json"
set "BAT_PATH_ESCAPED=%BAT_PATH:\=\\%"

echo { > "%MANIFEST_PATH%"
echo     "name": "com.winvault.extension", >> "%MANIFEST_PATH%"
echo     "description": "WinVault Secure Password Manager - Native Messaging Host", >> "%MANIFEST_PATH%"
echo     "path": "%BAT_PATH_ESCAPED%", >> "%MANIFEST_PATH%"
echo     "type": "stdio", >> "%MANIFEST_PATH%"
echo     "allowed_origins": [ >> "%MANIFEST_PATH%"
echo         "chrome-extension://%EXT_ID%/" >> "%MANIFEST_PATH%"
echo     ] >> "%MANIFEST_PATH%"
echo } >> "%MANIFEST_PATH%"
echo [+] Manifest olusturuldu: %MANIFEST_PATH%

:: Chrome için kayıt
echo.
echo [*] Chrome icin Native Messaging Host kaydediliyor...
set "CHROME_KEY=HKCU\Software\Google\Chrome\NativeMessagingHosts\com.winvault.extension"
reg add "%CHROME_KEY%" /ve /t REG_SZ /d "%MANIFEST_PATH%" /f >nul 2>&1
if %errorlevel% equ 0 (
    echo [+] Chrome kaydi basarili
) else (
    echo [-] Chrome kaydi basarisiz
)

:: Edge için kayıt
echo [*] Edge icin Native Messaging Host kaydediliyor...
set "EDGE_KEY=HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.winvault.extension"
reg add "%EDGE_KEY%" /ve /t REG_SZ /d "%MANIFEST_PATH%" /f >nul 2>&1
if %errorlevel% equ 0 (
    echo [+] Edge kaydi basarili
) else (
    echo [-] Edge kaydi basarisiz
)

:: Brave için kayıt
echo [*] Brave icin Native Messaging Host kaydediliyor...
set "BRAVE_KEY=HKCU\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.winvault.extension"
reg add "%BRAVE_KEY%" /ve /t REG_SZ /d "%MANIFEST_PATH%" /f >nul 2>&1
if %errorlevel% equ 0 (
    echo [+] Brave kaydi basarili
) else (
    echo [-] Brave kaydi basarisiz (Brave yuklu olmayabilir)
)

echo.
echo ========================================
echo  KURULUM TAMAMLANDI!
echo ========================================
echo.
echo Simdi yapmaniz gerekenler:
echo.
echo 1. WinVault uygulamasini calistirin
echo 2. Tarayicinizi tamamen kapatip yeniden acin
echo 3. Extension ikonuna tiklayarak test edin
echo.
echo Sorun yasarsaniz:
echo - Tarayiciyi yeniden baslattiginizdan emin olun
echo - Extension ID'nin dogru oldugundan emin olun
echo - WinVault uygulamasinin calistigindan emin olun
echo.
pause

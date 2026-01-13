@echo off
:: WinVault - Native Host Uninstaller

echo.
echo ========================================
echo  WinVault Native Host Uninstaller
echo ========================================
echo.

echo [*] Eski Aegis Vault kayitlari kaldiriliyor (varsa)...
reg delete "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.aegisvault.extension" /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.aegisvault.extension" /f >nul 2>&1
reg delete "HKCU\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.aegisvault.extension" /f >nul 2>&1

echo [*] WinVault kayitlari kaldiriliyor...
reg delete "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.winvault.extension" /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.winvault.extension" /f >nul 2>&1
reg delete "HKCU\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.winvault.extension" /f >nul 2>&1

echo.
echo [+] Tum kayitlar temizlendi.
echo.
pause

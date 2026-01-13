import { GeneratorSettings, Credential, Language } from './types';
import { SecureString, MemoryManager, SecureClipboard, secureCopyPassword, secureCreatePassword, secureUsePassword, initializeMemorySecurity } from './utils/memorySecurity';
import * as OTPAuth from 'otpauth';
import { argon2id } from 'hash-wasm';
import { dbService } from './services/idb';

export const TRANSLATIONS = {
  tr: {
    // Theme
    lightMode: "Aydınlık",
    darkMode: "Karanlık",

    // Sidebar
    vault: "Kasa",
    generator: "Üretici",
    settings: "Ayarlar",
    lock: "Çıkış",
    documents: "Belgeler",

    // Mini Mode
    miniMode: "Mini Mod (Her Zaman Üstte)",
    normalMode: "Normal Mod",

    // Vault
    searchPlaceholder: "Kasa içinde ara (Notlar dahil)...",
    addAccount: "Yeni Ekle",
    editAccount: "Düzenle",
    noRecords: "Kayıt bulunamadı",
    copy: "Kopyala",
    delete: "Sil",
    analyze: "Analiz Et",
    siteName: "Site veya Uygulama",
    username: "Kullanıcı Adı / E-posta",
    alias: "Takma Ad (Opsiyonel)",
    password: "Şifre",
    save: "Kaydet",
    updateBtn: "Güncelle",
    random: "Rastgele",
    securityReport: "Güvenlik Raporu",
    score: "Skor",
    suggestions: "İyileştirme Önerileri",
    confirmDelete: "Bu kaydı silmek istediğinize emin misiniz? (Çöp kutusuna taşınır)",
    view: "Görüntüle",
    copied: "Panoya kopyalandı",
    clipboardCleared: "Güvenlik: Pano temizlendi.",
    accountAdded: "Kayıt başarıyla eklendi",
    accountUpdated: "Kayıt güncellendi",
    accountDeleted: "Kayıt çöp kutusuna taşındı",
    autoLockMsg: "Güvenlik: Hareketsizlik nedeniyle oturum kilitlendi.",
    nothingHere: "Burada henüz bir şey yok",
    noSearchResults: "Sonuç bulunamadı",
    noContent: "İçerik yok",
    passMismatch: "Şifreler eşleşmiyor",
    shortPassword: "Şifre en az 6 karakter olmalıdır",

    // Attachments
    attachments: "Dosya Ekleri",
    addFile: "Dosya Ekle",
    dropFiles: "Dosyaları buraya sürükleyin veya seçin",
    fileSizeLimit: "Maksimum dosya boyutu: 5MB",
    fileTooLarge: "Dosya çok büyük! Lütfen 5MB altı dosya seçin.",
    download: "İndir",
    noAttachments: "Ekli dosya yok",

    // Filters
    all: "Tümü",
    favorites: "Favoriler",
    recents: "Son Kullanılanlar",

    // Dashboard (New)
    securityScore: "Güvenlik Skoru",
    totalItems: "Toplam Kayıt",
    weakPasswords: "Riskli Şifreler",
    weakPasswordWarning: "Bazı şifreleriniz çok kısa!",

    // Recycle Bin
    recycleBin: "Çöp Kutusu",
    restore: "Geri Yükle",
    deletePermanent: "Kalıcı Sil",
    emptyTrash: "Çöpü Boşalt",
    trashEmpty: "Çöp kutusu boş",
    deletedItem: "Silinme:",
    confirmPermanentDelete: "Bu kaydı kalıcı olarak silmek istediğinize emin misiniz? Geri alınamaz!",
    confirmEmptyTrash: "Çöp kutusundaki tüm öğeler kalıcı olarak silinecek. Onaylıyor musunuz?",
    restored: "Kayıt geri yüklendi",
    permanentlyDeleted: "Kayıt kalıcı olarak silindi",
    trashEmptied: "Çöp kutusu boşaltıldı",

    // Category
    allCategories: "Tümü",
    addCategory: "Kategori Ekle",
    categoryName: "Kategori Adı",
    deleteCategoryConfirm: "Bu kategoriyi silmek istediğinize emin misiniz? (İçindeki kayıtlar silinmez, Genel kategorisine taşınır)",
    selectCategory: "Kategori Seç",

    // Credit Card
    tabLogin: "Giriş Bilgisi",
    tabCard: "Kredi Kartı",
    bankName: "Banka / Kart Adı",
    cardHolder: "Kart Sahibi",
    cardNumber: "Kart Numarası",
    expiry: "Son Kullanma (AA/YY)",
    cvv: "CVV",
    copyCard: "Kart No Kopyala",
    copyCVV: "CVV Kopyala",
    flipCard: "Kartı Çevir",

    // Secure Note
    tabNote: "Güvenli Not",
    noteTitle: "Not Başlığı",
    noteContent: "Not İçeriği",
    copyNote: "Notu Kopyala",
    notes: "Notlar",
    tabDocument: "Güvenli Belge",
    docTitle: "Belge Başlığı",
    docDesc: "Belge Açıklaması",
    docVault: "Belge Kasası",
    docVaultDesc: "Önemli PDF ve Görsellerinizi yüksek şifreleme ile saklayın.",
    dragDoc: "Belgeyi buraya sürükleyin",

    // Advanced features
    advancedFeatures: "Gelişmiş Özellikler",
    customFields: "Özel Alanlar",
    addCustomField: "Yeni Alan Ekle",
    totpLabel: "TOTP Doğrulama Kodu",
    passwordHistory: "Şifre Geçmişi",
    oldPasswords: "Eski Şifreler",
    noHistory: "Henüz şifre geçmişi yok",
    changed: "Değiştirilme",

    // Placeholder Texts
    placeholderSiteName: "Örn: Google",
    placeholderAlias: "Örn: Şirket Maili",
    placeholderBankName: "Örn: Garanti Bonus",
    placeholderCardHolder: "AD SOYAD",
    placeholderNoteTitle: "Örn: Wi-Fi Şifresi",
    placeholderUsername: "kullanici@mail.com",
    placeholderExpiry: "AA/YY",

    // Modal Copy Instructions
    copyInstruction: "Kopyalama Talimatı:",
    copyHint: "Metni seçin ve Ctrl+C tuşlarına basın",
    copyAll: "Tüm Metni Kopyala",
    close: "Kapat",

    // Generator
    genTitle: "Şifre Oluşturucu",
    genDesc: "Kırılması zor, güçlü şifreler oluşturun. Ayarlarınız otomatik kaydedilir.",
    refresh: "Yenile",
    modeRandom: "Rastgele (Karmaşık)",
    modeMemorable: "Akılda Kalıcı (Passphrase)",
    length: "Uzunluk",
    uppercase: "Büyük Harfler (A-Z)",
    numbers: "Rakamlar (0-9)",
    symbols: "Semboller (!@#)",
    wordCount: "Kelime Sayısı",
    separator: "Ayırıcı Karakter",
    capitalize: "Baş Harfleri Büyüt",
    sepHyphen: "Tire (-)",
    sepSpace: "Boşluk ( )",
    sepPeriod: "Nokta (.)",
    sepUnderscore: "Alt Çizgi (_)",
    tipTitle: "İpucu",
    tipDesc: "Güçlü şifreler genellikle en az 16 karakter uzunluğundadır ve tahmin edilmesi zor karakter kombinasyonları içerir. Akılda kalıcı mod ile uzun ama hatırlanabilir şifreler üretebilirsiniz.",

    // Settings
    settingsTitle: "Ayarlar",
    dataManagement: "Veri Yönetimi / Yedekleme",
    dataDesc: "Verilerinizi dışa aktarın, otomatik yedekleme yapın veya başka bir şifre yöneticisinden verilerinizi taşıyın.",
    autoBackup: "Otomatik Yerel Yedekleme",
    autoBackupDesc: "Her çıkış yapıldığında verilerinizi yerel bir klasöre yedekler.",
    selectBackupDir: "Yedekleme Klasörü Seç",
    backupActive: "Yedekleme Aktif",
    backupDirSelected: "Klasör seçildi:",
    lastBackup: "Son Yedekleme:",
    backupNow: "Şimdi Yedekle",
    backupSuccess: "Yedekleme başarılı!",
    backupError: "Yedekleme başarısız oldu.",
    export: "Verileri Dışa Aktar",
    import: "İçe Aktar",
    exportTitle: "Verileri Dışa Aktar",
    format: "Format",
    encryptFile: "Dosyayı Şifrele",
    encryptFileDesc: "Dosyayı bir şifre ile koruyun. (WinVault formatı için zorunludur)",
    winvaultRequired: ".winvault formatı şifreleme gerektirir.",
    csvWarning: "Dikkat: CSV formatı teknik yapısı gereği dosya eklerini (resim vb.) desteklemez. Ekli dosyalarınız bu yedeğe dahil edilmeyecektir.",
    downloadCSV: "CSV Olarak İndir",
    downloadJSON: "JSON Olarak İndir",
    downloadEncrypted: "Şifreli İndir",
    selectFile: "Dosya Seç (CSV / JSON / .winvault)",
    masterPassword: "Ana Şifre",
    currentPass: "Mevcut Şifre",
    newPass: "Yeni Şifre",
    repeatPass: "Tekrar",
    update: "Güncelle",
    twoFactor: "2FA Doğrulama",
    active: "AKTİF",
    startSetup: "Kurulumu Başlat",
    confirm: "Onayla",
    cancel: "İptal",
    disable: "Devre Dışı Bırak",
    wordKey: "24 Kelimelik Anahtar",
    createWords: "Kelimeleri Oluştur",
    activate: "Aktifleştir",
    licenseStatus: "Lisans Durumu",
    freeVersion: "ÜCRETSİZ SÜRÜM",
    proVersion: "PRO SÜRÜM",
    enterKey: "PRO özellikleri aktifleştirmek için anahtarınızı girin.",
    buyPro: "WinVault PRO Satın Al (10€)",
    proActive: "WinVault PRO Aktif",
    licenseActions: "Lisans İşlemleri",
    adminPanel: "Yönetici Paneli / Lisans Üretici",
    adminDesc: "Bu alan sadece yönetici içindir. Buradan müşterileriniz için yeni anahtarlar üretebilirsiniz.",
    generateKey: "Yeni Anahtar Üret",
    language: "Dil / Language",
    deviceId: "Cihaz Kimliği (ID)",
    lockToDevice: "Cihaza Kilitle",
    targetDeviceId: "Hedef Cihaz ID",
    invalidDevice: "Bu lisans anahtarı bu cihazda kullanılamaz.",
    deviceMismatch: "Cihaz Uyuşmazlığı",
    securityPrefs: "Güvenlik Tercihleri",
    autoLock: "Otomatik Çıkış Süresi",
    autoLockDesc: "Hareketsiz kaldığınızda oturumun ne zaman kapanacağını seçin.",
    time1min: "1 Dakika",
    time5min: "5 Dakika",
    time15min: "15 Dakika",
    time30min: "30 Dakika",
    time1hour: "1 Hour",
    timeNever: "Asla (Önerilmez)",
    biometricUnlock: "Windows Hello / Biyometrik Kilit",
    biometricDesc: "Parmak izi veya yüz tanıma (Windows Hello) ile kilit açmanızı sağlar.",
    biometricActive: "Biyometrik Kilit Aktif",
    biometricError: "Biyometrik doğrulama başarısız oldu.",
    biometricNotAvailable: "Cihazınızda Windows Hello desteği bulunamadı veya yapılandırılmamış.",
    biometricReason: "WinVault kilidini açmak için lütfen kimliğinizi doğrulayın.",
    enableBiometrics: "Biyometrik Kilidi Aktifleştir",

    // Duress
    duressPassword: "Sahte Kasa (Duress) Şifresi",
    duressDesc: "Zorlama durumunda asıl verilerinizi gizlemek için ikinci bir şifre belirleyin. Bu şifre ile giriş yapıldığında boş/sahte bir kasa açılır.",
    duressSetTitle: "Sahte Kasa Şifresi Belirle",
    duressActive: "Sahte Kasa Aktif",
    duressWarning: "UYARI: Bu şifre ana şifrenizden FARKLI olmalıdır.",

    // Privacy & GDPR
    privacyPolicy: "Gizlilik Politikası",
    privacyTitle: "Gizlilik Politikası ve Veri Güvenliği",
    privacyDesc: "WinVault, verilerinizi nasıl korur ve kullanır?",
    gdprText: "GİZLİLİK POLİTİKASI VE VERİ GÜVENLIĞI\n\nWinVault, 'Gizlilik Odaklı Tasarım' (Privacy by Design) ilkesiyle geliştirilmiştir.\n\n1. VERİ SAHİPLİĞİ\nTüm verileriniz (şifreler, notlar, dosyalar, ödeme kartları) sadece sizin cihazınızda yerel olarak (IndexedDB) saklanır. Hiçbir sunucuya, bulut depolama hizmetine veya üçüncü şahıslara gönderilmez. Veriler tamamen sizin kontrolünüz altındadır.\n\n2. ŞİFRELEME VE GÜVENLIK\n- Verileriniz AES-256 GCM algoritması ile şifrelenir (256-bit şifreleme anahtarı)\n- Ana şifreniz Argon2id fonksiyonuyla hash'lenir (3 iterasyon, 64MB bellek, GPU-dirençli)\n- AES anahtar türetimi için PBKDF2 (600,000 iterasyon) kullanılır\n- Her şifreleme işlemi için rastgele 16-byte salt ve 12-byte IV kullanılır\n- Ana şifreniz hiçbir yerde saklanmaz, yalnızca hash'i karşılaştırılır\n- Master key üzerinde işlem tamamlandıktan sonra bellekten silinir\n\n3. VERİ TOPLAMA POLİTİKASI\nWinVault, aşağıdakileri TOPLAMAZ:\n- Kullanım istatistiği veya analitik veriler\n- Telemetri veya crash raporları\n- Kişisel tanıtıcı bilgiler (KVKK Madde 3)\n- Konum, tarama geçmişi, cihaz bilgileri\n- E-posta adresi veya diğer kişisel veriler\n\n4. PANO (CLIPBOARD) GÜVENLİĞİ\n- Şifreler panoya kopyalandığında, 5 saniye sonra otomatik silinir\n- Diğer uygulamalar panoya erişemez (Electron context isolation)\n\n5. EKRAN YAKALAMA KORUNMASI\n- Uygulama boş ekranda gösterilir, içerik yüklenene kadar\n- Screenshot ve recording başlangıç aşamasında engellenir\n\n6. GDPR HAKLARINIZ (AB Genel Veri Koruma Yönetmeliği)\n- Veri Erişimi: 'Dışa Aktar' ile tüm verilerinizi indirebilirsiniz\n- Veri Taşınabilirliği: Veriler CSV/JSON formatında dışa aktarılabilir\n- Veri Silinmesi: 'Verileri Sil' ile tüm verileriniz kalıcı olarak silinir\n- Silinen veriler kurtarılamaz. Backup'tan yüklemediğiniz sürece geri gelmez\n\n7. KVK KANUNU UYUMLULUĞU (Türkiye)\nWinVault, Kişisel Verilerin Korunması Kanunu (KVKK) ile uyumludur:\n- Aydınlatılmış rıza: Bu politikayı okudunuz\n- Meşru Menfaat: Güvenlik ve şifre yönetimi\n- Veri Minimizasyonu: Sadece gerekli veriler toplanır\n- Depolama Sınırlaması: Veriler cihazda yerel saklanır\n- Kullanıcı Haklarında: Veri Sorumlusu olarak siz kontrolü elinde tutarsınız\n\n8. YASAL KÜPÜNETİ (Malicious Software Directive)\nWinVault hiçbir zararlı yazılım, rootkit, spyware veya adware içermez.\n\n9. AÇIK KAYNAK VE DENETIM\nWinVault'un güvenlik özellikleri bağımsız tarafından denetlenebilir.\n\n10. DEĞİŞİKLİKLER\nBu politika değişebilir. Güncellemeler uygulamada bildirilecektir.\n\n11. İLETİŞİM\nGizlilik ve destek hakkında sorularınız varsa, uygulamadaki Ayarlar > Destek bölümünden bizimle iletişime geçebilirsiniz.",

    // Support
    support: "Destek",
    supportTitle: "Destek ve Yardım",
    supportDesc: "Sorularınız veya sorunlarınız varsa bize ulaşın",
    contactSupport: "Destek Talebinde Bulun",
    supportEmail: "sales@hetech-me.space",
    sendEmail: "E-posta Gönder",
    emailSent: "E-posta uygulamanız açılıyor...",
    supportSubject: "WinVault Destek Talebi",
    supportMessage: "Merhaba,\n\nWinVault ile ilgili bir sorunum/sorunum var:\n\n[Lütfen sorununuzu burada detaylı olarak açıklayın]\n\nTECHNİ BİLGİLER:\nCihaz ID: [Otomatik doldurulur]\nSürüm: WinVault 2.0.0\n\nTeşekkür ederim,",

    // Backup
    encryptedBackup: "Şifreli Yedek (.winvault)",
    encryptBackupTitle: "Yedekleme Şifresi Belirle",
    encryptBackupDesc: "Bu dosya şifrelenecektir. Geri yüklerken bu şifreyi girmeniz gerekecek. Lütfen unutmayın!",
    backupPassPlaceholder: "Yedekleme Şifresi",
    restoreTitle: "Yedek Şifresini Girin",
    restoreDesc: "Bu dosya şifreli. İçeriği açmak için şifreyi girin.",
    restoreAction: "Şifreyi Çöz ve Yükle",
    restoreSuccess: "Yedek başarıyla geri yüklendi.",
    restoreError: "Şifre yanlış veya dosya bozuk.",

    // Payment
    cryptoPayment: "Kripto Ödeme",
    paymentTitle: (coin: string) => `${coin} ile Ödeme`,
    paymentInstruction: "Lütfen aşağıdaki adrese 10€ (Euro) değerinde gönderim yapın.",
    paymentWarning: "Lütfen gönderdiğiniz ağın doğru olduğundan emin olun. Yanlış ağ gönderimleri kaybolabilir.",
    paymentButton: "Ödemeyi Yaptım / Bildir",
    emailSubject: "WinVault PRO Ödeme Bildirimi",
    emailBody: (coin: string, address: string, dev1: string, dev2?: string) =>
      `Merhaba,\\n\\nWinVault PRO lisansı için 10€ (Euro) değerinde ödeme yaptım.\\n\\nÖdenen Coin: ${coin}\\nCüzdan Adresi: ${address}\\n\\nTXID (İşlem Kodu): [LÜTFEN BURAYA YAPIŞTIRIN]\\n\\nCihaz 1 ID: ${dev1} (Mevcut Cihaz)\\nCihaz 2 ID: ${dev2 || '[İKİNCİ CİHAZ ID BURAYA]'}\\n\\nLisans anahtarımı gönderir misiniz? Teşekkürler.\\n\\n------------------------------------------------\\n\\nHello,\\n\\nI have made a payment of 10€ (Euro) for WinVault PRO license.\\n\\nPaid Coin: ${coin}\\nWallet Address: ${address}\\n\\nTXID (Transaction ID): [PASTE HERE]\\n\\nDevice 1 ID: ${dev1} (Current Device)\\nDevice 2 ID: ${dev2 || '[SECOND DEVICE ID HERE]'}\\n\\nPlease send my license key. Thanks.`,

    // Login
    loginTitle: "WinVault",
    login2FA: "2FA Doğrulama",
    loginWord: "Güvenlik Kontrolü",
    enterPass: "Devam etmek için şifrenizi girin",
    enterCode: "Authenticator kodunu girin",
    enterWords: (i1: number, i2: number) => `${i1}. ve ${i2}. kelimeleri girin`,
    resetApp: "Uygulamayı Sıfırla",
    resetConfirmTitle: "Sıfırlama Onayı",
    resetConfirmDesc: "Tüm verileriniz kalıcı olarak silinecektir.",
    reset2FADesc: "Güvenlik gereği, sıfırlama işlemi için Authenticator uygulamanızdaki 6 haneli kodu girmelisiniz.",
    resetTextDesc: "Onaylamak için Ana Şifrenizi girin.",
    verifyAndReset: "Doğrula ve Sıfırla",
    deleteData: "Verileri Sil",
    wrongPass: "Yanlış şifre",
    invalidCode: "Geçersiz kod",
    wordsMismatch: "Kelimeler eşleşmiyor",
    defaultPassWarning: "Güvenlik Uyarısı",
    defaultPassDesc: "Şifreniz şu anda varsayılan (demo123) olarak ayarlıdır. Lütfen ayarlardan değiştirin.",

    // Rate Limiting
    accountLocked: "Hesap Kilitlendi",
    accountLockedDesc: "Çok fazla başarısız deneme. Hesap geçici olarak kilitlendi.",
    remainingTime: "Kalan süre",
    warningTitle: "Dikkat!",
    warningDesc: (attempts: number) => `${attempts} deneme hakkınız kaldı. Başarısız denemeler sonrası hesap geçici olarak kilitlenecektir.`,

    // Trial
    trialActiveDesc: "Ücretsiz deneme sürümü aktif. 3 gün boyunca tüm PRO özelliklerini test edebilirsiniz.",
    trialExpired: "Deneme Süresi Doldu",
    trialDesc: "3 Günlük ücretsiz deneme süreniz sona erdi. Verilerinize erişmeye devam etmek için lütfen WinVault PRO lisansı satın alın.",
    daysLeft: "Kalan: ",
    day: "Gün"
  },
  en: {
    // Theme
    lightMode: "Light",
    darkMode: "Dark",

    // Sidebar
    vault: "Vault",
    generator: "Generator",
    settings: "Settings",
    lock: "Lock",
    documents: "Documents",

    // Mini Mode
    miniMode: "Mini Mode (Always on Top)",
    normalMode: "Normal Mode",

    // Vault
    searchPlaceholder: "Search in vault (includes notes)...",
    addAccount: "Add New",
    editAccount: "Edit",
    noRecords: "No records found",
    copy: "Copy",
    delete: "Delete",
    analyze: "Analyze",
    siteName: "Site or App",
    username: "Username / Email",
    alias: "Alias (Optional)",
    password: "Password",
    save: "Save",
    updateBtn: "Update",
    random: "Random",
    securityReport: "Security Report",
    score: "Score",
    suggestions: "Improvement Suggestions",
    view: "View",
    confirmDelete: "Are you sure you want to delete this record? (Moved to Trash)",
    copied: "Copied to clipboard",
    clipboardCleared: "Security: Clipboard cleared.",
    accountAdded: "Record added successfully",
    accountUpdated: "Record updated",
    accountDeleted: "Record moved to trash",
    autoLockMsg: "Security: Session locked due to inactivity.",
    nothingHere: "Nothing here yet",
    noSearchResults: "No results found",
    noContent: "No content",
    passMismatch: "Passwords do not match",
    shortPassword: "Password must be at least 6 characters",

    // Attachments
    attachments: "Attachments",
    addFile: "Add File",
    dropFiles: "Drag files here or click to select",
    fileSizeLimit: "Max file size: 5MB",
    fileTooLarge: "File too large! Please select a file under 5MB.",
    download: "Download",
    noAttachments: "No attachments",

    // Filters
    all: "All",
    favorites: "Favorites",
    recents: "Recents",

    // Dashboard (New)
    securityScore: "Security Score",
    totalItems: "Total Items",
    weakPasswords: "Weak Passwords",
    weakPasswordWarning: "Some passwords are too short!",

    // Recycle Bin
    recycleBin: "Recycle Bin",
    restore: "Restore",
    deletePermanent: "Delete Permanently",
    emptyTrash: "Empty Trash",
    trashEmpty: "Trash is empty",
    deletedItem: "Deleted:",
    confirmPermanentDelete: "Are you sure you want to permanently delete this? Cannot be undone!",
    confirmEmptyTrash: "All items in trash will be permanently deleted. Confirm?",
    restored: "Record restored",
    permanentlyDeleted: "Record permanently deleted",
    trashEmptied: "Trash emptied",

    // Category
    allCategories: "All",
    addCategory: "Add Category",
    categoryName: "Category Name",
    deleteCategoryConfirm: "Are you sure you want to delete this category? (Items will be moved to General)",
    selectCategory: "Select Category",

    // Credit Card
    tabLogin: "Login Info",
    tabCard: "Credit Card",
    bankName: "Bank / Card Name",
    cardHolder: "Card Holder",
    cardNumber: "Card Number",
    expiry: "Expiry (MM/YY)",
    cvv: "CVV (Security Code)",
    copyCard: "Copy Card No",
    copyCVV: "Copy CVV",
    flipCard: "Flip Card",

    // Secure Note
    tabNote: "Secure Note",
    noteTitle: "Note Title",
    noteContent: "Note Content",
    copyNote: "Copy Note",
    notes: "Notes",
    tabDocument: "Secure Document",
    docTitle: "Document Title",
    docDesc: "Document Description",
    docVault: "Document Vault",
    docVaultDesc: "Store your important PDFs and Images with high-level encryption.",
    dragDoc: "Drag document here",

    // Advanced features
    advancedFeatures: "Advanced Features",
    customFields: "Custom Fields",
    addCustomField: "Add Custom Field",
    totpLabel: "TOTP Verification Code",
    passwordHistory: "Password History",
    oldPasswords: "Old Passwords",
    noHistory: "No history yet",
    changed: "Changed",

    // Placeholder Texts
    placeholderSiteName: "E.g: Google",
    placeholderAlias: "E.g: Work Email",
    placeholderBankName: "E.g: Visa Card",
    placeholderCardHolder: "FULL NAME",
    placeholderNoteTitle: "E.g: WiFi Password",
    placeholderUsername: "user@email.com",
    placeholderExpiry: "MM/YY",

    // Modal Copy Instructions
    copyInstruction: "Copy Instructions:",
    copyHint: "Select text and press Ctrl+C",
    copyAll: "Copy All Text",
    close: "Close",

    // Generator
    genTitle: "Password Generator",
    genDesc: "Create strong, uncrackable passwords. Your settings are saved automatically.",
    refresh: "Refresh",
    modeRandom: "Random (Complex)",
    modeMemorable: "Memorable (Passphrase)",
    length: "Length",
    uppercase: "Uppercase (A-Z)",
    numbers: "Numbers (0-9)",
    symbols: "Symbols (!@#)",
    wordCount: "Word Count",
    separator: "Separator",
    capitalize: "Capitalize",
    sepHyphen: "Hyphen (-)",
    sepSpace: "Space ( )",
    sepPeriod: "Period (.)",
    sepUnderscore: "Underscore (_)",
    tipTitle: "Pro Tip",
    tipDesc: "Strong passwords are usually at least 16 characters long and include hard-to-guess character combinations. Use Memorable mode to generate long but easy-to-remember passphrases.",

    // Settings
    settingsTitle: "Settings",
    dataManagement: "Data Management / Backup",
    dataDesc: "Export data, configure auto-backup, or import from other password managers.",
    autoBackup: "Auto Local Backup",
    autoBackupDesc: "Automatically backs up your data to a local folder on every logout.",
    selectBackupDir: "Select Backup Folder",
    backupActive: "Backup Active",
    backupDirSelected: "Folder selected:",
    lastBackup: "Last Backup:",
    backupNow: "Backup Now",
    backupSuccess: "Backup successful!",
    backupError: "Backup failed.",
    export: "Export Data",
    import: "Import",
    exportTitle: "Export Data",
    format: "Format",
    encryptFile: "Encrypt File",
    encryptFileDesc: "Protect this file with a password. (Required for WinVault format)",
    winvaultRequired: ".winvault format requires encryption.",
    csvWarning: "Warning: CSV format does not support file attachments (images, etc.). Your attachments will not be included in this backup.",
    downloadCSV: "Download CSV",
    downloadJSON: "Download JSON",
    downloadEncrypted: "Download Encrypted",
    selectFile: "Select File (CSV / JSON / .winvault)",
    masterPassword: "Master Password",
    currentPass: "Current Password",
    newPass: "New Password",
    repeatPass: "Repeat",
    update: "Update",
    twoFactor: "2FA Authentication",
    active: "ACTIVE",
    startSetup: "Start Setup",
    confirm: "Confirm",
    cancel: "Cancel",
    disable: "Disable",
    wordKey: "24-Word Key",
    createWords: "Generate Words",
    activate: "Activate",
    licenseStatus: "License Status",
    freeVersion: "FREE VERSION",
    proVersion: "PRO VERSION",
    enterKey: "Enter your key to activate PRO features.",
    buyPro: "Buy WinVault PRO (10€)",
    proActive: "WinVault PRO Active",
    licenseActions: "License Actions",
    adminPanel: "Admin Panel / License Generator",
    adminDesc: "This area is for admins only. You can generate new keys for your customers here.",
    generateKey: "Generate New Key",
    language: "Language / Dil",
    deviceId: "Device ID",
    lockToDevice: "Lock to Device",
    targetDeviceId: "Target Device ID",
    invalidDevice: "This license key cannot be used on this device.",
    deviceMismatch: "Device Mismatch",
    securityPrefs: "Security Preferences",
    autoLock: "Auto Lock Timeout",
    autoLockDesc: "Choose when the session should lock due to inactivity.",
    time1min: "1 Minute",
    time5min: "5 Minutes",
    time15min: "15 Minutes",
    time30min: "30 Minutes",
    time1hour: "1 Hour",
    timeNever: "Never (Not Recommended)",
    biometricUnlock: "Windows Hello / Biometric Lock",
    biometricDesc: "Allows you to unlock the vault using fingerprint or facial recognition (Windows Hello).",
    biometricActive: "Biometric Lock Active",
    biometricError: "Biometric authentication failed.",
    biometricNotAvailable: "Windows Hello is not supported or configured on this device.",
    biometricReason: "Please verify your identity to unlock WinVault.",
    enableBiometrics: "Enable Biometric Lock",

    // Duress
    duressPassword: "Duress Password (Fake Vault)",
    duressDesc: "Set a second password to hide your real data under duress. Logging in with this password opens an empty/fake vault.",
    duressSetTitle: "Set Duress Password",
    duressActive: "Duress Mode Active",
    duressWarning: "WARNING: This password must be DIFFERENT from your Master Password.",

    // Privacy & GDPR
    privacyPolicy: "Privacy Policy",
    privacyTitle: "Privacy Policy & Data Security",
    privacyDesc: "How does WinVault protect and use your data?",
    gdprText: "PRIVACY POLICY AND DATA SECURITY\n\nWinVault is developed with 'Privacy by Design' principles.\n\n1. DATA OWNERSHIP\nAll your data (passwords, notes, files, payment cards) is stored locally on your device (IndexedDB) only. It is never sent to any server, cloud storage service, or third parties. Your data remains completely under your control.\n\n2. ENCRYPTION AND SECURITY\n- Your data is encrypted using AES-256 GCM algorithm (256-bit encryption key)\n- Your master password is hashed using Argon2id function (3 iterasyon, 64MB memory, GPU-resistant)\n- PBKDF2 (600,000 iterations) is used for AES key derivation\n- Each encryption uses random 16-byte salt and 12-byte IV\n- Your master password is never stored, only its hash is compared\n- Master key is deleted from memory after processing\n\n3. DATA COLLECTION POLICY\nWinVault DOES NOT collect:\n- Usage statistics or analytics data\n- Telemetry or crash reports\n- Personal identifiers (GDPR Article 4)\n- Location, browsing history, or device information\n- Email addresses or other personal data\n\n4. CLIPBOARD SECURITY\n- When passwords are copied to clipboard, they are automatically deleted after 5 seconds\n- Other applications cannot access your clipboard (Electron context isolation)\n\n5. SCREEN CAPTURE PROTECTION\n- Application shows blank screen until content loads\n- Screenshot and recording are blocked during startup\n\n6. YOUR GDPR RIGHTS (EU General Data Protection Regulation)\n- Right to Access: Export all your data using 'Export Data'\n- Right to Data Portability: Data can be exported in CSV/JSON format\n- Right to Erasure: Permanently delete all data using 'Delete Data'\n- Deleted data cannot be recovered unless restored from backup\n\n7. KVKK COMPLIANCE (Turkish Personal Data Protection Law)\nWinVault complies with KVKK:\n- Informed Consent: You have read this policy\n- Legitimate Interest: Password management and security\n- Data Minimization: Only necessary data is collected\n- Storage Limitation: Data is stored locally on device\n- User Rights: You maintain control as Data Controller\n\n8. MALWARE PROTECTION\nWinVault contains no malicious software, rootkits, spyware, or adware.\n\n9. OPEN SOURCE AND AUDIT\nWinVault's security features can be independently audited.\n\n10. POLICY CHANGES\nThis policy may change. Updates will be notified in the application.\n\n11. CONTACT\nFor privacy and support questions, use Settings > Support to contact us.",

    // Support
    support: "Support",
    supportTitle: "Support & Help",
    supportDesc: "Contact us if you have any questions or issues",
    contactSupport: "Contact Support",
    supportEmail: "sales@hetech-me.space",
    sendEmail: "Send Email",
    emailSent: "Opening your email application...",
    supportSubject: "WinVault Support Request",
    supportMessage: "Hello,\n\nI have a question/issue with WinVault:\n\n[Please describe your issue in detail here]\n\nTECHNICAL INFO:\nDevice ID: [Auto-filled]\nVersion: WinVault 2.0.0\n\nThank you,",

    // Backup
    encryptedBackup: "Encrypted Backup (.winvault)",
    encryptBackupTitle: "Set Backup Password",
    encryptBackupDesc: "This file will be encrypted. You must enter this password to restore. Do not forget it!",
    backupPassPlaceholder: "Backup Password",
    restoreTitle: "Enter Backup Password",
    restoreDesc: "This file is encrypted. Enter password to unlock contents.",
    restoreAction: "Decrypt and Restore",
    restoreSuccess: "Backup restored successfully.",
    restoreError: "Wrong password or corrupted file.",

    // Payment
    cryptoPayment: "Crypto Payment",
    paymentTitle: (coin: string) => `Payment with ${coin}`,
    paymentInstruction: "Please send 10€ (Euro) worth of crypto to the address below.",
    paymentWarning: "Please ensure you are using the correct network. Transfers to wrong networks may be lost.",
    paymentButton: "I Paid / Notify",
    emailSubject: "WinVault PRO Payment Notification",
    emailBody: (coin: string, address: string, dev1: string, dev2?: string) =>
      `Merhaba,\\n\\nWinVault PRO lisansı için 10€ (Euro) değerinde ödeme yaptım.\\n\\nÖdenen Coin: ${coin}\\nCüzdan Adresi: ${address}\\n\\nTXID (İşlem Kodu): [LÜTFEN BURAYA YAPIŞTIRIN]\\n\\nCihaz 1 ID: ${dev1} (Mevcut Cihaz)\\nCihaz 2 ID: ${dev2 || '[İKİNCİ CİHAZ ID BURAYA]'}\\n\\nLisans anahtarımı gönderir misiniz? Teşekkürler.\\n\\n------------------------------------------------\\n\\nHello,\\n\\nI have made a payment of 10€ (Euro) for WinVault PRO license.\\n\\nPaid Coin: ${coin}\\nWallet Address: ${address}\\n\\nTXID (Transaction ID): [PASTE HERE]\\n\\nDevice 1 ID: ${dev1} (Current Device)\\nDevice 2 ID: ${dev2 || '[SECOND DEVICE ID HERE]'}\\n\\nPlease send my license key. Thanks.`,

    // Login
    loginTitle: "WinVault",
    login2FA: "2FA Authentication",
    loginWord: "Security Check",
    enterPass: "Enter your password to continue",
    enterCode: "Enter Authenticator code",
    enterWords: (i1: number, i2: number) => `Enter words ${i1} and ${i2}`,
    resetApp: "Reset Application",
    resetConfirmTitle: "Reset Confirmation",
    resetConfirmDesc: "All your data will be permanently deleted.",
    reset2FADesc: "For security, you must enter the 6-digit code from your Authenticator app to reset.",
    resetTextDesc: "Enter your Master Password to confirm reset.",
    verifyAndReset: "Verify and Reset",
    deleteData: "Delete Data",
    wrongPass: "Wrong password",
    invalidCode: "Invalid code",
    wordsMismatch: "Words do not match",
    defaultPassWarning: "Security Warning",
    defaultPassDesc: "Your password is set to default (demo123). Please change it in settings.",

    // Rate Limiting
    accountLocked: "Account Locked",
    accountLockedDesc: "Too many failed attempts. Account is temporarily locked.",
    remainingTime: "Time remaining",
    warningTitle: "Warning!",
    warningDesc: (attempts: number) => `You have ${attempts} attempts remaining. The account will be temporarily locked after failed attempts.`,

    // Trial
    trialActiveDesc: "Free trial active. You can test all PRO features for 3 days.",
    trialExpired: "Trial Expired",
    trialDesc: "Your 3-day free trial has ended. Please purchase a WinVault PRO license to continue accessing your data.",
    daysLeft: "Remaining: ",
    day: "Days"
  }
};

const WORD_LIST_PASSPHRASE = [
  "elma", "armut", "kalem", "masa", "mavi", "sari", "kirmizi", "yesil", "beyaz", "siyah",
  "kedi", "kopek", "kus", "balik", "at", "aslan", "kaplan", "ayi", "kurt", "tilki",
  "ev", "okul", "park", "bahce", "orman", "deniz", "gol", "nehir", "dag", "tepe",
  "araba", "ucak", "gemi", "tren", "bisiklet", "otobus", "taksi", "kamyon", "motor",
  "kitap", "defter", "kagit", "kalem", "silgi", "cetvel", "canta", "saat", "gozluk",
  "el", "ayak", "bas", "goz", "kulak", "burun", "agiz", "dis", "sac", "yuz",
  "anne", "baba", "kardes", "abi", "abla", "dede", "nene", "teyze", "hala", "dayi",
  "gunes", "ay", "yildiz", "bulut", "yagmur", "kar", "ruzgar", "simsek", "hava", "su",
  "ekmek", "peynir", "zeytin", "yumurta", "sut", "cay", "kahve", "seker", "tuz", "bal",
  "bilgisayar", "telefon", "tablet", "ekran", "klavye", "fare", "yazici", "internet", "oyun", "muzik",
  "apple", "pear", "pen", "table", "blue", "yellow", "red", "green", "white", "black",
  "cat", "dog", "bird", "fish", "horse", "lion", "tiger", "bear", "wolf", "fox",
  "house", "school", "park", "garden", "forest", "sea", "lake", "river", "mountain", "hill",
  "car", "plane", "ship", "train", "bike", "bus", "taxi", "truck", "motor",
  "book", "paper", "eraser", "ruler", "bag", "watch", "glass", "hand", "foot", "head",
  "eye", "ear", "nose", "mouth", "tooth", "hair", "face", "sun", "moon", "star",
  "cloud", "rain", "snow", "wind", "air", "water", "bread", "cheese", "olive", "egg",
  "milk", "tea", "coffee", "sugar", "salt", "honey", "computer", "phone", "screen", "keyboard"
];

const secureRandomInt = (max: number): number => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
};

export const generatePasswordFromSettings = (settings: GeneratorSettings): string => {
  if (settings.mode === 'memorable') {
    const wordCount = settings.wordCount || 3;
    const separator = settings.separator || '-';
    const capitalize = settings.capitalize !== false;
    const includeNumbers = settings.includeNumbers !== false;
    const includeSymbols = settings.includeSymbols !== false;
    const list = WORD_LIST_PASSPHRASE;

    const selectedWords: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      let word = list[secureRandomInt(list.length)];
      if (capitalize) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }

      // Inject Number randomly
      if (includeNumbers && secureRandomInt(10) > 6) {
        word += secureRandomInt(10);
      }

      // Inject Symbol randomly
      if (includeSymbols && secureRandomInt(10) > 7) {
        const symbols = '!@#$%^&*';
        word += symbols[secureRandomInt(symbols.length)];
      }

      selectedWords.push(word);
    }
    return selectedWords.join(separator);
  }

  // STANDARD RANDOM LOGIC
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let chars = lowercase;
  if (settings.includeUppercase) chars += uppercase;
  if (settings.includeNumbers) chars += numbers;
  if (settings.includeSymbols) chars += symbols;

  let generated = '';
  for (let i = 0; i < settings.length; i++) {
    generated += chars[secureRandomInt(chars.length)];
  }
  return generated;
};

// --- SECURITY UTILS ---

// Generate random salt for password hashing
const generateSalt = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(16));
};

// Store salt securely in IndexedDB
export const storeSalt = async (salt: Uint8Array): Promise<void> => {
  // const { dbService } = await import('./services/idb'); // Removed dynamic import
  const saltString = Array.from(salt).map((b: number) => b.toString(16).padStart(2, '0')).join('');
  await dbService.saveConfig('masterSalt', saltString);
};

// Retrieve salt from IndexedDB
export const getStoredSalt = async (): Promise<Uint8Array | null> => {
  // const { dbService } = await import('./services/idb'); // Removed dynamic import
  const saltString = await dbService.getConfig('masterSalt');
  if (!saltString) return null;

  const saltBytes = saltString.match(/.{2}/g)?.map((byte: string) => parseInt(byte, 16));
  return saltBytes ? new Uint8Array(saltBytes) : null;
};

// Argon2id Hash Function (SECURE - Adaptive parameters based on Hardware)
export const hashPassword = async (password: string, providedSalt?: Uint8Array): Promise<{ hash: string; salt: Uint8Array }> => {
  const salt = providedSalt || generateSalt();

  if (!providedSalt) {
    await storeSalt(salt);
  }

  // --- ADAPTIVE HARDWARE DETECTION ---
  // Default: 64MB / 3 Iterations (Safe Standard)
  let memory = 65536;
  let iterations = 3;

  // Detect Hardware (CPU Cores)
  const cores = navigator.hardwareConcurrency || 4;

  if (cores >= 8) {
    // High-End PC: Increase memory to 128MB or iterations to 4
    memory = 131072; // 128 MiB
    iterations = 4;
  } else if (cores <= 2) {
    // Low-End Device: Downscale slightly to prevent crash/freeze but keep security
    memory = 32768; // 32 MiB
    iterations = 3;
  }

  const hash = await argon2id({
    password,
    salt,
    parallelism: 1,
    iterations: iterations,
    memorySize: memory,
    hashLength: 32,
    outputType: 'hex',
  });

  return { hash, salt };
};

// Verify password with stored salt (with Fallback Support for older versions)
export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  try {
    const storedSalt = await getStoredSalt() || new Uint8Array([12, 120, 22, 98, 33, 11, 87, 45, 99, 12, 55, 66, 77, 88, 99, 111]);

    // 1. Try with current adaptive settings
    const { hash: currentHash } = await hashPassword(password, storedSalt);
    if (currentHash === storedHash) return true;

    // 2. Try legacy configurations (Self-healing fallback)
    const configurations = [
      { iterations: 64, memorySize: 2048 },  // WinVault 2.x Intermediate
      { iterations: 2, memorySize: 47104 },   // WinVault 2.x Original WASM
      { iterations: 32, memorySize: 1024 },   // WinVault 1.x / GDPR Reference
      { iterations: 3, memorySize: 65536 }    // Modern Fixed Standard
    ];

    for (const config of configurations) {
      try {
        const hash = await argon2id({
          password,
          salt: storedSalt,
          parallelism: 1,
          iterations: config.iterations,
          memorySize: config.memorySize,
          hashLength: 32,
          outputType: 'hex',
        });
        if (hash === storedHash) {
          console.log(`Login successful using legacy fallback (${config.iterations} iters, ${config.memorySize}KB mem)`);
          return true;
        }
      } catch (e) {
        continue;
      }
    }

    return false;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

// --- AES-256 ENCRYPTION UTILS ---

// Helper: Buffer to Base64 (Fixed to handle both ArrayBuffer and Uint8Array)
const buff_to_base64 = (buff: ArrayBuffer | Uint8Array): string => {
  let binary = '';
  // Convert input to Uint8Array view if it isn't already
  const bytes = buff instanceof Uint8Array ? buff : new Uint8Array(buff);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Helper: Base64 to Buffer
const base64_to_buff = (b64: string): Uint8Array => {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};

// Derive Key from Password using PBKDF2 (For AES Key generation)
const deriveKey = async (password: string, salt: Uint8Array, iterations: number = 600000): Promise<CryptoKey> => {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password) as any, // Cast to any to fix TS2345
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any, // Cast to any to avoid TS2769
      iterations: iterations,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const encryptData = async (data: any, password: string): Promise<string> => {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv as any // Cast to any to fix TS2322
      },
      key,
      encodedData as any // Cast to any to fix TS2345
    );

    const encryptedString = `${buff_to_base64(salt)}:${buff_to_base64(iv)}:${buff_to_base64(encryptedContent)}`;
    return encryptedString;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Veri şifrelenemedi.");
  }
};

export const decryptData = async (encryptedStr: string, password: string): Promise<any> => {
  const parts = encryptedStr.split(':');
  if (parts.length !== 3) {
    throw new Error("Invalid format");
  }
  const salt = base64_to_buff(parts[0]);
  const iv = base64_to_buff(parts[1]);
  const encryptedContent = base64_to_buff(parts[2]);

  // Try modern standard first (600,000)
  // Try legacy standard as fallback (100,000)
  const iterationTries = [600000, 100000];

  for (const iters of iterationTries) {
    try {
      const key = await deriveKey(password, salt, iters);
      const decryptedContent = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv as any
        },
        key,
        encryptedContent as any
      );
      const decoded = new TextDecoder().decode(decryptedContent);
      return JSON.parse(decoded);
    } catch (e) {
      // If it's the last try, throw the error
      if (iters === iterationTries[iterationTries.length - 1]) {
        console.error("Decryption error after fallbacks:", e);
        throw new Error("Veri çözülemedi. Şifre yanlış veya veri bozuk.");
      }
    }
  }
};

// Generate Random Secret for TOTP
export const generateTOTPSecret = (): string => {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
};

// Verify TOTP Token
export const verifyTOTP = (token: string, secret: string): boolean => {
  const totp = new OTPAuth.TOTP({
    issuer: 'WinVault',
    label: 'WinVault User',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret)
  });

  // validate returns delta if valid, null if invalid. delta 0 means current window.
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
};

// Generate TOTP URI for QR Code
export const getTOTPUri = (secret: string): string => {
  const totp = new OTPAuth.TOTP({
    issuer: 'WinVault',
    label: 'WinVault User',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret)
  });
  return totp.toString();
};

// Generate 24 Random Words (BIP39 Standard)
export const generateRecoveryWords = (): string[] => {
  const words: string[] = [];
  const list = [...WORD_LIST_PASSPHRASE]; // Reuse passphrase list
  for (let i = 0; i < 24; i++) {
    const randomIndex = Math.floor(Math.random() * list.length);
    words.push(list[randomIndex]);
  }
  return words;
};

// --- DATA UTILS (IMPORT/EXPORT) ---

// Updated to return Promise and support encryption
export const exportToCSV = async (credentials: Credential[], password?: string) => {
  const headers = ['type', 'site/bank', 'username/cardHolder', 'alias', 'password/cardNumber', 'notes', 'expiry', 'cvv'];

  // Helper to prevent CSV Injection
  const escapeCsvValue = (val: string | undefined): string => {
    if (!val) return '';
    let str = String(val);
    // CSV Injection protection: if starts with = + - @ tab or carriage return
    if (/^[=\+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  const csvContent = [
    headers.join(','),
    ...credentials.map(c => {
      const type = c.type || 'LOGIN';
      const name = escapeCsvValue(c.siteName);
      const user = escapeCsvValue(c.username || c.cardHolder || '');
      const alias = escapeCsvValue(c.alias || '');
      const pass = escapeCsvValue(c.passwordValue || c.cardNumber || '');
      const notes = escapeCsvValue(c.notes || '');
      const expiry = escapeCsvValue(c.expiry || '');
      const cvv = escapeCsvValue(c.cvv || '');
      return `${type},${name},${user},${alias},${pass},${notes},${expiry},${cvv}`;
    })
  ].join('\n');

  let finalContent = csvContent;
  let mimeType = 'text/csv;charset=utf-8;';
  let filename = `winvault_export_${new Date().toISOString().slice(0, 10)}.csv`;

  if (password) {
    finalContent = await encryptData(csvContent, password);
    mimeType = 'application/octet-stream';
    // Keeping .csv extension as requested, even if content is encrypted blob
  }

  const blob = new Blob([finalContent], { type: mimeType });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Updated to return Promise and support encryption
export const exportToJSON = async (credentials: Credential[], password?: string) => {
  const jsonContent = JSON.stringify(credentials, null, 2);
  let finalContent = jsonContent;
  let mimeType = 'application/json';
  let filename = `winvault_backup_${new Date().toISOString().slice(0, 10)}.json`;

  if (password) {
    finalContent = await encryptData(jsonContent, password);
    mimeType = 'application/octet-stream';
    // Keeping .json extension as requested
  }

  const blob = new Blob([finalContent], { type: mimeType });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Helper to safely split CSV lines handling quotes
const splitCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
};

export const parseCSV = (text: string): Omit<Credential, 'id' | 'updatedAt'>[] => {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase().trim().replace(/^"|"$/g, ''));

  let nameIdx = -1;
  let usernameIdx = -1;
  let passwordIdx = -1;
  let urlIdx = -1;
  let notesIdx = -1;
  let aliasIdx = -1;
  // Simple type detection not implemented for import yet, defaults to login for generic CSVs

  headers.forEach((h, i) => {
    if (['name', 'title', 'site', 'app', 'service', 'account', 'bank'].some(k => h === k || h.includes(k))) {
      if (nameIdx === -1) nameIdx = i;
    }
    else if (['username', 'user', 'email', 'login', 'e-mail', 'holder'].some(k => h === k || h.includes(k))) {
      if (usernameIdx === -1) usernameIdx = i;
    }
    else if (['alias', 'takma', 'nick'].some(k => h === k || h.includes(k))) {
      if (aliasIdx === -1) aliasIdx = i;
    }
    else if (['password', 'pass', 'key', 'number'].some(k => h === k || h.includes(k))) {
      if (passwordIdx === -1) passwordIdx = i;
    }
    else if (['url', 'uri', 'website', 'link', 'address'].some(k => h === k || h.includes(k))) {
      if (urlIdx === -1) urlIdx = i;
    }
    else if (['note', 'notes', 'comment', 'extra', 'info'].some(k => h === k || h.includes(k))) {
      if (notesIdx === -1) notesIdx = i;
    }
  });

  if (nameIdx === -1 && passwordIdx === -1 && headers.length >= 2) {
    nameIdx = 0;
    urlIdx = 1;
    usernameIdx = 2;
    passwordIdx = 3;
    notesIdx = 4;
  }

  const result: Omit<Credential, 'id' | 'updatedAt'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);

    const siteName = (nameIdx > -1 ? values[nameIdx] : '') || '';
    const username = (usernameIdx > -1 ? values[usernameIdx] : '') || '';
    const alias = (aliasIdx > -1 ? values[aliasIdx] : '') || '';
    const passwordValue = (passwordIdx > -1 ? values[passwordIdx] : '') || '';
    let notes = (notesIdx > -1 ? values[notesIdx] : '') || '';
    const url = (urlIdx > -1 ? values[urlIdx] : '') || '';

    let finalName = siteName;
    if (!finalName && url) finalName = url;
    if (!finalName) finalName = 'Bilinmeyen Kayıt';

    if (url && finalName !== url) {
      notes = notes ? `${notes} (URL: ${url})` : `URL: ${url}`;
    }

    if (siteName || username || passwordValue) {
      result.push({
        type: 'LOGIN', // Varsayılan olarak login kabul et, gelişmiş import daha sonra eklenebilir
        siteName: finalName,
        username: username,
        alias: alias,
        passwordValue: passwordValue,
        category: 'Imported',
        notes: notes
      });
    }
  }

  return result;
};


// --- LICENSE UTILS (OFFLINE, SIGNED) ---

const LICENSE_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// Cached Device ID (hashed / normalized)
let CACHED_DEVICE_ID = "";

// Public key (SPKI/PEM) used to verify offline licenses.
// IMPORTANT: Replace the placeholder below with the content of your generated `public.pem`.
export const PUBLIC_LICENSE_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuSSbu2nDlVaeaHl82lkY
C4EQrByO8FJRt3ftZ2q+dGJNauxoiLwuWG3QFJVrnXQht9PbP+lrkEiJTPdydUF7
4/EN7C7YqGOHt9cLXcOMLIM7V4OZAAMKPOUP2amJpuIHt9i/uUSYzif7WcrvKybB
Uu/j8fouZxtjEA+AlZbF/FZqQXOWulz1CpJTWUy+2Xggk7nktiSBZcQELPanpumT
QEbCI57yF1LAwCh/dj3Zj3LTBIid/W6eL/iYmYRuj51y9M+S7ZN0762cUr4AOT5r
6AEYO7JZ48q9GmyPoZ3WmGM+OZuliDPFIggThSEVzXzjfWCj/PR0m8dqaqwtuXaK
owIDAQAB
-----END PUBLIC KEY-----`;

// Hash Device ID for Locking (same logic is used in external license generator)
const hashDeviceId = (deviceId: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < deviceId.length; i++) {
    h ^= deviceId.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Convert to base 36 and take 8 chars
  return Math.abs(h).toString(36).toUpperCase().padStart(8, 'X').slice(0, 8);
};

// Store hashed HWID globally and in localStorage as fallback
export const setGlobalDeviceId = (rawId: string) => {
  const hashed = hashDeviceId(rawId);
  CACHED_DEVICE_ID = hashed;
  localStorage.setItem('winvault_device_id', hashed);
};

// Normalized device id used by licensing system
export const getDeviceId = (): string => {
  if (CACHED_DEVICE_ID) return CACHED_DEVICE_ID;

  let id = localStorage.getItem('winvault_device_id');
  if (id) {
    CACHED_DEVICE_ID = id;
    return id;
  }

  // Last resort: temporary random ID until real HWID arrives from Electron
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 8; i++) randomPart += chars[Math.floor(Math.random() * chars.length)];
  id = `TMP-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}`;

  CACHED_DEVICE_ID = id;
  return id;
};

// Helper: import RSA public key from PEM (browser WebCrypto)
const importPublicKey = async (pem: string): Promise<CryptoKey> => {
  const b64 = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s+/g, '');
  const binaryDer = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'spki',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
};

export interface OfflineLicenseInfo {
  deviceId: string;
  tier: 'PRO';
  expiresAt: string;
  nonce: string;
  sig: string;
}

export const verifyOfflineLicense = async (
  base64License: string,
  currentDeviceId: string
): Promise<{ valid: boolean; reason?: string; tier?: 'PRO'; expiresAt?: string }> => {
  try {
    let jsonStr: string;
    try {
      jsonStr = atob(base64License.trim());
    } catch {
      return { valid: false, reason: 'FORMAT_ERROR' };
    }

    const lic = JSON.parse(jsonStr) as OfflineLicenseInfo;

    if (!lic.deviceId || !lic.tier || !lic.expiresAt || !lic.sig) {
      return { valid: false, reason: 'FORMAT_ERROR' };
    }

    if (lic.deviceId !== currentDeviceId) {
      return { valid: false, reason: 'DEVICE_MISMATCH' };
    }

    if (lic.expiresAt !== 'NEVER') {
      const now = Date.now();
      if (new Date(lic.expiresAt).getTime() < now) {
        return { valid: false, reason: 'EXPIRED' };
      }
    }

    const dataToVerify = `${lic.deviceId}|${lic.tier}|${lic.expiresAt}|${lic.nonce}`;
    const sigBytes = Uint8Array.from(atob(lic.sig), c => c.charCodeAt(0));

    const pubKey = await importPublicKey(PUBLIC_LICENSE_KEY_PEM);
    const ok = await crypto.subtle.verify(
      { name: 'RSASSA-PKCS1-v1_5' },
      pubKey,
      sigBytes,
      new TextEncoder().encode(dataToVerify)
    );

    if (!ok) return { valid: false, reason: 'INVALID_SIG' };

    return { valid: true, tier: lic.tier, expiresAt: lic.expiresAt };
  } catch (e) {
    console.error('Offline license verify error', e);
    return { valid: false, reason: 'UNKNOWN' };
  }
};

// Helper for Favicon
export const getFaviconUrl = (input: string): string => {
  if (!input) return '';
  let domain = input.toLowerCase();
  domain = domain.replace(/^(https?:\/\/)/, '');
  domain = domain.split('/')[0];
  domain = domain.replace(/^www\./, '');
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
};

// --- FILE ATTACHMENT UTILS ---

export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const downloadAttachment = async (data: string, fileName: string, mimeType: string): Promise<boolean> => {
  // Try Electron IPC first
  if (window.electron && window.electron.saveFile) {
    try {
      const success = await window.electron.saveFile(fileName, data);
      if (success) return true;
    } catch (err) {
      console.error("IPC saveFile failed:", err);
    }
  }

  // Client-side Fallback
  try {
    let cleanBase64 = data;
    const commaIndex = data.indexOf(',');
    if (commaIndex !== -1) {
      cleanBase64 = data.substring(commaIndex + 1);
    }

    if (!cleanBase64 || cleanBase64.trim() === '') {
      console.error("Empty base64 data");
      return false;
    }

    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    return true;
  } catch (error) {
    console.error('Client-side download error:', error);
    return false;
  }
};

// Re-export memory security utilities
export {
  SecureString,
  MemoryManager,
  SecureClipboard,
  secureCopyPassword,
  secureCreatePassword,
  secureUsePassword,
  initializeMemorySecurity
} from './utils/memorySecurity';

// Re-export enhanced memory security
export {
  SecureHeap,
  initializeEnhancedMemorySecurity
} from './utils/enhancedMemorySecurity';

// Re-export advanced clipboard security
export {
  AdvancedSecureClipboard
} from './utils/advancedClipboardFixed';

// Re-export WASM security
export type { SecurityConfig, SecurityMetrics } from './utils/wasmSecurityClean';
export { wasmSecurityManager } from './utils/wasmSecurityClean';

// Re-export ML validation
export type { ThreatPattern, ThreatAnalysis, ValidationRules } from './utils/mlValidation';
export { AdvancedValidator } from './utils/mlValidation';

// Re-export advanced session management
export type { SessionData, SessionConfig } from './utils/advancedSessionManager';
export { AdvancedSessionManager } from './utils/advancedSessionManager';
# 🔒 WinVault Güvenli Tarayıcı Uzantısı Kurulum Kılavuzu

WinVault, tarayıcınız ile masaüstü uygulaması arasında güvenli bir iletişim kurmak için **Native Messaging** (Yerel Mesajlaşma) teknolojisini kullanır. Bu yöntem, eski HTTP sunucu yöntemine göre çok daha güvenlidir çünkü açık bir port kullanmaz ve dış ağ saldırılarına kapalıdır.

Bu kılavuzda, yeni güvenli sistemin kurulumu ve kullanımı adım adım anlatılmaktadır.

---

## 🛠️ Kurulum Adımları

Bu işlemler sadece tek seferliktir.

### Adım 1: Masaüstü Uygulamasını Başlatın
Öncelikle `WinVault` uygulamasının açık olduğundan ve kilitli olmadığından emin olun.

### Adım 2: Uzantıyı Tarayıcıya Yükleyin (Chrome/Edge/Brave)

1. Tarayıcınızda Uzantılar sayfasını açın:
   - **Chrome:** `chrome://extensions`
   - **Edge:** `edge://extensions`
   - **Brave:** `brave://extensions`
2. Sağ üst köşedeki **"Geliştirici modu" (Developer mode)** anahtarını açın.
3. Sol üstte beliren **"Paketlenmemiş öğe yükle" (Load unpacked)** butonuna tıklayın.
4. Açılan pencerede projenizin içindeki `browser-extension` klasörünü seçin.
   - Örn: `...\winvault17\browser-extension`
5. Uzantı listeye eklenecektir. Uzantının **ID**'sini (örn: `abcdefghijklmnopqrstuvwxyz012345`) bir yere not edin.

### Adım 3: Native Host Kaydını Yapın

Masaüstü uygulamanızın tarayıcı ile konuşabilmesi için bir kayıt işlemi gereklidir.

1. Proje klasöründe `native-host` klasörüne gidin.
   - Örn: `...\winvault17\native-host`
2. `install_host.bat` dosyasına **sağ tıklayın** ve **"Yönetici olarak çalıştır"** seçeneğini seçin.
3. Açılan siyah pencere sizden **Extension ID** isteyecektir.
4. Adım 2'de not ettiğiniz 32 karakterlik ID'yi yapıştırın ve Enter'a basın.
5. "Kurulum Tamamlandı" mesajını gördüğünüzde pencereyi kapatın.

### Adım 4: Tarayıcıyı Yeniden Başlatın
Değişikliklerin aktif olması için tarayıcınızı tamamen kapatıp yeniden açın.

---

## 🚀 Kullanım

### Durum Kontrolü
Tarayıcınızın sağ üst köşesindeki WinVault (🔒) ikonuna tıklayın:
- 🟢 **Yeşil Nokta:** "WinVault Bağlı" - Sistem çalışıyor.
- 🟡 **Turuncu Nokta:** "Kilitli" - Masaüstü uygulamasında şifrenizi girin.
- 🔴 **Kırmızı Nokta:** "Bağlantı Yok" - Masaüstü uygulaması kapalı veya kurulum hatalı.

### Otomatik Doldurma (Autofill)
1. Bir giriş sayfasına (örn: facebook.com) gidin.
2. Uzantı ikonuna tıklayın.
3. Eğer bu site için kayıtlı bir şifreniz varsa listede görünecektir.
4. İstediğiniz hesaba tıklayın, bilgiler form alanlarına otomatik doldurulacaktır.

### Yeni Şifre Kaydetme
1. Bir siteye giriş yaparken kullanıcı adı ve şifrenizi yazıp "Giriş" butonuna basın.
2. WinVault, şifre gönderimini algılayacak ve sağ alt köşede bir bildirim gösterecektir.
3. Masaüstü uygulamasında "Kaydetmek istiyor musunuz?" onayı çıkacaktır. Onaylarsanız şifreniz şifreli kasanıza eklenir.

---

## ❓ Sorun Giderme

**Soru: "Bağlantı Yok" hatası alıyorum.**
- Masaüstü uygulamasının açık olduğundan emin olun.
- `install_host.bat` işlemini doğru Extension ID ile yaptığınızdan emin olun.
- Tarayıcıyı yeniden başlattığınızdan emin olun.

**Soru: Şifreleri bulamıyor.**
- Kasanızın kilitli olmadığından emin olun.
- Site adresinin (domain) kasadaki kayıtla eşleştiğinden emin olun.

**Soru: Uzantı simgesinde kırmızı ünlem (!) var.**
- Native Host bağlantısı kopmuş olabilir. Uzantıyı devre dışı bırakıp tekrar etkinleştirin.

---

**Güvenlik Notu:**
Bu sistem verilerinizi yerel ağ (localhost) dışına çıkarmaz. Tüm iletişim şifreli ve cihazınızın içinde gerçekleşir. Native Messaging sayesinde dışarıdan port taraması yapan saldırganlar uygulamanıza erişemez.

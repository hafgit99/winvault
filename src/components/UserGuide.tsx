import React from 'react';
import { X, Shield, Key, Download, Zap, Smartphone, CreditCard, Lock, FileText, Search, Settings, Fingerprint } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { TRANSLATIONS } from '../utils';

const UserGuide: React.FC = () => {
    const { isGuideOpen: isOpen, setGuideOpen: onClose, lang } = useAppStore();
    if (!isOpen) return null;

    const content = GUIDE_CONTENT[lang];

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{content.title}</h2>
                    </div>
                    <button onClick={() => onClose(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <div className="prose dark:prose-invert max-w-none space-y-12">

                        {content.sections.map((section, idx) => (
                            <div key={idx} className="space-y-4">
                                <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
                                    {section.icon}
                                    <h3 className="text-xl font-bold m-0">{section.title}</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {section.items.map((item, itemIdx) => (
                                        <div key={itemIdx} className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-base">{item.subtitle}</h4>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">{item.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end flex-shrink-0">
                    <button onClick={() => onClose(false)} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-900/20">
                        {lang === 'tr' ? 'Anlaşıldı, Kapat' : 'Got it, Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const GUIDE_CONTENT = {
    tr: {
        title: "WinVault Kullanım Kılavuzu",
        sections: [
            {
                title: "Temel Kullanım ve Kasa",
                icon: <Lock className="w-6 h-6" />,
                items: [
                    { subtitle: "Hesap Ekleme", text: "Yeni Ekle butonuna tıklayarak Web Sitesi Girişi, Kredi Kartı veya Güvenli Not ekleyebilirsiniz. Veri tipi seçimi (Login/Kart/Not) otomatik form yapısını değiştirir." },
                    { subtitle: "Düzenleme ve Silme", text: "Bir kaydın üzerine tıklayarak detaylarını görebilir, sağ üstteki kalem ikonuyla düzenleyebilir veya çöp kutusu ikonuyla silebilirsiniz. Silinen kayıtlar 30 gün Çöp Kutusunda saklanır." },
                    { subtitle: "Arama ve Filtreleme", text: "Üst kısımdaki arama çubuğunu kullanarak kayıtlarınız arasında hızlıca arama yapabilirsiniz. Ayrıca kategoriler (Sosyal, İş vb.) ile filtreleme yapabilirsiniz." },
                    { subtitle: "Belge Kasası", text: "Önemli PDF ve görsel dosyalarınızı (maksimum 5MB) yüksek şifreleme ile saklayabilirsiniz. Dosyalarınız uygulama veritabanında şifreli olarak tutulur ve sadece WinVault içinden erişilebilir." },
                    { subtitle: "Özel Alanlar (Custom Fields)", text: "Standart alanlar (Kullanıcı adı, şifre vb.) dışında, kayıtlarınıza istediğiniz kadar 'Etiket: Değer' şeklinde özel alan ekleyebilirsiniz. Örneğin; 'Müşteri No' veya 'Güvenlik Sorusu' gibi bilgileri burada saklayabilirsiniz." }
                ]
            },
            {
                title: "Gelişmiş Güvenlik",
                icon: <Shield className="w-6 h-6" />,
                items: [
                    { subtitle: "2FA (İki Faktörlü Doğrulama)", text: "Ayarlar > Güvenlik bölümünden 2FA'yı aktifleştirin. QR kodu Google Authenticator veya Authy gibi bir uygulama ile taratın. Artık giriş yaparken telefonunuzdaki kodu girmeniz gerekecektir." },
                    { subtitle: "Kurtarma Kelimeleri", text: "Master şifrenizi unutursanız hesabınızı kurtarmanın TEK yolu budur. 16 kelimelik anahtarı oluşturun ve güvenli bir kağıda not edin. Dijital ortamda saklamanız önerilmez." },
                    { subtitle: "Panic Butonu", text: "Acil bir durumda 'F12' veya 'Ctrl + Shift + X' tuşlarına basarak uygulamayı anında kilitleyebilir, panoyu temizleyebilir ve pencereyi gizleyebilirsiniz." },
                    { subtitle: "Sahte Kasa (Duress Password)", text: "Zorlama altındaysanız, ana şifreniz yerine belirlediğiniz Sahte Kasa Şifresini girin. Uygulama normal görünecek ancak içi boş (veya sahte verilerle dolu) bir kasa açacaktır. Asıl verileriniz gizli kalır." },
                    { subtitle: "Kayıt Bazlı TOTP", text: "Login tipi kayıtlarınızın 'Gelişmiş Özellikler' bölümüne TOTP anahtarınızı ekleyerek canlı 2FA kodları üretebilirsiniz. WinVault bu kodları otomatik yenilenen bir sayaç ile gösterir." },
                    { subtitle: "Şifre Geçmişi", text: "Bir şifreyi güncellediğinizde eski şifreniz silinmez. 'Şifre Geçmişi' bölümünde son 5 şifre değişikliği tarih bilgisiyle birlikte saklanır ve istendiğinde kopyalanabilir." },
                    { subtitle: "Windows Hello / Biyometrik Kilit", text: "Yüz tanıma veya parmak izi ile kilit açmanıza olanak tanır. Ayarlar > Güvenlik bölümünden aktifleştirilebilir. Her defasında uzun ana şifreyi yazma zahmetini ortadan kaldırır." }
                ]
            },
            {
                title: "Kolaylık Özellikleri",
                icon: <Zap className="w-6 h-6" />,
                items: [
                    { subtitle: "Auto-Type (Otomatik Doldurma)", text: "Bir web sitesindeyken (Örn: Google Giriş), 'Ctrl + Alt + A' kısayoluna basın. WinVault pencere başlığını algılar, uygun şifreyi bulur ve sizin yerinize kullanıcı adı ve şifreyi yazar." },
                    { subtitle: "Mini Mod", text: "Ana ekranda sağ üstteki küçültme ikonuna basarak mini moda geçebilirsiniz. Bu mod ekranın üstünde küçük bir çubuk olarak kalır, böylece çalışırken şifrelerinize hızlıca ulaşabilirsiniz." },
                    { subtitle: "Akıllı Arama (Command Palette)", text: "Uygulamanın her yerinden 'Ctrl + K' tuşlarına basarak akıllı arama çubuğunu açabilirsiniz. Buradan sadece şifrelerinizi değil, uygulama komutlarını da (Ayarlar, Kasa vb.) hızlıca bulup çalıştırabilirsiniz." },
                    { subtitle: "Şifre Üretici", text: "Rastgele ve güçlü şifreler oluşturmak için sol menüden Üretici'yi kullanın. 'Akılda Kalıcı' mod ile hatırlanabilir uzun şifreler (passphrase) oluşturabilirsiniz." }
                ]
            },
            {
                title: "Veri Yönetimi ve Yedekleme",
                icon: <Download className="w-6 h-6" />,
                items: [
                    { subtitle: "Otomatik Yedekleme", text: "Ayarlar > Veri Yönetimi > Otomatik Yedekleme kısmından bir klasör seçin. Uygulamadan her çıkışınızda veritabanınızın şifreli bir kopyası (.winvault) bu klasöre kaydedilir." },
                    { subtitle: "Dışa Aktarma (Export)", text: "Verilerinizi başka bir cihaza taşımak için .winvault formatını kullanın. Başka yöneticilere geçmek için CSV veya JSON formatlarını kullanabilirsiniz. İsterseniz bu dosyaları da şifreleyebilirsiniz." },
                    { subtitle: "İçe Aktarma (Import)", text: "Eski yedeklerinizi veya başka uygulamalardan aldığınız CSV/JSON dosyalarını sürükle-bırak yöntemiyle içeri aktarabilirsiniz." }
                ]
            }
        ]
    },
    en: {
        title: "WinVault User Manual",
        sections: [
            {
                title: "Basics & Vault Usage",
                icon: <Lock className="w-6 h-6" />,
                items: [
                    { subtitle: "Adding Accounts", text: "Click 'Add New' to create Login credentials, Credit Cards, or Secure Notes. Selecting the type modifies the form accordingly." },
                    { subtitle: "Editing & Deleting", text: "Click on any record to view details. Use the pencil icon to edit or the trash icon to delete. Deleted items are kept in the Recycle Bin for 30 days." },
                    { subtitle: "Search & Filter", text: "Use the search bar at the top to find credentials instantly. You can also filter by categories like Social, Banking, etc." },
                    { subtitle: "Document Vault", text: "Store your important PDFs and image files (up to 5MB) with high-level encryption. Your files are stored encrypted in the database and can only be accessed within WinVault." },
                    { subtitle: "Custom Fields", text: "Beyond standard fields (username, password), you can add any number of 'Label: Value' pairs to your records. Useful for 'Account Numbers' or 'Secret Questions'." }
                ]
            },
            {
                title: "Advanced Security",
                icon: <Shield className="w-6 h-6" />,
                items: [
                    { subtitle: "2FA (Two-Factor Auth)", text: "Enable 2FA in Settings > Security. Scan the QR code with Google Authenticator or Authy. You will need the code from your phone to login." },
                    { subtitle: "Recovery Words", text: "This is the ONLY way to recover your account if you forget your Master Password. Generate the 16-word key and write it down on paper. Do not store it digitally." },
                    { subtitle: "Panic Button", text: "In an emergency, press 'F12' or 'Ctrl + Shift + X' to instantly lock the app, clear the clipboard, and hide the window." },
                    { subtitle: "Duress Password (Fake Vault)", text: "If you are forced to unlock your vault, enter your Duress Password instead of your Master Password. It opens a secondary, empty (or fake) vault, keeping your real data hidden." },
                    { subtitle: "Record-Based TOTP", text: "Add 2FA keys directly to your Login records under 'Advanced Features'. WinVault will generate live verification codes with a 30-second countdown indicator." },
                    { subtitle: "Password History", text: "When you update a password, the previous ones are not lost. WinVault stores the last 5 passwords with timestamps in the 'Password History' section for easy recovery." },
                    { subtitle: "Windows Hello / Biometric Lock", text: "Allows you to unlock the vault using your face or fingerprint. Can be enabled in Settings > Security. Saves you from typing your long master password every time." }
                ]
            },
            {
                title: "Convenience Features",
                icon: <Zap className="w-6 h-6" />,
                items: [
                    { subtitle: "Auto-Type", text: "While on a website (e.g., Google Login), press 'Ctrl + Alt + A'. WinVault detects the window title, finds the matching credential, and automatically types your username and password." },
                    { subtitle: "Mini Mode", text: "Switch to Mini Mode using the icon in the top right. It stays always-on-top as a small bar, giving you quick access to passwords while working." },
                    { subtitle: "Smart Search (Command Palette)", text: "Press 'Ctrl + K' from anywhere in the app to open the smart search bar. You can quickly find credentials as well as app commands (Settings, Vault, etc.) and execute them instantly." },
                    { subtitle: "Password Generator", text: "Use the Generator in the sidebar to create strong passwords. 'Memorable' mode creates long phrases that are easy to remember but hard to crack." }
                ]
            },
            {
                title: "Data Management & Backup",
                icon: <Download className="w-6 h-6" />,
                items: [
                    { subtitle: "Auto Backup", text: "Select a folder in Settings > Data Management > Auto Backup. An encrypted copy (.winvault) of your database will be saved there every time you logout." },
                    { subtitle: "Exporting Data", text: "Use .winvault format to move data to another WinVault instance. Use CSV or JSON to migrate to other password managers. You can optionally encrypt these files as well." },
                    { subtitle: "Importing Data", text: "You can drag and drop old backups (.winvault) or CSV/JSON files from other managers to import them." }
                ]
            }
        ]
    }
};

export default UserGuide;

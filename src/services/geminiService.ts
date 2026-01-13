import { SecurityAnalysis, Language } from "../types";

// Yerel analiz fonksiyonu - Hiçbir veri dışarı gönderilmez
export const analyzePasswordStrength = async (password: string, lang: Language = 'tr'): Promise<SecurityAnalysis> => {
  // Analiz hissi vermek için kısa bir gecikme
  await new Promise(resolve => setTimeout(resolve, 600));

  let score = 0;
  const suggestions: string[] = [];
  let feedback = "";

  // Uzunluk kontrolü
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 20;
  if (password.length >= 16) score += 10;

  // Karakter tipi kontrolleri
  if (/[A-Z]/.test(password)) {
    score += 15;
  } else {
    suggestions.push(lang === 'tr' ? "En az bir büyük harf (A-Z) ekleyin." : "Add at least one uppercase letter (A-Z).");
  }

  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    suggestions.push(lang === 'tr' ? "En az bir küçük harf (a-z) ekleyin." : "Add at least one lowercase letter (a-z).");
  }

  if (/[0-9]/.test(password)) {
    score += 10;
  } else {
    suggestions.push(lang === 'tr' ? "En az bir rakam (0-9) ekleyin." : "Add at least one number (0-9).");
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 10;
  } else {
    suggestions.push(lang === 'tr' ? "Semboller (!@#$%) ekleyerek güvenliği artırın." : "Increase security by adding symbols (!@#$%).");
  }

  // Cezalandırma (Çok kısa veya yaygın desenler için basit kontrol)
  if (password.length < 8) {
    score = Math.min(score, 30); // Max 30 puan
    feedback = lang === 'tr' ? "Şifreniz çok kısa, kırılması çok kolay." : "Password is too short, very easy to crack.";
    suggestions.unshift(lang === 'tr' ? "Şifreniz en az 8 karakter uzunluğunda olmalıdır." : "Password should be at least 8 characters long.");
  } else if (!/[^A-Za-z0-9]/.test(password) && !/[0-9]/.test(password)) {
    // Sadece harf ise puanı düşür
    score = Math.min(score, 50);
    feedback = lang === 'tr' ? "Şifreniz sadece harflerden oluşuyor, tahmin edilebilir." : "Password consists only of letters, predictable.";
  }

  // Skor değerlendirmesi
  if (score < 40) {
    if (!feedback) feedback = lang === 'tr' ? "Zayıf şifre. Daha karmaşık hale getirin." : "Weak password. Make it more complex.";
  } else if (score < 70) {
    if (!feedback) feedback = lang === 'tr' ? "Orta seviye güvenlik. Biraz daha güçlendirilebilir." : "Medium security. Can be strengthened a bit.";
  } else if (score < 90) {
    feedback = lang === 'tr' ? "Güçlü şifre." : "Strong password.";
  } else {
    feedback = lang === 'tr' ? "Mükemmel! Çok güçlü bir şifre." : "Excellent! Very strong password.";
    if (suggestions.length === 0) {
      suggestions.push(lang === 'tr' ? "Şifreniz gayet güvenli görünüyor." : "Your password looks quite secure.");
    }
  }

  return {
    score: Math.min(100, score),
    feedback,
    suggestions: suggestions.slice(0, 3) // En fazla 3 öneri göster
  };
};
# Evlilik İlanları – AI Instagram Reels Otomasyon Platformu

Evlilik İlanları markası için her gün otomatik olarak en az 5 adet özgün, 8–15 saniye uzunluğunda dikey (9:16) Instagram Reels videosu üreten, planlayan, montajlayan ve Meta Instagram Graph API üzerinden yayınlayan uçtan uca yapay zekâ otomasyon platformu.

---

## 🌟 Temel Özellikler

1. **Günde 5 Özgün Reels İçeriği**:
   - Günde **2 adet gerçekçi AI video** (fal.ai Kling/Minimax entegrasyonu).
   - Günde **3 adet ekonomik hareketli görsel/metin montaj videosu** (FFmpeg + Canvas compositing).
   - Video başına ortalama maliyeti \$0.15 seviyesinde tutan optimize hibrit model.

2. **5 Temel İçerik Kategorisi**:
   - Romantik sinematik videolar (İstanbul Boğazı, gün batımı, derin aşk ve güven sözleri).
   - Gerçekçi telefon kamerası (POV/selfie tarzı samimi sohbetler).
   - İlişki ve evlilik tavsiyeleri (Minimalist tipografi, mutlu evliliğin sırları).
   - Evlilik İlanları uygulama reklamları (%100 onaylı profiller, gizlilik, güven).
   - Viral soru ve hikâye videoları (Yorumlarda etkileşim patlatacak tanışma soruları).

3. **FFmpeg Video Montaj Motoru**:
   - Zaman kodlu kalın Türkçe altyazılar (ASS formatında).
   - Marka logosu ve filigran bindirme.
   - 9:16 dikey (1080x1920), H.264 video, AAC ses, 30 FPS hedefi.
   - Telif-uyumlu arka plan müzikleri.
   - Google Cloud Run container (`Dockerfile.montage`) desteği.

4. **Resmi Meta Instagram Graph API Entegrasyonu**:
   - Profesyonel (Business/Creator) hesap doğrulama.
   - 2 aşamalı yayınlama: Video container oluşturma -> Meta sunucu işleme kontrolü -> Reels yayınlama.
   - **Idempotency Güvencesi**: Bir video asla iki defa yayınlanamaz.
   - 60 günlük Long-Lived Token takibi.

5. **Otomatik Yayınlama Takvimi**:
   - Varsayılan slotlar: **09:00, 12:00, 15:00, 18:00, 21:00** (`Europe/Istanbul`).
   - Admin panelinden tüm saatler ve slotlar dinamik olarak değiştirilebilir.

6. **Maliyet ve Bütçe Koruma (Circuit Breaker)**:
   - Günlük harcama tavanı (Örn: \$10/gün) ve aylık harcama tavanı (\$250/ay).
   - Video başına maksimum harcama sınırı (\$1.50/video).
   - Limit aşıldığında AI video üretimi otomatik durdurulur; sistem FFmpeg içerikleriyle kesintisiz çalışmaya devam eder.
   - Tüm harcamalar ve API token/saniye kullanımı denetim tablosuna kaydedilir.

7. **12 Bölümlü Koyu Temalı Admin Yönetim Paneli**:
   - Genel Bakış (Dashboard)
   - AI İçerik Üretimi
   - Video Kütüphanesi
   - Yayın Takvimi
   - Instagram Hesabı
   - İçerik Kategorileri
   - AI Model Ayarları
   - API ve Entegrasyonlar (Maskeli anahtar yönetimi)
   - Maliyet ve Kullanım
   - İstatistikler
   - Sistem Logları
   - Genel Ayarlar

---

## 🛠️ Teknoloji Yığını

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Lucide Icons
- **Backend**: Next.js Server Actions & API Routes + Cloud Run Worker
- **Veritabanı & Altyapı**: Firebase Firestore + Firebase Storage + Firebase Auth
- **AI Metin Motoru**: OpenAI API (GPT-4o / GPT-4o-mini)
- **AI Video Motoru**: fal.ai API (Kling Video v1.5, Minimax Video-01, Luma Dream Machine)
- **Montaj Motoru**: FFmpeg 6.x + Google Cloud Run
- **Sosyal Medya**: Resmi Meta Instagram Graph API v21.0

---

## 🚀 Hızlı Başlangıç

### 1. Kurulum
```bash
npm install
```

### 2. Ortam Değişkenleri
`.env.example` dosyasını `.env.local` olarak kopyalayın:
```bash
cp .env.example .env.local
```
API anahtarlarınızı panel üzerinden veya `.env.local` içine ekleyin. (Anahtarlar girilmeden önce sistem güvenli **Test/Simülasyon Modu**nda çalışır, sahte başarı üretmez).

### 3. Geliştirme Sunucusunu Başlatma
```bash
npm run dev
```
Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine gidin.

### 4. Fonksiyonel Entegrasyon Testlerini Çalıştırma
```bash
npx tsx scripts/test_platform.ts
```
Bu komut; içerik üretimini, bütçe devre kesicisini, video render simülasyonunu, FFmpeg komut grafiğini, Meta Reels yayınlama idempotency kontrolünü ve sistem loglarını doğrular.

### 5. Projeyi Derleme (Build)
```bash
npm run build
```

---

## 🐳 Google Cloud Run FFmpeg Montaj Servisi

Ağır video işleme ve altyazı giydirme işlemleri için Cloud Run container yapısı hazırdır:
```bash
# Docker imajını oluşturun
docker build -f Dockerfile.montage -t gcr.io/evlilik-ilanlari-ai/ffmpeg-worker:latest .

# Cloud Run'a dağıtın
gcloud run deploy ffmpeg-montage-worker \
  --image gcr.io/evlilik-ilanlari-ai/ffmpeg-worker:latest \
  --platform managed \
  --region europe-west1 \
  --memory 2Gi \
  --cpu 2
```

---

## 🧭 Pinterest Benzer Video Çekme (Chrome/Chromium Gereksinimi)

Pinterest, pin detay sayfasının altında gösterilen **benzer videolar** akışını (`v3RelatedPinsForPinSeoQuery`) yalnızca gerçek tarayıcı oturumlarında sunuyor. Sunucu tarafı `fetch` istekleri Pinterest tarafından HTML sayfasına veya `403`'e düşürülüyor.

Bu yüzden uygulama, `puppeteer-core` ile sunucuda kurulu Chrome/Chromium'u kullanarak pin sayfasını açar ve benzer videoları toplar (`src/lib/services/pinterestBrowserService.ts`).

```bash
# Debian / Ubuntu VPS
sudo apt-get update && sudo apt-get install -y chromium

# Chrome farklı bir yolda ise (.env.local)
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `PINTEREST_RELATED_MAX_VIDEOS` | `60` | Pin başına toplanacak en fazla benzer video |
| `PINTEREST_BROWSER_CONCURRENCY` | `2` | Aynı anda açılacak tarayıcı sayfası sayısı |
| `PUPPETEER_EXECUTABLE_PATH` | otomatik | Chrome/Chromium yürütülebilir dosya yolu |

Durum kontrolü: `GET /api/pinterest/scan` → `{ chromeAvailable, executablePath, defaultMaxVideos }`

> ⚠️ **Datacenter / VPS IP uyarısı:** Pinterest, hosting IP'lerine pin detay sayfasında "giriş duvarı" gösterip benzer video akışını boş döndürebiliyor (`edges: []`). Bu durumda iki seçenek var:
>
> 1. **Residential proxy:** `PINTEREST_PROXY_SERVER=http://host:port` (+ gerekirse `PINTEREST_PROXY_USERNAME` / `PINTEREST_PROXY_PASSWORD`). Proxy varsa bant genişliği için görsel/video istekleri varsayılan olarak engellenir (`PINTEREST_BLOCK_MEDIA=0` ile kapatılabilir).
> 2. **Oturum çerezleri:** Pinterest'e giriş yapılmış tarayıcıdan alınan çerezler `PINTEREST_COOKIES` (JSON dizi) olarak tanımlanır.

Bu durumda tarama çökmez: ana video kaydedilir, sistem loglarına `PINTEREST_RELATED_FETCH_FAILED` uyarısı (proxy/çerez önerisiyle) yazılır.

---

## 🔒 Güvenlik Notları
- API anahtarları asla istemciye açık (raw string) olarak sızdırılmaz.
- `firestore.rules` ile tüm koleksiyonlar yalnızca kimliği doğrulanmış yöneticilere açıktır.
- Yayınlama işlemleri tamamen sunucu tarafında (Server-side) gerçekleştirilir.

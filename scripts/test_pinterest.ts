import { scanPinterestUrl, generateSimilarPins, convertPinToReels } from '../src/lib/services/pinterestService';
import { repository } from '../src/lib/store/repository';
import { PinterestCategory, PinterestAgeFilter, PinterestItem } from '../src/types';

async function runPinterestTests() {
  console.log('====================================================');
  console.log('📌 PINTEREST VIDEO BULUCU & KOLEKSİYON ENTEGRASYON TESTİ');
  console.log('====================================================\n');

  // 1. URL Tarama Testi
  console.log('1. Pinterest URL Tarama (Scan) Testi...');
  const testUrl = 'https://tr.pinterest.com/pin/123456789012345678/';
  const scanResult = await scanPinterestUrl(testUrl, 'Sahil ve deniz', '25–30 yaş görünümü');
  console.log('✓ Tarama Başarılı:');
  console.log(`  - Başlık: ${scanResult.pin_title}`);
  console.log(`  - Kategori: ${scanResult.category}`);
  console.log(`  - Yaş Görünümü: ${scanResult.age_filter}`);
  console.log(`  - Benzer Pin Sayısı: ${scanResult.similar_pins?.length || 0}`);

  // 2. Benzer Pin Keşif Testi
  console.log('\n2. Benzer Pin Keşif Motoru Testi...');
  const similarPins = await generateSimilarPins('Sahil ve deniz', '25–30 yaş görünümü');
  console.log(`✓ ${similarPins.length} adet benzer pin bulundu:`);
  similarPins.forEach((p, idx) => {
    console.log(`   [${idx + 1}] ${p.title} (Yazar: ${p.author || 'Pinterest'})`);
  });

  // 3. Firestore'a Kaydetme Testi
  console.log('\n3. Firestore `pinterest_collection` Kayıt Testi...');
  const now = new Date().toISOString();
  const itemToSave: PinterestItem = {
    id: `pin-test-${Date.now()}`,
    pin_url: scanResult.pin_url,
    pin_title: scanResult.pin_title,
    pin_description: scanResult.pin_description,
    category: scanResult.category,
    age_filter: scanResult.age_filter,
    thumbnail_url: scanResult.thumbnail_url,
    video_url: scanResult.video_url,
    embed_html: scanResult.embed_html,
    added_at: now,
    notes: 'Test notu: Sahilde gün batımı videosu',
    favorite: true,
    usage_permission_status: 'İzin bekleniyor',
    original_creator: scanResult.original_creator,
    source_license: scanResult.source_license,
    approval_status: 'pending',
    archive_status: false,
    similar_pins: scanResult.similar_pins,
    created_at: now,
    updated_at: now,
  };

  const savedItem = await repository.savePinterestItem(itemToSave);
  console.log(`✓ Pinterest öğesi kaydedildi: ID=${savedItem.id}`);

  // Okuma doğrulaması
  const retrievedItem = await repository.getPinterestItemById(savedItem.id);
  if (!retrievedItem) {
    throw new Error('Kaydedilen Pinterest öğesi Firestore\'dan okunamadı!');
  }
  console.log(`✓ Firestore okuma doğrulandı: Başlık="${retrievedItem.pin_title}", Kategori="${retrievedItem.category}"`);

  // 4. Güncelleme Testi
  console.log('\n4. İzin Durumu & Not Güncelleme Testi...');
  savedItem.usage_permission_status = 'Ticari kullanım uygun';
  savedItem.notes = 'Kullanım izni doğrulandı, Reels montajına hazır.';
  const updatedItem = await repository.savePinterestItem(savedItem);
  console.log(`✓ Güncellendi: İzin="${updatedItem.usage_permission_status}", Not="${updatedItem.notes}"`);

  // 5. Reels Videosuna Dönüştürme & Kuyruğa Ekleme Testi
  console.log('\n5. Reels Videosuna Dönüştürme (Montaj & Kuyruk) Testi...');
  const convertResult = await convertPinToReels(updatedItem.id);
  console.log('✓ Video Montajı & Kuyruk Kaydı Başarılı:');
  console.log(`  - Üretilen Video ID: ${convertResult.video.id}`);
  console.log(`  - Başlık: ${convertResult.video.title}`);
  console.log(`  - Çözünürlük: ${convertResult.video.width}x${convertResult.video.height} (${convertResult.video.aspectRatio})`);
  console.log(`  - Süre: ${convertResult.video.durationSeconds} saniye`);
  console.log(`  - Video URL: ${convertResult.video.videoUrl}`);
  console.log(`  - Kuyruk Öğesi ID: ${convertResult.queueItem.id}`);
  console.log(`  - Planlanan Yayın Saati: ${convertResult.queueItem.scheduledTime}`);
  console.log(`  - Kuyruk Durumu: ${convertResult.queueItem.status}`);

  console.log('\n====================================================');
  console.log('🎉 TÜM PINTEREST MODÜL TESTLERİ BAŞARIYLA TAMAMLANDI!');
  console.log('====================================================');
}

runPinterestTests().catch((err) => {
  console.error('❌ Test sırasında hata:', err);
  process.exit(1);
});

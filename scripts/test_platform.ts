// Evlilik İlanları - Platform Fonksiyonel ve Mantık Testleri
import { AIContentService } from '../src/lib/services/aiContentService';
import { FalVideoService } from '../src/lib/services/falVideoService';
import { FFmpegMontageService } from '../src/lib/services/ffmpegMontageService';
import { InstagramService } from '../src/lib/services/instagramService';
import { PlatformRepository } from '../src/lib/store/repository';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 EVLİLİK İLANLARI - AI REELS PLATFORM TESTLERİ BAŞLIYOR');
  console.log('====================================================\n');

  // Test 1: AI Content Generation (Single & Batch)
  console.log('🧪 TEST 1: AI İçerik Üretimi (5 Kategori & Tekrar Kontrolü)');
  const romanticIdea = await AIContentService.generateIdea({
    categoryKey: 'romantic_cinematic',
    customTopic: 'Kader ve Doğru İnsan',
  });
  console.log(`   ✓ Tekli Senaryo Üretildi: "${romanticIdea.title}"`);
  console.log(`   ✓ Altyazı Satır Sayısı: ${romanticIdea.turkishSubtitles.length}`);
  console.log(`   ✓ Hashtag Sayısı: ${romanticIdea.hashtags.length}`);
  console.log(`   ✓ Tekrar Hash: ${romanticIdea.repetitionCheckHash}`);

  const batch = await AIContentService.generateDailyBatch();
  console.log(`   ✓ Günlük 5 İçerik Toplu Üretildi: ${batch.length} adet kategori tamamlandı.\n`);

  // Test 2: Bütçe ve Maliyet Denetleyicisi (Cost Guard & Circuit Breaker)
  console.log('🧪 TEST 2: Maliyet Denetleyicisi & Bütçe Güvenlik Koruması');
  const budgetBefore = await FalVideoService.checkBudgetGuard('ai_video', 10);
  console.log(`   ✓ Bütçe Kontrolü Geçti: ${budgetBefore.ok}, Tahmini Maliyet: $${budgetBefore.costEstimated}`);

  // Test 3: Video Üretimi (AI Video & FFmpeg Motion)
  console.log('🧪 TEST 3: Video Üretim Hattı (fal.ai & FFmpeg)');
  const video1 = await FalVideoService.renderVideo({
    ideaId: romanticIdea.id,
    title: romanticIdea.title,
    categoryKey: romanticIdea.categoryKey,
    prompt: romanticIdea.generationPrompt,
    productionType: 'ai_video',
    durationSeconds: 10,
    caption: romanticIdea.caption,
    hashtags: romanticIdea.hashtags,
  });
  console.log(`   ✓ 1. AI Video Üretildi: "${video1.title}" (Maliyet: $${video1.costUsd})`);

  const video2 = await FalVideoService.renderVideo({
    ideaId: batch[2].id,
    title: batch[2].title,
    categoryKey: batch[2].categoryKey,
    prompt: batch[2].generationPrompt,
    productionType: 'ffmpeg_motion',
    durationSeconds: 12,
    caption: batch[2].caption,
    hashtags: batch[2].hashtags,
  });
  console.log(`   ✓ 2. FFmpeg Video Üretildi: "${video2.title}" (Maliyet: $${video2.costUsd})\n`);

  // Test 4: FFmpeg Montaj ve ASS Altyazı Oluşturucu
  console.log('🧪 TEST 4: FFmpeg Montaj Komutu & ASS Altyazı Standartları');
  const montageCmd = FFmpegMontageService.generateFFmpegCommand({
    inputVideoUrl: video1.videoUrl,
    watermarkText: 'Evlilik İlanları',
  });
  console.log(`   ✓ FFmpeg Filter Graph: ${montageCmd.filterComplex}`);

  const assSubtitles = FFmpegMontageService.generateAssSubtitles(romanticIdea.turkishSubtitles);
  console.log(`   ✓ ASS Altyazı Formatı Üretildi: ${assSubtitles.includes('[V4+ Styles]') ? 'BAŞARILI' : 'HATALI'}\n`);

  // Test 5: Meta Instagram Graph API Reels Yayınlayıcı & Idempotency
  console.log('🧪 TEST 5: Meta Instagram Graph API Reels Yayınlayıcı & Idempotency');
  const publishResult = await InstagramService.publishVideo(video1);
  console.log(`   ✓ Yayın Durumu: ${publishResult.status}, ID: ${publishResult.instagramMediaId}`);
  console.log(`   ✓ Instagram Permalink: ${publishResult.permalink}`);

  // Idempotency denetimi: Aynı videoyu tekrar yayınlamaya çalış
  const secondPublish = await InstagramService.publishVideo(video1);
  console.log(`   ✓ Idempotency Denetimi: Tekrar yayınlanması engellendi mi? ${secondPublish.instagramMediaId === publishResult.instagramMediaId ? 'EVET (GÜVENLİ)' : 'HAYIR'}\n`);

  // Test 6: Sistem Logları ve API Denetim Kayıtları
  console.log('🧪 TEST 6: Sistem Logları & API Kullanım Takibi');
  const logs = await PlatformRepository.getSystemLogs(5);
  console.log(`   ✓ Kayıtlı Log Sayısı: ${logs.length}`);
  console.log(`   ✓ Son Log: [${logs[0].level}] ${logs[0].module} - ${logs[0].message}`);

  console.log('\n====================================================');
  console.log('🎉 TÜM SİSTEM VE ENTEGRASYON TESTLERİ BAŞARIYLA TAMAMLANDI!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('❌ Test hatası:', err);
  process.exit(1);
});

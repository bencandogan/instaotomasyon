import { PlatformRepository } from '@/lib/store/repository';
import { InstagramService } from '@/lib/services/instagramService';
import { PinterestService } from '@/lib/services/pinterestService';
import { PublishQueueItem, GeneratedVideo, StoryAutomationSettings } from '@/types';

export interface AutopilotTickResult {
  success: boolean;
  timestamp: string;
  autopilotEnabled: boolean;
  publishedReelsCount: number;
  publishedStoryCount: number;
  replenishedReelsCount: number;
  pendingQueueCount: number;
  publishedItems: { id: string; title: string; scheduledTime: string; permalink?: string }[];
  storyPublished: boolean;
  messages: string[];
  error?: string;
}

export class AutopilotService {
  private static isRunning = false;
  private static lastRunTime: string | null = null;
  private static serverLoopStarted = false;

  /**
   * Autopilot'ın mevcut durumunu ve yaklaşan yayınları getirir
   */
  static async getStatus() {
    const generalSettings = await PlatformRepository.getGeneralSettings();
    const queue = await PlatformRepository.getQueue();
    const storySettings = await PlatformRepository.getStorySettings();
    const savedUrls = await PlatformRepository.getSavedPinterestUrls();
    const pendingItems = queue.filter((q) => q.status === 'pending');
    const publishedItems = queue.filter((q) => q.status === 'published');

    // Sıradaki ilk Reels
    const nextReels = pendingItems.sort(
      (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    )[0] || null;

    return {
      autopilotEnabled: generalSettings.autopilotEnabled !== false,
      lastRunTime: this.lastRunTime || generalSettings.autopilotLastRun || null,
      isRunning: this.isRunning,
      pendingCount: pendingItems.length,
      publishedCount: publishedItems.length,
      nextReels,
      storySettings: {
        isEnabled: storySettings.isEnabled,
        dailyPublishTime: storySettings.dailyPublishTime,
        lastPublishedAt: storySettings.lastPublishedAt || null,
        nextScheduledAt: storySettings.nextScheduledAt || null,
        hasImage: Boolean(storySettings.storyImageUrl),
      },
      savedUrlsCount: savedUrls.length,
    };
  }

  /**
   * Autopilot modunu açar veya kapatır
   */
  static async toggleAutopilot(enabled: boolean) {
    const general = await PlatformRepository.getGeneralSettings();
    general.autopilotEnabled = enabled;
    general.autoPublishEnabled = enabled;
    general.updatedAt = new Date().toISOString();
    await PlatformRepository.saveGeneralSettings(general);

    await PlatformRepository.log(
      'INFO',
      'SCHEDULER',
      'AUTOPILOT_TOGGLED',
      `Autopilot modu ${enabled ? 'AÇILDI (Tam Otonom Mod)' : 'KAPATILDI'}.`
    );

    return { success: true, autopilotEnabled: enabled };
  }

  /**
   * Otonom döngünün 1 tick'i.
   * Bu fonksiyon periyodik olarak çalışır (her 60 saniyede bir veya manuel tetiklemede).
   */
  static async tick(): Promise<AutopilotTickResult> {
    const now = new Date();
    const nowIso = now.toISOString();

    if (this.isRunning) {
      return {
        success: true,
        timestamp: nowIso,
        autopilotEnabled: true,
        publishedReelsCount: 0,
        publishedStoryCount: 0,
        replenishedReelsCount: 0,
        pendingQueueCount: 0,
        publishedItems: [],
        storyPublished: false,
        messages: ['Autopilot döngüsü zaten şu an arka planda çalışıyor.'],
      };
    }

    this.isRunning = true;
    this.lastRunTime = nowIso;

    const messages: string[] = [];
    const publishedItems: { id: string; title: string; scheduledTime: string; permalink?: string }[] = [];
    let publishedStoryCount = 0;
    let replenishedReelsCount = 0;

    try {
      const generalSettings = await PlatformRepository.getGeneralSettings();
      generalSettings.autopilotLastRun = nowIso;
      await PlatformRepository.saveGeneralSettings(generalSettings);

      const isAutopilotActive = generalSettings.autopilotEnabled !== false;

      if (!isAutopilotActive) {
        messages.push('Autopilot kapalı durumda. İşlem yapılmadı.');
        this.isRunning = false;
        return {
          success: true,
          timestamp: nowIso,
          autopilotEnabled: false,
          publishedReelsCount: 0,
          publishedStoryCount: 0,
          replenishedReelsCount: 0,
          pendingQueueCount: 0,
          publishedItems: [],
          storyPublished: false,
          messages,
        };
      }

      // =========================================================================
      // ADIM 1: YAYIN SAATİ GELMİŞ REELS'LERİ OTOMATİK YAYINLAMA
      // =========================================================================
      const queue = await PlatformRepository.getQueue();
      const nowTimeMs = now.getTime();

      // Saati gelmiş veya geçmiş bekleyen ögeler
      const dueItems = queue.filter((item) => {
        if (item.status !== 'pending') return false;
        const itemTimeMs = new Date(item.scheduledTime).getTime();
        return itemTimeMs <= nowTimeMs;
      });

      if (dueItems.length > 0) {
        messages.push(`${dueItems.length} adet Reels'in yayın zamanı geldi. Yayına alınıyor...`);

        for (const item of dueItems) {
          try {
            const video = await PlatformRepository.getVideoById(item.videoId);
            if (!video) {
              item.status = 'failed';
              item.updatedAt = nowIso;
              await PlatformRepository.saveQueueItem(item);
              messages.push(`Video bulunamadı (${item.videoId}), kuyruk ögesi iptal edildi.`);
              continue;
            }

            // Sisteme bağlı ve otomatik yayını açık tüm Instagram hesaplarını al
            const allAccounts = await PlatformRepository.getInstagramAccounts();
            const targetAccounts = allAccounts.filter(
              (acc) => acc.isConnected && acc.autoPublishEnabled !== false
            );
            const publishList = targetAccounts.length > 0 ? targetAccounts : [await PlatformRepository.getActiveInstagramAccount()];

            let anySuccess = false;
            for (const acc of publishList) {
              try {
                const pubResult = await InstagramService.publishVideo(video);
                if (pubResult.success) {
                  anySuccess = true;
                  publishedItems.push({
                    id: `${item.id}-${acc.id}`,
                    title: `${item.videoTitle} (${acc.instagramUsername})`,
                    scheduledTime: item.scheduledTime,
                    permalink: pubResult.permalink,
                  });
                  messages.push(`Reels yayınlandı [${acc.instagramUsername} - ${acc.browserFingerprint || 'İzole'}]: "${item.videoTitle}"`);
                } else {
                  messages.push(`Reels yayınlama uyarısı [${acc.instagramUsername}]: ${pubResult.error}`);
                }
              } catch (accErr: unknown) {
                const accMsg = accErr instanceof Error ? accErr.message : String(accErr);
                messages.push(`Hesap yayınlama hatası [${acc.instagramUsername}]: ${accMsg}`);
              }
            }

            if (anySuccess) {
              item.status = 'published';
            } else {
              item.attempts = (item.attempts || 0) + 1;
              if (item.attempts >= (item.maxAttempts || 3)) {
                item.status = 'failed';
              }
            }
            item.updatedAt = nowIso;
            await PlatformRepository.saveQueueItem(item);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            item.attempts = (item.attempts || 0) + 1;
            item.updatedAt = nowIso;
            await PlatformRepository.saveQueueItem(item);
            messages.push(`Kuyruk ögesi işleme istisnası (${item.id}): ${msg}`);
          }
        }
      }

      // =========================================================================
      // ADIM 2: 24 SAATTE 1 STORY OTOMATİK YAYINLAMA
      // =========================================================================
      try {
        const storySettings = await PlatformRepository.getStorySettings();
        if (storySettings.isEnabled && storySettings.storyImageUrl) {
          let shouldPublishStory = false;

          if (!storySettings.lastPublishedAt) {
            // Hiç yayınlanmamışsa hemen yayınla
            shouldPublishStory = true;
          } else {
            const lastPubMs = new Date(storySettings.lastPublishedAt).getTime();
            const elapsedHours = (nowTimeMs - lastPubMs) / (1000 * 60 * 60);

            // 23 saatten fazla geçmişse ve belirlenen saat dilimine gelinmişse (veya 24 saati geçmişse)
            if (elapsedHours >= 24) {
              shouldPublishStory = true;
            } else if (elapsedHours >= 23) {
              // Hedef saat kontrolü (örn: 14:00)
              const [targetH, targetM] = (storySettings.dailyPublishTime || '14:00').split(':').map(Number);
              const istanbulHours = (now.getUTCHours() + 3) % 24;
              if (istanbulHours >= targetH) {
                shouldPublishStory = true;
              }
            }
          }

          if (shouldPublishStory) {
            messages.push('24 saatlik Story yayın zamanı geldi. Bağlı tüm hesaplara yayına alınıyor...');
            const allAccounts = await PlatformRepository.getInstagramAccounts();
            const targetStoryAccounts = allAccounts.filter(
              (acc) => acc.isConnected && acc.autoStoryEnabled !== false
            );
            const storyList = targetStoryAccounts.length > 0 ? targetStoryAccounts : [await PlatformRepository.getActiveInstagramAccount()];

            for (const sAcc of storyList) {
              try {
                const storyRes = await InstagramService.publishStory({
                  imageUrl: storySettings.storyImageUrl,
                  storyLink: storySettings.storyLink,
                  linkText: storySettings.linkText || 'Uygulamayı İndir 📲',
                  accountId: sAcc.id,
                });

                if (storyRes.success) {
                  publishedStoryCount++;
                  messages.push(`24 saatlik Story paylaşıldı [${sAcc.name} - ${sAcc.instagramUsername}]`);
                } else {
                  messages.push(`Story uyarısı [${sAcc.instagramUsername}]: ${storyRes.error}`);
                }
              } catch (sErr: unknown) {
                const sMsg = sErr instanceof Error ? sErr.message : String(sErr);
                messages.push(`Story gönderim hatası [${sAcc.instagramUsername}]: ${sMsg}`);
              }
            }

            storySettings.lastPublishedAt = nowIso;
            await PlatformRepository.saveStorySettings(storySettings);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        messages.push(`Story otomasyonu kontrol hatası: ${msg}`);
      }

      // =========================================================================
      // ADIM 3: KUYRUK AZALINCA PINTEREST HAVUZUNDAN OTOMATİK BESLEME (AUTO-REPLENISH)
      // =========================================================================
      const refreshedQueue = await PlatformRepository.getQueue();
      const remainingPending = refreshedQueue.filter((q) => q.status === 'pending');

      // Yalnızca günün 5 videosu tamamlandığında (kuyruk boşaldığında) ertesi gün için 5 video besle
      if (remainingPending.length === 0) {
        const savedUrls = await PlatformRepository.getSavedPinterestUrls();
        if (savedUrls.length > 0) {
          messages.push(`Kuyrukta ${remainingPending.length} video kaldı. Kayıtlı Pinterest havuzundan otomatik besleme başlatılıyor...`);

          try {
            // Kayıtlı linklerden dönüştürülmemiş hazır pinleri tara
            let unassignedPinIds: string[] = [];

            // Önce mevcut pinterest veritabanında henüz dönüştürülmemiş pin var mı bak
            const allItems = await PlatformRepository.getPinterestItems();
            const existingUnconverted = allItems.filter(
              (p) => !p.converted_video_id && p.video_url && p.video_url.trim() !== ''
            );

            if (existingUnconverted.length >= 5) {
              unassignedPinIds = existingUnconverted.slice(0, 5).map((p) => p.id);
            } else {
              // Yoksa kayıtlı linkleri hızlıca tara
              const randomUrl = savedUrls[Math.floor(Math.random() * savedUrls.length)];
              const scanRes = await PinterestService.scanPinterestUrl(randomUrl);
              
              if (scanRes.similar_pins && scanRes.similar_pins.length > 0) {
                // Taranan yeni pinleri al
                const newlySavedItems = await PlatformRepository.getPinterestItems();
                const fresh = newlySavedItems.filter((p) => !p.converted_video_id && p.video_url);
                unassignedPinIds = fresh.slice(0, 5).map((p) => p.id);
              }
            }

            if (unassignedPinIds.length > 0) {
              // Kuyruktaki en son videonun tarihini bul
              let baseDate = new Date();
              if (remainingPending.length > 0) {
                const latestScheduled = remainingPending.sort(
                  (a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime()
                )[0];
                baseDate = new Date(latestScheduled.scheduledTime);
                baseDate.setDate(baseDate.getDate() + 1); // En son videonun ertesi gününden başlat
              }

              const batch = await PinterestService.batchConvertWithSmartShuffle(unassignedPinIds, {
                shuffle: true,
                baseDate,
              });

              replenishedReelsCount = batch.processed;
              messages.push(
                `Kuyruğa otomatik olarak ${batch.processed} yeni video eklendi ve takvime (günde 5 video) dağıtıldı.`
              );

              await PlatformRepository.log(
                'INFO',
                'SCHEDULER',
                'AUTOPILOT_REPLENISHED',
                `Autopilot kuyruğa ${batch.processed} yeni video ekledi.`
              );
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            messages.push(`Otomatik kuyruk doldurma hatası: ${msg}`);
          }
        }
      }

      const finalQueue = await PlatformRepository.getQueue();
      const finalPending = finalQueue.filter((q) => q.status === 'pending').length;

      return {
        success: true,
        timestamp: nowIso,
        autopilotEnabled: true,
        publishedReelsCount: publishedItems.length,
        publishedStoryCount,
        replenishedReelsCount,
        pendingQueueCount: finalPending,
        publishedItems,
        storyPublished: publishedStoryCount > 0,
        messages,
      };
    } catch (globalErr: unknown) {
      const msg = globalErr instanceof Error ? globalErr.message : String(globalErr);
      return {
        success: false,
        timestamp: nowIso,
        autopilotEnabled: true,
        publishedReelsCount: 0,
        publishedStoryCount: 0,
        replenishedReelsCount: 0,
        pendingQueueCount: 0,
        publishedItems: [],
        storyPublished: false,
        messages,
        error: msg,
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Sunucu tarafında her 60 saniyede bir otomatik çalışan yerleşik zamanlayıcı döngüsü
   */
  static startServerLoop() {
    if (this.serverLoopStarted) return;
    this.serverLoopStarted = true;

    // İlk çalıştırma 5 saniye sonra, ardından her 60 saniyede bir
    setTimeout(() => {
      this.tick().catch((e) => console.warn('Autopilot ilk tick hatası:', e));
      setInterval(() => {
        this.tick().catch((e) => console.warn('Autopilot periyodik tick hatası:', e));
      }, 60 * 1000);
    }, 5000);

    console.log('🤖 Autopilot Sunucu Zamanlayıcı Döngüsü Başlatıldı (60s aralıklarla aktif).');
  }
}

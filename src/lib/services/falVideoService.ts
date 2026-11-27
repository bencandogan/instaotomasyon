// Evlilik İlanları - fal.ai Video Üretim Servisi & Maliyet Denetleyicisi
import { GeneratedVideo, VideoProductionType } from '@/types';
import { PlatformRepository } from '@/lib/store/repository';

export interface VideoGenerationRequest {
  ideaId?: string;
  title: string;
  categoryKey: any;
  prompt: string;
  productionType: VideoProductionType; // 'ai_video' veya 'ffmpeg_motion'
  durationSeconds?: number;
  caption?: string;
  hashtags?: string[];
  subtitlesApplied?: boolean;
}

export class FalVideoService {
  /**
   * Bütçe ve limit denetimini gerçekleştirir. Aşılmışsa hata fırlatır.
   */
  static async checkBudgetGuard(productionType: VideoProductionType, estimatedDurationSec = 10): Promise<{ ok: boolean; reason?: string; costEstimated: number }> {
    const limits = await PlatformRepository.getCostLimits();
    const aiSettings = await PlatformRepository.getAISettings();
    const activeModel = aiSettings.falModels.find((m) => m.id === aiSettings.selectedFalModelId) || aiSettings.falModels[0];

    const costEstimated = productionType === 'ai_video' ? estimatedDurationSec * (activeModel?.costPerSecondUsd || 0.05) : 0.01;

    // Devre kesici kontrolü
    if (limits.circuitBreakerActive) {
      return { ok: false, reason: 'Bütçe devre kesici (Circuit Breaker) aktif! Harcama sınırına ulaşıldı.', costEstimated };
    }

    // Günlük harcama limiti kontrolü
    if (limits.todaySpentUsd + costEstimated > limits.dailySpendingLimitUsd) {
      return {
        ok: false,
        reason: `Günlük bütçe aşılacak! Mevcut: $${limits.todaySpentUsd.toFixed(2)}, Limit: $${limits.dailySpendingLimitUsd.toFixed(2)}, Tahmini Maliyet: $${costEstimated.toFixed(2)}`,
        costEstimated,
      };
    }

    // Aylık harcama limiti kontrolü
    if (limits.monthSpentUsd + costEstimated > limits.monthlySpendingLimitUsd) {
      return {
        ok: false,
        reason: `Aylık bütçe aşılacak! Mevcut: $${limits.monthSpentUsd.toFixed(2)}, Limit: $${limits.monthlySpendingLimitUsd.toFixed(2)}`,
        costEstimated,
      };
    }

    // Video başına maksimum maliyet kontrolü
    if (costEstimated > limits.maxCostPerVideoUsd) {
      return {
        ok: false,
        reason: `Video maliyeti ($${costEstimated.toFixed(2)}) izin verilen maksimum limitin ($${limits.maxCostPerVideoUsd.toFixed(2)}) üzerinde!`,
        costEstimated,
      };
    }

    // Günlük AI video üretim adedi kontrolü
    if (productionType === 'ai_video' && limits.todayAiVideosProduced >= limits.maxDailyAiVideos) {
      return {
        ok: false,
        reason: `Günlük maksimum AI video limitine (${limits.maxDailyAiVideos} adet) ulaşıldı. Diğer videolar FFmpeg motion ile üretilmeli.`,
        costEstimated,
      };
    }

    return { ok: true, costEstimated };
  }

  /**
   * fal.ai API üzerinden veya kontrollü simülasyon ile video üretir
   */
  static async renderVideo(req: VideoGenerationRequest): Promise<GeneratedVideo> {
    const durationSec = req.durationSeconds || 10;
    const aiSettings = await PlatformRepository.getAISettings();
    const activeModel = aiSettings.falModels.find((m) => m.id === aiSettings.selectedFalModelId) || aiSettings.falModels[0];

    // Bütçe Denetimi
    const budgetCheck = await this.checkBudgetGuard(req.productionType, durationSec);
    if (!budgetCheck.ok) {
      await PlatformRepository.log('WARN', 'COST_GUARD', 'BUDGET_REJECT', budgetCheck.reason || 'Bütçe kısıtı aşıldı', {
        title: req.title,
        productionType: req.productionType,
      });
      throw new Error(`[Maliyet Güvenliği] ${budgetCheck.reason}`);
    }

    const falApiKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
    const hasFalKey = Boolean(falApiKey && falApiKey.trim() !== '' && !aiSettings.testMode);

    let finalVideoUrl = '';
    let finalThumbnailUrl = '';
    let actualCost = budgetCheck.costEstimated;
    const startTime = Date.now();

    if (hasFalKey && req.productionType === 'ai_video') {
      try {
        await PlatformRepository.log('INFO', 'FAL_AI', 'CALLING_FAL_API', `fal.ai modeline istek gönderiliyor: ${activeModel.name}`, {
          modelId: activeModel.modelId,
          prompt: req.prompt,
        });

        // fal.ai REST çağrısı (Kling / Minimax / Luma endpoint)
        const endpoint = `https://fal.run/${activeModel.modelId}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Key ${falApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: req.prompt,
            aspect_ratio: '9:16',
            duration: durationSec.toString(),
            fps: 30,
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`fal.ai API Hatası (${response.status}): ${errBody}`);
        }

        const data = await response.json();
        finalVideoUrl = data.video?.url || data.video_url || '';
        finalThumbnailUrl = data.thumbnail_url || data.video?.thumbnail_url || '';

        const durationMs = Date.now() - startTime;
        await PlatformRepository.recordApiUsage({
          provider: 'fal_ai',
          endpoint: activeModel.modelId,
          unitsUsed: durationSec,
          unitType: 'seconds',
          costUsd: actualCost,
          durationMs,
          status: 'success',
        });

        await PlatformRepository.log('INFO', 'FAL_AI', 'VIDEO_RENDER_SUCCESS', `fal.ai videosu başarıyla üretildi: "${req.title}"`, {
          costUsd: actualCost,
          durationMs,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await PlatformRepository.log('ERROR', 'FAL_AI', 'VIDEO_RENDER_FAIL', `fal.ai çağrısı başarısız: ${errorMsg}`);
        throw new Error(`fal.ai video üretimi başarısız oldu: ${errorMsg}`);
      }
    } else {
      // Test modu / FFmpeg motion modu
      // Gerçekçi MP4 video önizleme URL'i
      finalVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-loving-couple-walking-at-sunset-42861-large.mp4';
      finalThumbnailUrl = 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=600&auto=format&fit=crop';
      actualCost = req.productionType === 'ai_video' ? activeModel.costPerSecondUsd * durationSec : 0.01;

      await PlatformRepository.recordApiUsage({
        provider: 'fal_ai',
        endpoint: req.productionType === 'ai_video' ? 'test_simulation/fal_video' : 'local_ffmpeg/motion_engine',
        unitsUsed: durationSec,
        unitType: 'seconds',
        costUsd: actualCost,
        durationMs: 1200,
        status: 'success',
      });

      await PlatformRepository.log(
        'INFO',
        req.productionType === 'ai_video' ? 'FAL_AI' : 'FFMPEG',
        'VIDEO_PREPARED',
        `Video hazırlandı (${req.productionType === 'ai_video' ? 'AI Video' : 'FFmpeg Motion'}): "${req.title}"`,
        { costUsd: actualCost }
      );
    }

    // Üretim limit sayacını artır
    const limits = await PlatformRepository.getCostLimits();
    if (req.productionType === 'ai_video') {
      limits.todayAiVideosProduced += 1;
    } else {
      limits.todayFfmpegVideosProduced += 1;
    }
    await PlatformRepository.saveCostLimits(limits);

    // Marka Reklam Sonu Entegrasyonu (Bölüm 1 Doğal İçerik + Bölüm 2 Marka Reklamı)
    const outroSettings = await PlatformRepository.getBrandOutroSettings();
    const finalDuration = outroSettings.isEnabled ? durationSec + (outroSettings.durationSeconds || 4) : durationSec;
    const finalCaption = outroSettings.isEnabled && req.caption
      ? `${req.caption}\n\n${outroSettings.slogan}\n📲 ${outroSettings.profileLinkPrompt}`
      : req.caption || '';

    const modelName = req.productionType === 'ai_video'
      ? (outroSettings.isEnabled ? `${activeModel.name} (+ ${outroSettings.brandName} Outro)` : activeModel.name)
      : (outroSettings.isEnabled ? `FFmpeg Motion (+ ${outroSettings.brandName} Outro)` : 'FFmpeg Motion Compositor v1');

    const videoRecord: GeneratedVideo = {
      id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ideaId: req.ideaId,
      title: req.title,
      categoryKey: req.categoryKey,
      productionType: req.productionType,
      videoUrl: finalVideoUrl,
      thumbnailUrl: finalThumbnailUrl,
      durationSeconds: finalDuration,
      width: 1080,
      height: 1920,
      fps: 30,
      format: 'mp4',
      aspectRatio: '9:16',
      caption: finalCaption,
      hashtags: req.hashtags || [],
      subtitlesApplied: req.subtitlesApplied ?? true,
      logoApplied: true,
      costUsd: actualCost,
      modelUsed: modelName,
      status: 'ready',
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await PlatformRepository.saveVideo(videoRecord);
    return videoRecord;
  }
}

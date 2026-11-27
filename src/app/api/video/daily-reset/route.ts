import { NextResponse } from 'next/server';
import { PlatformRepository } from '@/lib/store/repository';
import { PinterestService } from '@/lib/services/pinterestService';

export async function POST() {
  try {
    // 1. Mevcut tüm eski videoları ve kuyruğu temizle
    const currentVideos = await PlatformRepository.getVideos(1000);
    for (const v of currentVideos) {
      await PlatformRepository.deleteVideo(v.id);
    }

    const currentQueue = await PlatformRepository.getQueue();
    for (const q of currentQueue) {
      await PlatformRepository.deleteQueueItem(q.id);
    }

    // 2. Pinterest koleksiyonundan 5 adet birbirinden farklı, oynatılabilir dikey video seç
    const allItems = await PlatformRepository.getPinterestItems({ limit: 1000 });
    const playableItems = allItems.filter(
      (it) => it.video_url && (it.video_url.includes('pinimg.com') || it.video_url.includes('http'))
    );

    // Birbirinden farklı 5 video seç
    const selectedFive = playableItems.slice(0, 5);
    const dailySlots = [
      { time: '09:00:00+03:00', label: 'Sabah İlhamı' },
      { time: '12:00:00+03:00', label: 'Öğle Tavsiyesi' },
      { time: '15:00:00+03:00', label: 'Günün Sorusu' },
      { time: '18:00:00+03:00', label: 'Akşam Hikâyesi' },
      { time: '21:00:00+03:00', label: 'Gece Keşfi' },
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    const generatedVideos = [];
    const queueItems = [];

    for (let i = 0; i < selectedFive.length; i++) {
      const pin = selectedFive[i];
      const slot = dailySlots[i];
      const scheduledTime = `${todayStr}T${slot.time}`;

      // Reels'e dönüştür (OpenAI ile özgün başlık & açıklama)
      const res = await PinterestService.convertPinToReels(pin, { scheduledTime });
      res.queueItem.slotLabel = slot.label;
      await PlatformRepository.saveQueueItem(res.queueItem);

      generatedVideos.push(res.video);
      queueItems.push(res.queueItem);
    }

    await PlatformRepository.log(
      'INFO',
      'FFMPEG',
      'DAILY_FIVE_REELS_GENERATED',
      `Günün 5 özgün Reels videosu başarıyla üretildi, telifsiz fon müziği ve marka reklam sonuyla takvime yerleştirildi.`
    );

    return NextResponse.json({
      success: true,
      message: 'Günün 5 özgün Reels videosu üretildi ve takvime (09:00 - 21:00) yerleştirildi.',
      count: generatedVideos.length,
      videos: generatedVideos,
      queue: queueItems,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { PinterestService } from '@/lib/services/pinterestService';
import { PlatformRepository } from '@/lib/store/repository';

export const maxDuration = 60; // Vercel Serverless Function timeout (60 saniye)

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pinId, pinIds, shuffle = true, startFromTomorrow = false } = body;

    // Toplu dönüştürme ve akıllı takvim dağıtımı
    if (pinIds && Array.isArray(pinIds) && pinIds.length > 0) {
      const batchResult = await PinterestService.batchConvertWithSmartShuffle(pinIds, {
        shuffle,
        startFromTomorrow,
      });

      return NextResponse.json({
        success: true,
        batch: true,
        processed: batchResult.processed,
        videos: batchResult.videos,
        queueItems: batchResult.queueItems,
        message: `${batchResult.processed} adet video karışık sırada 9:16 Reels olarak montajlandı ve yayın takvimine dengeli dağıtıldı.`,
      });
    }

    if (!pinId) {
      return NextResponse.json({ error: 'pinId veya pinIds parametresi zorunludur.' }, { status: 400 });
    }

    const item = await PlatformRepository.getPinterestItemById(pinId);
    if (!item) {
      return NextResponse.json({ error: 'Pin bulunamadı.' }, { status: 404 });
    }

    const { video, queueItem } = await PinterestService.convertPinToReels(item);

    return NextResponse.json({
      success: true,
      video,
      queueItem,
      message: 'Pinterest videosu başarıyla 9:16 Reels olarak montajlandı ve yayın kuyruğuna eklendi.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { PinterestService } from '@/lib/services/pinterestService';
import { PinterestBrowserService } from '@/lib/services/pinterestBrowserService';
import { PlatformRepository } from '@/lib/store/repository';

export const maxDuration = 300; // Benzer video taraması Chrome üzerinden yapıldığı için yüksek tutuldu

/** Sağlık kontrolü: sunucuda Chrome/Chromium var mı? */
export async function GET() {
  return NextResponse.json({
    success: true,
    chromeAvailable: PinterestBrowserService.isAvailable(),
    executablePath: PinterestBrowserService.resolveExecutablePath(),
    defaultMaxVideos: Number(process.env.PINTEREST_RELATED_MAX_VIDEOS || 60),
    concurrency: Number(process.env.PINTEREST_BROWSER_CONCURRENCY || 2),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, urls, category, ageFilter, shuffle = true } = body;

    if (urls && Array.isArray(urls) && urls.length > 0) {
      const results = await PinterestService.scanBulkUrls(urls, category, ageFilter, shuffle);
      const similarPinsCount = results.reduce((sum, r) => sum + (r.similar_pins?.length || 0), 0);
      return NextResponse.json({
        success: true,
        results,
        similarPinsCount,
        chromeAvailable: PinterestBrowserService.isAvailable(),
      });
    }

    if (!url) {
      return NextResponse.json({ error: 'Lütfen taranacak en az bir Pinterest URL adresi girin.' }, { status: 400 });
    }

    const result = await PinterestService.scanPinterestUrl(url, category, ageFilter);
    return NextResponse.json({
      success: true,
      result,
      similarPinsCount: result.similar_pins?.length || 0,
      chromeAvailable: PinterestBrowserService.isAvailable(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    try {
      await PlatformRepository.log('WARN', 'AI_CONTENT', 'PINTEREST_SCAN_FAILED', `Pinterest tarama hatası: ${msg}`);
    } catch {
      // Log yazımı başarısız olsa da yanıt dönmeli
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { PlatformRepository } from '@/lib/store/repository';

export async function GET() {
  try {
    const urls = await PlatformRepository.getSavedPinterestUrls();
    return NextResponse.json({ success: true, urls });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { urls, url, action = 'set' } = body;

    let current = await PlatformRepository.getSavedPinterestUrls();

    if (action === 'add' && url) {
      if (!current.includes(url.trim())) {
        current.push(url.trim());
      }
    } else if (action === 'remove' && url) {
      current = current.filter((u) => u !== url.trim());
    } else if (Array.isArray(urls)) {
      current = urls;
    }

    const updated = await PlatformRepository.saveSavedPinterestUrls(current);
    await PlatformRepository.log('INFO', 'SYSTEM', 'PINTEREST_URLS_SAVED', `${updated.length} adet Pinterest kaynak bağlantısı kalıcı olarak kaydedildi.`);
    return NextResponse.json({ success: true, urls: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

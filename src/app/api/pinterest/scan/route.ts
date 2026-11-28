import { NextResponse } from 'next/server';
import { PinterestService } from '@/lib/services/pinterestService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, urls, category, ageFilter, shuffle = true } = body;

    if (urls && Array.isArray(urls) && urls.length > 0) {
      const results = await PinterestService.scanBulkUrls(urls, category, ageFilter, shuffle);
      return NextResponse.json({ success: true, results });
    }

    if (!url) {
      return NextResponse.json({ error: 'Lütfen taranacak en az bir Pinterest URL adresi girin.' }, { status: 400 });
    }

    const result = await PinterestService.scanPinterestUrl(url, category, ageFilter);
    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

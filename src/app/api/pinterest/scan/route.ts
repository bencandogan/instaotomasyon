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
    
    // Test fetch diagnostics
    const diagRes = await fetch(url.trim(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    }).catch(e => ({ status: 999, statusText: e.message, ok: false, text: async () => '' }));

    const html = diagRes.ok ? await (diagRes as any).text() : '';

    return NextResponse.json({
      success: true,
      result,
      diag: {
        status: (diagRes as any).status,
        statusText: (diagRes as any).statusText,
        htmlLen: html.length,
        hasVideoSnippet: html.includes('video-snippet'),
        hasInitialData: html.includes('__PWS_DATA__') || html.includes('initialData'),
        title: html.match(/<title>([^<]+)<\/title>/)?.[1] || '',
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

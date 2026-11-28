import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const pinId = '1083256516653451643';
  const dataObj = {
    options: { pin: pinId, bookmarks: [] },
    context: { app_version: '4e9f794' },
  };
  const dataStr = encodeURIComponent(JSON.stringify(dataObj));
  const relUrl = `https://www.pinterest.com/resource/RelatedPinFeedResource/get/?source_url=%2Fpin%2F${pinId}%2F&data=${dataStr}`;

  try {
    const relRes = await fetch(relUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*, q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Pinterest-AppState': 'active',
        'X-Pinterest-PWS-Handler': 'www/[username]/[slug].js',
        'Referer': `https://www.pinterest.com/pin/${pinId}/`,
      },
    });

    const status = relRes.status;
    const text = await relRes.text();
    return NextResponse.json({
      status,
      bodyLength: text.length,
      bodyPreview: text.slice(0, 500),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}

import { NextResponse } from 'next/server';

export async function GET() {
  const pinId = '1083256516653451643';
  const dataObj = {
    options: {
      pin: pinId,
      bookmarks: [],
    },
    context: {
      app_version: '78f39b6',
    },
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
        'X-Pinterest-PWS-Handler': 'www/pin/[id].js',
        'Referer': `https://www.pinterest.com/pin/${pinId}/`,
      },
    });

    const status = relRes.status;
    const text = await relRes.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {}

    return NextResponse.json({
      status,
      textLength: text.length,
      textPreview: text.slice(0, 300),
      dataCount: json?.resource_response?.data?.length,
      code: json?.resource_response?.code,
      message: json?.resource_response?.message,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}

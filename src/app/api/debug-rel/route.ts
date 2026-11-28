import { NextResponse } from 'next/server';

export async function GET() {
  const pinId = '1083256516653451643';

  // 1. Önce pin sayfasını çağır ve Pinterest'in verdiği taze çerezleri (cookies) ve appVersion'ı al
  const pageRes = await fetch(`https://tr.pinterest.com/pin/${pinId}/`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    }
  });

  const rawCookies = pageRes.headers.getSetCookie ? pageRes.headers.getSetCookie() : [];
  const cookieHeader = rawCookies.map(c => c.split(';')[0]).join('; ');
  const pageHtml = await pageRes.text();
  const avMatch = pageHtml.match(/"appVersion":"([^"]+)"/);
  const appVersion = avMatch ? avMatch[1] : '78f39b6';

  // 2. Şimdi bu çerezlerle RelatedPinFeedResource çağır
  const dataObj = {
    options: {
      pin: pinId,
      bookmarks: [],
    },
    context: {
      app_version: appVersion,
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
        'Cookie': cookieHeader,
      },
    });

    const status = relRes.status;
    const text = await relRes.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {}

    // 3. Bir de GraphQL v3RelatedPinsForPinSeoQuery'yi dene
    let gqlResult: any = null;
    try {
      const gqlRes = await fetch('https://tr.pinterest.com/_/graphql/', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Content-Type': 'application/json',
          'X-Pinterest-AppState': 'active',
          'X-Pinterest-PWS-Handler': 'www/pin/[id].js',
          'Cookie': cookieHeader,
        },
        body: JSON.stringify({
          queryID: 'b39ed2f55c3ee5de2035ca16b0c943f09ad5737d6ea4cc6d20f6131a2f9589e8',
          variables: { pinId, isDesktop: true, isAuth: false },
        }),
      });
      const gqlJson = await gqlRes.json();
      gqlResult = {
        status: gqlRes.status,
        dataKeys: Object.keys(gqlJson.data || {}),
        snippet: JSON.stringify(gqlJson).slice(0, 200),
      };
    } catch (ge: any) {
      gqlResult = { error: ge.message };
    }

    return NextResponse.json({
      status,
      cookiesCount: rawCookies.length,
      cookieSample: cookieHeader.slice(0, 80),
      appVersion,
      dataCount: json?.resource_response?.data?.length,
      sampleSnippet: text.slice(0, 200),
      gqlResult,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}

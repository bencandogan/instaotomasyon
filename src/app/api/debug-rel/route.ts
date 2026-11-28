import { NextResponse } from 'next/server';

export async function GET() {
  const pinId = '1083256516653451643';

  // 1. Önce pin sayfasını çağır ve taze çerezleri (cookies) al
  const pageRes = await fetch(`https://tr.pinterest.com/pin/${pinId}/`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    }
  });

  const rawCookies = pageRes.headers.getSetCookie ? pageRes.headers.getSetCookie() : [];
  const cookieHeader = rawCookies.map(c => c.split(';')[0]).join('; ');
  let csrf = '';
  for (const c of rawCookies) {
    if (c.startsWith('csrftoken=')) {
      csrf = c.split(';')[0].replace('csrftoken=', '');
      break;
    }
  }

  // 2. Exact GraphQL call with queryHash: "22d4b5f01f07c1be71875fc3555a98a630cb701ea7090b818d4dc456325515e6"
  const body = JSON.stringify({
    queryHash: "22d4b5f01f07c1be71875fc3555a98a630cb701ea7090b818d4dc456325515e6",
    variables: {
      count: 100,
      pinId: pinId
    }
  });

  const gqlRes = await fetch('https://tr.pinterest.com/_/graphql/', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'https://tr.pinterest.com',
      'Referer': `https://tr.pinterest.com/pin/${pinId}/`,
      'X-Pinterest-AppState': 'active',
      'X-Pinterest-GraphQL-Name': 'GatedCloseupRelatedPinsFeedQuery',
      'X-Pinterest-PWS-Handler': 'www/pin/[id].js',
      'X-Pinterest-Source-Url': `/pin/${pinId}/`,
      'X-CSRFToken': csrf,
      'Cookie': cookieHeader,
    },
    body: body,
  });

  const json = await gqlRes.json();
  const edges = json.data?.v3RelatedPinsForPinSeoQuery?.data?.connection?.edges || [];
  const videoList: any[] = [];

  for (const edge of edges) {
    const node = edge.node;
    let vidUrl = '';
    const vList = node?.videos?.videoList;
    if (vList) {
      vidUrl = vList.vEXP7?.url || vList.v720P?.url || vList.vHLSV4?.url || vList.vHLSV3MOBILE?.url;
    }
    const thumb = node.images_736x?.url || node.images_orig?.url;
    if (vidUrl) {
      videoList.push({
        id: node.entityId,
        thumb: thumb,
        video: vidUrl.slice(0, 60),
        duration: node.videos?.duration,
      });
    }
  }

  return NextResponse.json({
    status: gqlRes.status,
    totalRecommendations: edges.length,
    videoRecommendationsCount: videoList.length,
    sampleVideos: videoList.slice(0, 5),
  });
}

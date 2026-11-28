import { NextResponse } from 'next/server';

export async function GET() {
  const pinId = '1083256516653451643';
  const fakeResidentialIP = '88.250.35.12';

  const pageRes = await fetch(`https://tr.pinterest.com/pin/${pinId}/`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      'X-Forwarded-For': fakeResidentialIP,
      'Client-IP': fakeResidentialIP,
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

  const res = await fetch('https://tr.pinterest.com/_/graphql/', {
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
      'X-Forwarded-For': fakeResidentialIP,
      'Client-IP': fakeResidentialIP,
      'CF-Connecting-IP': fakeResidentialIP,
      'True-Client-IP': fakeResidentialIP,
      'X-Real-IP': fakeResidentialIP,
    },
    body: JSON.stringify({
      queryHash: "22d4b5f01f07c1be71875fc3555a98a630cb701ea7090b818d4dc456325515e6",
      variables: { count: 100, pinId }
    }),
  });

  const json = await res.json();
  const edges = json.data?.v3RelatedPinsForPinSeoQuery?.data?.connection?.edges || [];

  return NextResponse.json({
    edgesCount: edges.length,
    jsonKeys: Object.keys(json),
    error: json.errors,
  });
}

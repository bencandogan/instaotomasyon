import { NextResponse } from 'next/server';

export async function GET() {
  const pinId = '1083256516653451643';

  // Test 1: RelatedPinFeedResource with www.pinterest.com
  const dataObj = {
    options: {
      pin: pinId,
      bookmarks: [],
    },
    context: {}
  };
  const dataStr = encodeURIComponent(JSON.stringify(dataObj));
  const relUrl = `https://www.pinterest.com/resource/RelatedPinFeedResource/get/?source_url=%2Fpin%2F${pinId}%2F&data=${dataStr}`;
  const res1 = await fetch(relUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/javascript, */*, q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Pinterest-AppState': 'active',
      'X-Pinterest-PWS-Handler': 'www/pin/[id].js',
      'Referer': `https://www.pinterest.com/pin/${pinId}/`,
    }
  });
  let json1: any = null;
  try { json1 = await res1.json(); } catch(e) {}

  // Test 2: GraphQL with www.pinterest.com (instead of tr.pinterest.com)
  const pageRes = await fetch(`https://www.pinterest.com/pin/${pinId}/`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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

  const res2 = await fetch('https://www.pinterest.com/_/graphql/', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'https://www.pinterest.com',
      'Referer': `https://www.pinterest.com/pin/${pinId}/`,
      'X-Pinterest-AppState': 'active',
      'X-Pinterest-GraphQL-Name': 'GatedCloseupRelatedPinsFeedQuery',
      'X-Pinterest-PWS-Handler': 'www/pin/[id].js',
      'X-Pinterest-Source-Url': `/pin/${pinId}/`,
      'X-CSRFToken': csrf,
      'Cookie': cookieHeader,
    },
    body: JSON.stringify({
      queryHash: "22d4b5f01f07c1be71875fc3555a98a630cb701ea7090b818d4dc456325515e6",
      variables: { count: 100, pinId }
    }),
  });
  let json2: any = null;
  try { json2 = await res2.json(); } catch(e) {}

  return NextResponse.json({
    test1_RelatedPinFeed_count: json1?.resource_response?.data?.length || 0,
    test1_error: json1?.resource_response?.error,
    test2_GQL_count: json2?.data?.v3RelatedPinsForPinSeoQuery?.data?.connection?.edges?.length || 0,
    test2_error: json2?.errors,
  });
}

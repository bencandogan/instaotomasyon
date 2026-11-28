import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const query = 'tesettür düğün sahil';
  const results: any = {};

  // 1. SearchResource
  try {
    const sObj = {
      options: { query, scope: 'pins' },
      context: { app_version: '4e9f794' }
    };
    const sUrl = `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}&data=${encodeURIComponent(JSON.stringify(sObj))}`;
    const res = await fetch(sUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Pinterest-AppState': 'active',
        'X-Pinterest-PWS-Handler': 'www/[username]/[slug].js',
      }
    });
    const json = await res.json();
    const data = json.resource_response?.data?.results || [];
    results.BaseSearchResource = {
      status: res.status,
      count: data.length,
      sample: data.slice(0, 2).map((d: any) => ({ id: d.id, is_video: d.is_video, has_videos: !!d.videos }))
    };
  } catch (e: any) {
    results.BaseSearchResource = { error: e.message };
  }

  // 2. HTML search page
  try {
    const hRes = await fetch(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      }
    });
    const html = await hRes.text();
    const pinMatches = html.match(/\/pin\/(\d{15,22})/g) || [];
    results.SearchHtml = {
      status: hRes.status,
      htmlLength: html.length,
      pinMatchesCount: pinMatches.length,
      samplePins: [...new Set(pinMatches)].slice(0, 5),
    };
  } catch (e: any) {
    results.SearchHtml = { error: e.message };
  }

  // 3. User HTML page (Explore / Topic)
  try {
    const eRes = await fetch(`https://tr.pinterest.com/today/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
    const html = await eRes.text();
    const pinMatches = html.match(/\/pin\/(\d{15,22})/g) || [];
    results.TodayHtml = {
      status: eRes.status,
      pinMatchesCount: pinMatches.length,
      samplePins: [...new Set(pinMatches)].slice(0, 5),
    };
  } catch (e: any) {
    results.TodayHtml = { error: e.message };
  }

  return NextResponse.json(results);
}

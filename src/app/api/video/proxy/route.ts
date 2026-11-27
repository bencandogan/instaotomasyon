import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url');
  if (!urlParam) {
    return new NextResponse('URL parametresi eksik', { status: 400 });
  }

  try {
    const rangeHeader = req.headers.get('range');
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.pinterest.com/',
    };
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    const res = await fetch(urlParam, { headers });
    if (!res.ok) {
      return new NextResponse(`Video alınamadı: ${res.statusText}`, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || (urlParam.includes('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp4');
    const contentLength = res.headers.get('content-length');
    const contentRange = res.headers.get('content-range');

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Accept-Ranges', 'bytes');
    if (contentLength) responseHeaders.set('Content-Length', contentLength);
    if (contentRange) responseHeaders.set('Content-Range', contentRange);

    return new NextResponse(res.body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new NextResponse(`Proxy hatası: ${msg}`, { status: 500 });
  }
}

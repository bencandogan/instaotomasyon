import { NextResponse } from 'next/server';

export async function GET() {
  const pinId = '1083256516653451643';
  const pageRes = await fetch(`https://tr.pinterest.com/pin/${pinId}/`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    }
  });
  const html = await pageRes.text();
  const mp4s = html.match(/https:\/\/(?:v1|v)\.pinimg\.com\/videos\/[^"'\s\\]+\.mp4/gi) || [];
  const m3u8s = html.match(/https:\/\/(?:v1|v)\.pinimg\.com\/videos\/[^"'\s\\]+\.m3u8/gi) || [];
  const pins = html.match(/\/pin\/(\d+)\//g) || [];

  return NextResponse.json({
    htmlLength: html.length,
    mp4Count: mp4s.length,
    m3u8Count: m3u8s.length,
    distinctPins: Array.from(new Set(pins)).slice(0, 30),
  });
}

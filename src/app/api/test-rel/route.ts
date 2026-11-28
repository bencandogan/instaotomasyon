import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const query = 'romantik çift reels video';
  const sObj = {
    options: {
      query,
      scope: 'pins',
      page_size: 25,
      filters: 'videos',
    },
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
  
  const videoPins = [];
  for (const it of data) {
    let recVideo = '';
    let vList = it.videos?.video_list;
    if (!vList && it.story_pin_data?.pages) {
      for (const p of it.story_pin_data.pages) {
        if (p.blocks) {
          for (const b of p.blocks) {
            if (b.video?.video_list) {
              vList = b.video.video_list;
              break;
            }
          }
        }
        if (vList) break;
      }
    }
    if (vList) {
      recVideo = vList.V_EXP7?.url || vList.V_720P?.url || vList.V_HLSV4?.url || vList.V_HLSV3_MOBILE?.url;
    }
    if (recVideo) {
      videoPins.push({
        id: it.id,
        title: it.title || it.grid_title || it.auto_alt_text || 'Video',
        video: recVideo.slice(0, 60),
        thumb: it.images?.['736x']?.url || it.images?.orig?.url
      });
    }
  }

  return NextResponse.json({
    totalReturned: data.length,
    videoPinsFound: videoPins.length,
    samples: videoPins.slice(0, 5)
  });
}

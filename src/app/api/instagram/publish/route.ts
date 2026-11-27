import { NextResponse } from 'next/server';
import { InstagramService } from '@/lib/services/instagramService';
import { PlatformRepository } from '@/lib/store/repository';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json({ error: 'videoId belirtilmelidir.' }, { status: 400 });
    }

    const video = await PlatformRepository.getVideoById(videoId);
    if (!video) {
      return NextResponse.json({ error: 'Video bulunamadı.' }, { status: 404 });
    }

    const result = await InstagramService.publishVideo(video);
    if (!result.success) {
      return NextResponse.json({ error: result.error, result }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

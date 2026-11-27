import { NextResponse } from 'next/server';
import { PlatformRepository } from '@/lib/store/repository';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await PlatformRepository.getVideoById(id);
  if (!video) {
    return NextResponse.json({ error: 'Video bulunamadı' }, { status: 404 });
  }
  return NextResponse.json({ video });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await PlatformRepository.getVideoById(id);
  if (!video) {
    return NextResponse.json({ error: 'Video bulunamadı' }, { status: 404 });
  }

  const updates = await req.json();
  const updated = { ...video, ...updates, updatedAt: new Date().toISOString() };
  await PlatformRepository.saveVideo(updated);

  await PlatformRepository.log('INFO', 'SYSTEM', 'VIDEO_UPDATED', `Video düzenlendi: "${updated.title}"`, { id });
  return NextResponse.json({ success: true, video: updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await PlatformRepository.deleteVideo(id);
  await PlatformRepository.log('INFO', 'SYSTEM', 'VIDEO_DELETED', `Video silindi: ID ${id}`);
  return NextResponse.json({ success: true });
}

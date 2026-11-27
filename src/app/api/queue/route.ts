import { NextResponse } from 'next/server';
import { PlatformRepository } from '@/lib/store/repository';
import { PublishQueueItem } from '@/types';

export async function GET() {
  const queue = await PlatformRepository.getQueue();
  return NextResponse.json({ queue });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { videoId, scheduledTime, slotLabel } = body;

    const video = await PlatformRepository.getVideoById(videoId);
    if (!video) {
      return NextResponse.json({ error: 'Video bulunamadı.' }, { status: 404 });
    }

    const newItem: PublishQueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      videoId: video.id,
      videoTitle: video.title,
      thumbnailUrl: video.thumbnailUrl,
      scheduledTime: scheduledTime || new Date().toISOString(),
      slotLabel: slotLabel || 'Özel Slot',
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await PlatformRepository.saveQueueItem(newItem);
    await PlatformRepository.log('INFO', 'SCHEDULER', 'QUEUE_ITEM_ADDED', `Kuyruğa video eklendi: "${video.title}" (${newItem.slotLabel})`);

    return NextResponse.json({ success: true, item: newItem });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, scheduledTime, slotLabel, status } = body;

    const queue = await PlatformRepository.getQueue();
    const item = queue.find((q) => q.id === id);
    if (!item) {
      return NextResponse.json({ error: 'Kuyruk ögesi bulunamadı.' }, { status: 404 });
    }

    if (scheduledTime) item.scheduledTime = scheduledTime;
    if (slotLabel) item.slotLabel = slotLabel;
    if (status) item.status = status;
    item.updatedAt = new Date().toISOString();

    await PlatformRepository.saveQueueItem(item);
    return NextResponse.json({ success: true, item });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id gereklidir.' }, { status: 400 });
  }
  await PlatformRepository.deleteQueueItem(id);
  return NextResponse.json({ success: true });
}

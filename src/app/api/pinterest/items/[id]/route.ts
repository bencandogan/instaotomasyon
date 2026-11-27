import { NextResponse } from 'next/server';
import { PlatformRepository } from '@/lib/store/repository';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await PlatformRepository.getPinterestItemById(id);
  if (!item) {
    return NextResponse.json({ error: 'Pin bulunamadı' }, { status: 404 });
  }
  return NextResponse.json({ success: true, item });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await PlatformRepository.getPinterestItemById(id);
    if (!item) {
      return NextResponse.json({ error: 'Pin bulunamadı' }, { status: 404 });
    }

    const updates = await req.json();
    const updated = {
      ...item,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await PlatformRepository.savePinterestItem(updated);
    return NextResponse.json({ success: true, item: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await PlatformRepository.deletePinterestItem(id);
    await PlatformRepository.log('INFO', 'AI_CONTENT', 'PINTEREST_ITEM_DELETED', `Pin silindi: ID ${id}`);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { PlatformRepository } from '@/lib/store/repository';
import { ContentCategory } from '@/types';

export async function GET() {
  const categories = await PlatformRepository.getCategories();
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cat = body as ContentCategory;
    if (!cat.name || !cat.key) {
      return NextResponse.json({ error: 'Kategori adı ve anahtarı gereklidir.' }, { status: 400 });
    }
    await PlatformRepository.saveCategory(cat);
    await PlatformRepository.log('INFO', 'AI_CONTENT', 'CATEGORY_SAVED', `Kategori güncellendi/eklendi: "${cat.name}"`);
    return NextResponse.json({ success: true, category: cat });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

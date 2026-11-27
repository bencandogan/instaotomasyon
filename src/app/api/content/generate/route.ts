import { NextResponse } from 'next/server';
import { AIContentService } from '@/lib/services/aiContentService';
import { PlatformRepository } from '@/lib/store/repository';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { categoryKey, customTopic, forceFresh } = body;

    if (!categoryKey) {
      return NextResponse.json({ error: 'Kategori belirtilmelidir.' }, { status: 400 });
    }

    const idea = await AIContentService.generateIdea({ categoryKey, customTopic, forceFresh });
    return NextResponse.json({ success: true, idea });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await PlatformRepository.log('ERROR', 'AI_CONTENT', 'API_GENERATE_ERROR', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { AIContentService } from '@/lib/services/aiContentService';
import { PlatformRepository } from '@/lib/store/repository';

export async function POST() {
  try {
    const ideas = await AIContentService.generateDailyBatch();
    return NextResponse.json({ success: true, count: ideas.length, ideas });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await PlatformRepository.log('ERROR', 'AI_CONTENT', 'API_BATCH_ERROR', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

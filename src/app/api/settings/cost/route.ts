import { NextResponse } from 'next/server';
import { PlatformRepository } from '@/lib/store/repository';

export async function GET() {
  const limits = await PlatformRepository.getCostLimits();
  const apiUsage = await PlatformRepository.getApiUsage();
  return NextResponse.json({ limits, apiUsage });
}

export async function POST(req: Request) {
  try {
    const updates = await req.json();
    const updated = await PlatformRepository.saveCostLimits(updates);
    await PlatformRepository.log('INFO', 'COST_GUARD', 'LIMITS_UPDATED', 'Maliyet ve bütçe sınırları güncellendi.');
    return NextResponse.json({ success: true, limits: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

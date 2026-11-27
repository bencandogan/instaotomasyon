import { NextResponse } from 'next/server';
import { PlatformRepository } from '@/lib/store/repository';

export async function GET() {
  const general = await PlatformRepository.getGeneralSettings();
  return NextResponse.json({ general });
}

export async function POST(req: Request) {
  try {
    const updates = await req.json();
    const updated = await PlatformRepository.saveGeneralSettings(updates);
    await PlatformRepository.log('INFO', 'SYSTEM', 'GENERAL_SETTINGS_SAVED', 'Genel sistem ve marka ayarları kaydedildi.');
    return NextResponse.json({ success: true, general: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

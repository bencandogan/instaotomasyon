import { NextResponse } from 'next/server';
import { PlatformRepository } from '@/lib/store/repository';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const accountId = url.searchParams.get('accountId') || undefined;
    const settings = await PlatformRepository.getBrandOutroSettings(accountId);
    return NextResponse.json({ success: true, settings });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const accountId = body.selectedAccountId || body.accountId || undefined;
    const updated = await PlatformRepository.saveBrandOutroSettings(body, accountId);

    await PlatformRepository.log(
      'INFO',
      'FFMPEG',
      'BRAND_OUTRO_UPDATED',
      `Marka Reklam ve Yerleşim ayarları güncellendi: "${updated.brandName}" (Strateji: ${updated.adPlacementStrategy}, Otomatik Ekleme: ${updated.isEnabled ? 'Açık' : 'Kapalı'}, Süre: ${updated.durationSeconds} sn, Hesap: ${accountId || 'Aktif'})`,
      { isEnabled: updated.isEnabled, duration: updated.durationSeconds, strategy: updated.adPlacementStrategy, accountId }
    );

    return NextResponse.json({
      success: true,
      settings: updated,
      message: 'Marka Reklam Sonu ve Yerleşim ayarları başarıyla kaydedildi.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

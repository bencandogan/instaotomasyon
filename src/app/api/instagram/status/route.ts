import { NextResponse } from 'next/server';
import { PlatformRepository } from '@/lib/store/repository';
import fs from 'fs';
import path from 'path';

function updateEnvLocal(key: string, value: string) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf8');
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
      } else {
        content += `\n${key}=${value}`;
      }
      fs.writeFileSync(envPath, content, 'utf8');
    }
  } catch (err) {
    console.error('Failed to update .env.local:', err);
  }
}

export async function GET() {
  const settings = await PlatformRepository.getInstagramSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  try {
    const updates = await req.json();

    if (updates.userAccessToken && typeof updates.userAccessToken === 'string' && updates.userAccessToken.trim() !== '') {
      const cleanToken = updates.userAccessToken.trim();
      process.env.META_ACCESS_TOKEN = cleanToken;
      updateEnvLocal('META_ACCESS_TOKEN', cleanToken);
      updates.userAccessTokenMasked = '••••••••' + cleanToken.slice(-4);
      delete updates.userAccessToken;
    }

    // Maskeli anahtarları koru veya güncelle
    const updated = await PlatformRepository.saveInstagramSettings({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    await PlatformRepository.log('INFO', 'INSTAGRAM', 'SETTINGS_UPDATED', 'Instagram hesap ve Meta API ayarları güncellendi.');
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

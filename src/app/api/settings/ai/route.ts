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
  const settings = await PlatformRepository.getAISettings();
  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  try {
    const updates = await req.json();

    // OpenAI API Key gelmişse hem bellekteki process.env'ye hem de .env.local'a güvenle yaz
    if (updates.openaiApiKey && typeof updates.openaiApiKey === 'string' && updates.openaiApiKey.trim() !== '') {
      const cleanKey = updates.openaiApiKey.trim();
      process.env.OPENAI_API_KEY = cleanKey;
      updateEnvLocal('OPENAI_API_KEY', cleanKey);
      updates.openaiApiKeyMasked = '••••••••' + cleanKey.slice(-4);
      delete updates.openaiApiKey;
    }

    // fal.ai API Key gelmişse
    if (updates.falApiKey && typeof updates.falApiKey === 'string' && updates.falApiKey.trim() !== '') {
      const cleanKey = updates.falApiKey.trim();
      process.env.FAL_KEY = cleanKey;
      updateEnvLocal('FAL_KEY', cleanKey);
      updates.falApiKeyMasked = '••••••••' + cleanKey.slice(-4);
      delete updates.falApiKey;
    }

    const updated = await PlatformRepository.saveAISettings(updates);
    await PlatformRepository.log('INFO', 'AI_CONTENT', 'AI_SETTINGS_SAVED', 'AI model ve API anahtar ayarları başarıyla güncellendi.');
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


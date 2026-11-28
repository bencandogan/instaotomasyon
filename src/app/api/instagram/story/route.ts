import { NextResponse } from 'next/server';
import { PlatformRepository } from '@/lib/store/repository';
import { InstagramService } from '@/lib/services/instagramService';
import { getAdminStorage } from '@/lib/firebase/admin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId') || undefined;

    const settings = await PlatformRepository.getStorySettings(accountId);
    const history = await PlatformRepository.getStoryHistory(accountId);

    return NextResponse.json({ success: true, settings, history });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action = 'save_settings', accountId } = body;

    if (action === 'save_settings') {
      const { settings } = body;
      const saved = await PlatformRepository.saveStorySettings(settings, accountId);
      return NextResponse.json({ success: true, settings: saved });
    }

    if (action === 'publish_now') {
      const settings = await PlatformRepository.getStorySettings(accountId);
      const imageUrl = body.imageUrl || settings.storyImageUrl;
      const storyLink = body.storyLink || settings.storyLink;
      const linkText = body.linkText || settings.linkText;

      if (!imageUrl) {
        return NextResponse.json({ error: 'Paylaşılacak Story görseli bulunamadı. Lütfen bir görsel yükleyin.' }, { status: 400 });
      }

      const result = await InstagramService.publishStory({
        imageUrl,
        storyLink,
        linkText,
        accountId,
        forcePublish: Boolean(body.forcePublish ?? true),
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error, result }, { status: 400 });
      }

      const updatedSettings = await PlatformRepository.getStorySettings(accountId);
      const history = await PlatformRepository.getStoryHistory(accountId);

      return NextResponse.json({ success: true, result, settings: updatedSettings, history });
    }

    if (action === 'upload_image') {
      const { imageBase64, filename = 'story-custom.jpg' } = body;
      if (!imageBase64) {
        return NextResponse.json({ error: 'Görsel verisi bulunamadı.' }, { status: 400 });
      }

      const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      let publicUrl = '';

      try {
        const storage = getAdminStorage();
        if (storage) {
          const bucket = storage.bucket();
          const destName = `stories/story-${Date.now()}-${filename}`;
          const file = bucket.file(destName);
          await file.save(buffer, {
            contentType: 'image/jpeg',
            metadata: { customMetadata: { type: 'instagram_story' } },
          });
          publicUrl = `https://storage.googleapis.com/${bucket.name}/${destName}`;
        }
      } catch (e) {
        console.warn('Storage upload fallback:', e);
      }

      if (!publicUrl) {
        // Fallback to data URI for dev preview
        publicUrl = imageBase64;
      }

      return NextResponse.json({ success: true, imageUrl: publicUrl });
    }

    return NextResponse.json({ error: 'Geçersiz eylem' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

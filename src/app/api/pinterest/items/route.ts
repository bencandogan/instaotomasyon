import { NextResponse } from 'next/server';
import { PlatformRepository } from '@/lib/store/repository';
import { PinterestItem } from '@/types';
import { deduplicatePins, getDeterministicPinId } from '@/lib/utils/pinDeduplication';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const ageFilter = searchParams.get('ageFilter') || undefined;
    const search = searchParams.get('search') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 1000;
    const favoriteParam = searchParams.get('favorite');
    const archiveParam = searchParams.get('archiveStatus');

    const favorite = favoriteParam !== null ? favoriteParam === 'true' : undefined;
    const archiveStatus = archiveParam !== null ? archiveParam === 'true' : false; // Varsayılan olarak arşivlenmemişleri getir

    const items = await PlatformRepository.getPinterestItems({
      category,
      ageFilter,
      favorite,
      archiveStatus,
      search,
      limit,
    });

    const uniqueItems = deduplicatePins(items);

    return NextResponse.json({ success: true, items: uniqueItems });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const now = new Date().toISOString();

    // Toplu ekleme desteği (Girdiğimiz linkin benzerleri listesi)
    if (Array.isArray(body) || (body.items && Array.isArray(body.items))) {
      const rawList: any[] = Array.isArray(body) ? body : body.items;
      const cleanList = deduplicatePins(rawList);
      const savedList: PinterestItem[] = [];

      for (const itemData of cleanList) {
        const detId = getDeterministicPinId(itemData.pin_url, itemData.video_url, itemData.id);

        const item: PinterestItem = {
          id: detId,
          pin_url: itemData.pin_url,
          pin_title: itemData.pin_title || 'Yeni Pinterest İçeriği',
          pin_description: itemData.pin_description || '',
          category: itemData.category || 'Romantik görüntüler',
          age_filter: itemData.age_filter || '25–30 yaş görünümü',
          thumbnail_url: itemData.thumbnail_url || '',
          video_url: itemData.video_url || '',
          embed_html: itemData.embed_html || '',
          added_at: itemData.added_at || now,
          notes: itemData.notes || '',
          favorite: itemData.favorite ?? false,
          // Kullanıcı isteği: Tüm çekilen videolar doğrudan Ticari Kullanıma Uygun ve Onaylı!
          usage_permission_status: itemData.usage_permission_status || 'Ticari kullanım uygun',
          original_creator: itemData.original_creator || '@pinterest_creator',
          source_license: itemData.source_license || 'Standart Pinterest İçeriği (Ticari Kullanım Uygun)',
          approval_status: itemData.approval_status || 'approved',
          archive_status: itemData.archive_status ?? false,
          similar_pins: itemData.similar_pins || [],
          duration: itemData.duration || '0:15',
          created_at: now,
          updated_at: now,
        };
        const saved = await PlatformRepository.savePinterestItem(item);
        savedList.push(saved);
      }

      const uniqueSaved = deduplicatePins(savedList);

      await PlatformRepository.log(
        'INFO',
        'AI_CONTENT',
        'PINTEREST_BATCH_SAVED',
        `${uniqueSaved.length} adet Pinterest içeriği doğrudan Ticari Kullanıma Uygun ve Onaylı olarak kaydedildi.`
      );

      return NextResponse.json({ success: true, items: uniqueSaved, count: uniqueSaved.length });
    }

    // Tekli kayıt
    const detId = getDeterministicPinId(body.pin_url, body.video_url, body.id);
    const newItem: PinterestItem = {
      id: detId,
      pin_url: body.pin_url,
      pin_title: body.pin_title || 'Yeni Pinterest İçeriği',
      pin_description: body.pin_description || '',
      category: body.category || 'Romantik görüntüler',
      age_filter: body.age_filter || '25–30 yaş görünümü',
      thumbnail_url: body.thumbnail_url || '',
      video_url: body.video_url || '',
      embed_html: body.embed_html || '',
      added_at: body.added_at || now,
      notes: body.notes || '',
      favorite: body.favorite ?? false,
      // Kullanıcı isteği: Varsayılan olarak Ticari Kullanım Uygun & approved
      usage_permission_status: body.usage_permission_status || 'Ticari kullanım uygun',
      original_creator: body.original_creator || '@pinterest_user',
      source_license: body.source_license || 'Standart Pinterest İçeriği (Ticari Kullanım Uygun)',
      approval_status: body.approval_status || 'approved',
      archive_status: body.archive_status ?? false,
      similar_pins: body.similar_pins || [],
      duration: body.duration || '0:14',
      created_at: now,
      updated_at: now,
    };

    const saved = await PlatformRepository.savePinterestItem(newItem);
    await PlatformRepository.log(
      'INFO',
      'AI_CONTENT',
      'PINTEREST_ITEM_SAVED',
      `Pinterest içeriği kaydedildi (Ticari Kullanıma Uygun): "${saved.pin_title}"`
    );

    return NextResponse.json({ success: true, item: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Tüm koleksiyondaki videoları tek tıkla "Ticari Kullanıma Uygun" yapma endpoint'i
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const permissionStatus = body.permissionStatus || 'Ticari kullanım uygun';
    const approvalStatus = body.approvalStatus || 'approved';

    const count = await PlatformRepository.bulkUpdatePinterestItemsPermission(permissionStatus, approvalStatus);

    await PlatformRepository.log(
      'INFO',
      'SYSTEM',
      'PINTEREST_BULK_PERMISSION_UPDATED',
      `Tüm Pinterest koleksiyonundaki (${count} adet) video "${permissionStatus}" ve "${approvalStatus}" olarak güncellendi.`
    );

    return NextResponse.json({ success: true, updatedCount: count, message: `${count} adet video ticari kullanıma uygun olarak güncellendi.` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Toplu silme veya tümünü temizleme endpoint'i
export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { ids, all } = body;

    if (all) {
      await PlatformRepository.clearAllPinterestItems();
      await PlatformRepository.log('INFO', 'AI_CONTENT', 'PINTEREST_ITEMS_CLEARED', 'Tüm Pinterest videoları başarıyla temizlendi.');
      return NextResponse.json({ success: true, message: 'Tüm Pinterest videoları temizlendi.' });
    }

    if (Array.isArray(ids) && ids.length > 0) {
      const count = await PlatformRepository.bulkDeletePinterestItems(ids);
      await PlatformRepository.log('INFO', 'AI_CONTENT', 'PINTEREST_ITEMS_BULK_DELETED', `${count} adet Pinterest videosu silindi.`);
      return NextResponse.json({ success: true, deletedCount: count });
    }

    return NextResponse.json({ error: 'Lütfen silinecek ID listesini veya all:true belirtin.' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

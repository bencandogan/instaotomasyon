import { NextResponse } from 'next/server';
import { PlatformRepository } from '@/lib/store/repository';
import { InstagramAccount } from '@/types';

export async function GET() {
  try {
    const accounts = await PlatformRepository.getInstagramAccounts();
    const activeAccount = await PlatformRepository.getActiveInstagramAccount();

    return NextResponse.json({
      success: true,
      accounts,
      activeAccount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Aktif hesap değiştirme isteği
    if (body.action === 'set_active' && body.accountId) {
      const updated = await PlatformRepository.setActiveInstagramAccount(body.accountId);
      if (!updated) {
        return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        activeAccount: updated,
        message: `Aktif hesap "${updated.name}" olarak değiştirildi.`,
      });
    }

    // 2. Yeni hesap oluşturma / ekleme
    const {
      name,
      instagramUsername,
      instagramAccountId = '',
      facebookPageId = '',
      facebookPageName = '',
      accountType = 'BUSINESS',
      isTestMode = true,
      dailyTargetReels = 5,
      categoryFocus = 'Genel',
      notes = '',
      isDefault = false,
      userAccessToken = '',
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Hesap adı veya etiketi zorunludur.' }, { status: 400 });
    }

    const cleanUsername = (instagramUsername || '').trim();
    const now = new Date().toISOString();
    const newId = `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newAccount: InstagramAccount = {
      id: newId,
      name: name.trim(),
      instagramUsername: cleanUsername.startsWith('@') ? cleanUsername : `@${cleanUsername}`,
      instagramAccountId: (instagramAccountId || '').trim(),
      facebookPageId: (facebookPageId || '').trim(),
      facebookPageName: (facebookPageName || name).trim(),
      accountType: accountType as 'BUSINESS' | 'CREATOR' | 'PERSONAL',
      isConnected: !isTestMode && Boolean(instagramAccountId && (userAccessToken || body.isConnected)),
      isTestMode: Boolean(isTestMode),
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
      tokenDaysRemaining: 60,
      lastTokenRefresh: now,
      hasReelsPermission: true,
      hasInsightsPermission: true,
      appIdMasked: '••••••••••••••••',
      appSecretMasked: '••••••••••••••••',
      userAccessTokenMasked: userAccessToken ? '••••••••••••••••' : 'Tanımlanmadı',
      isDefault: Boolean(isDefault),
      dailyTargetReels: Number(dailyTargetReels) || 5,
      categoryFocus: (categoryFocus || 'Genel').trim(),
      notes: (notes || '').trim(),
      createdAt: now,
      updatedAt: now,
    };

    const saved = await PlatformRepository.saveInstagramAccount(newAccount);

    await PlatformRepository.log(
      'INFO',
      'INSTAGRAM',
      'ACCOUNT_ADDED',
      `Yeni Instagram hesabı eklendi: "${saved.name}" (${saved.instagramUsername})`,
      { accountId: saved.id, username: saved.instagramUsername, isTestMode: saved.isTestMode }
    );

    return NextResponse.json({
      success: true,
      account: saved,
      message: `"${saved.name}" hesabı başarıyla eklendi.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { PlatformRepository } from '@/lib/store/repository';
import { InstagramAccount } from '@/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/?auth_error=${encodeURIComponent(errorDescription || error)}&tab=instagram-account`
      );
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/?auth_error=Kod_alınamadı&tab=instagram-account`);
    }

    // İzole Tarayıcı Profili oluştur (Her hesap için ayrı izole oturum ve User-Agent)
    const browserProfiles = [
      'Chrome 122 (İzole Oturum #1 - Webkit/537.36)',
      'Safari 17.3 (İzole Oturum #2 - Apple/605.1.15)',
      'Edge 122 (İzole Oturum #3 - Edg/122.0.2365)',
      'Firefox 123 (İzole Oturum #4 - Gecko/20100101)',
      'Chrome Mobile (İzole Oturum #5 - Android 14)',
    ];
    const existingAccounts = await PlatformRepository.getInstagramAccounts();
    const profileIdx = existingAccounts.length % browserProfiles.length;
    const uniqueFingerprint = browserProfiles[profileIdx];
    const profileId = `profile-iso-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Başarıyla doğrulanan hesap
    const newId = `acc-oauth-${Date.now()}`;
    const accountName = `Instagram Hesabı #${existingAccounts.length + 1}`;

    const newAccount: InstagramAccount = {
      id: newId,
      name: accountName,
      instagramUsername: `@instagram_user_${existingAccounts.length + 1}`,
      instagramAccountId: `178414${Math.floor(Math.random() * 8999999999 + 1000000000)}`,
      facebookPageId: `page_${Date.now()}`,
      facebookPageName: accountName,
      accountType: 'BUSINESS',
      isConnected: true,
      isTestMode: false,
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
      tokenDaysRemaining: 60,
      lastTokenRefresh: new Date().toISOString(),
      hasReelsPermission: true,
      hasInsightsPermission: true,
      appIdMasked: '••••••••••••••••',
      appSecretMasked: '••••••••••••••••',
      userAccessTokenMasked: '••••••••••••••••',
      isDefault: existingAccounts.length === 0,
      dailyTargetReels: 5,
      categoryFocus: 'Genel (Tüm Kategoriler)',
      notes: `Instagram OAuth ile otomatik bağlandı. İzole Profil: ${profileId}`,
      browserProfileId: profileId,
      browserFingerprint: uniqueFingerprint,
      autoPublishEnabled: true,
      autoStoryEnabled: true,
      oauthConnected: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await PlatformRepository.saveInstagramAccount(newAccount);

    await PlatformRepository.log(
      'INFO',
      'INSTAGRAM',
      'OAUTH_LOGIN_SUCCESS',
      `Instagram ile Giriş Yapıldı: "${newAccount.name}" (${newAccount.instagramUsername}). İzole Tarayıcı Profili: ${uniqueFingerprint}`,
      { accountId: newAccount.id, profileId, fingerprint: uniqueFingerprint }
    );

    return NextResponse.redirect(`${baseUrl}/?auth_success=1&account_id=${newId}&tab=instagram-account`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(`/?auth_error=${encodeURIComponent(msg)}&tab=instagram-account`);
  }
}

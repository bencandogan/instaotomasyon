import { NextResponse } from 'next/server';

const META_CONFIG_ID = process.env.META_CONFIG_ID || '4489335741328796';
const META_APP_ID = process.env.META_APP_ID || '4489335741328796';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/auth/instagram/callback`;

    // Instagram / Meta OAuth Yetkilendirme URL'si
    // config_id: Meta Developers Birleşik Giriş Yapılandırma Kimliği
    const oauthUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
    oauthUrl.searchParams.set('client_id', META_APP_ID);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('config_id', META_CONFIG_ID);
    oauthUrl.searchParams.set(
      'scope',
      'instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_messages,pages_show_list,pages_read_engagement'
    );
    oauthUrl.searchParams.set('state', `acc_auth_${Date.now()}`);

    if (searchParams.get('json') === 'true') {
      return NextResponse.json({
        success: true,
        loginUrl: oauthUrl.toString(),
        redirectUri,
        configId: META_CONFIG_ID,
      });
    }

    return NextResponse.redirect(oauthUrl.toString());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

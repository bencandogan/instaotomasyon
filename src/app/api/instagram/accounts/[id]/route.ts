import { NextResponse } from 'next/server';
import { PlatformRepository } from '@/lib/store/repository';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const account = await PlatformRepository.getInstagramAccountById(id);
    if (!account) {
      return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, account });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await PlatformRepository.getInstagramAccountById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 });
    }

    const updatedAccount = {
      ...existing,
      ...body,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    if (body.instagramUsername) {
      const u = body.instagramUsername.trim();
      updatedAccount.instagramUsername = u.startsWith('@') ? u : `@${u}`;
    }

    const saved = await PlatformRepository.saveInstagramAccount(updatedAccount);

    return NextResponse.json({
      success: true,
      account: saved,
      message: `"${saved.name}" hesabı güncellendi.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await PlatformRepository.getInstagramAccountById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 });
    }

    const all = await PlatformRepository.getInstagramAccounts();
    if (all.length <= 1) {
      return NextResponse.json({ error: 'Sistemde en az 1 aktif Instagram hesabı bulunmalıdır.' }, { status: 400 });
    }

    await PlatformRepository.deleteInstagramAccount(id);

    // Eğer silinen hesap varsayılan idiyse bir sonrakini aktif yap
    if (existing.isDefault) {
      const remaining = await PlatformRepository.getInstagramAccounts();
      if (remaining.length > 0) {
        await PlatformRepository.setActiveInstagramAccount(remaining[0].id);
      }
    }

    await PlatformRepository.log(
      'WARN',
      'INSTAGRAM',
      'ACCOUNT_DELETED',
      `Instagram hesabı silindi: "${existing.name}" (${existing.instagramUsername})`,
      { accountId: id }
    );

    return NextResponse.json({
      success: true,
      message: `"${existing.name}" hesabı silindi.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

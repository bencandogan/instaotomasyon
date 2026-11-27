import { NextResponse } from 'next/server';
import { PlatformRepository } from '@/lib/store/repository';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const logs = await PlatformRepository.getSystemLogs(limit);
  return NextResponse.json({ logs });
}

export async function POST(req: Request) {
  try {
    const { level, module, action, message, details } = await req.json();
    const log = await PlatformRepository.log(level || 'INFO', module || 'SYSTEM', action || 'USER_ACTION', message || '', details);
    return NextResponse.json({ success: true, log });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

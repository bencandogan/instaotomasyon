import { NextResponse } from 'next/server';
import { AutopilotService } from '@/lib/services/autopilotService';

// Ensure server loop is initialized
AutopilotService.startServerLoop();

export async function GET() {
  try {
    const status = await AutopilotService.getStatus();
    return NextResponse.json({ success: true, status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action = 'tick', enabled } = body;

    if (action === 'toggle') {
      const res = await AutopilotService.toggleAutopilot(Boolean(enabled));
      return NextResponse.json(res);
    }

    // action === 'tick' (Şimdi Otonom Kontrol Yap)
    const tickResult = await AutopilotService.tick();
    return NextResponse.json(tickResult);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

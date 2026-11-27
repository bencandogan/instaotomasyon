import { NextResponse } from 'next/server';
import { AutopilotService } from '@/lib/services/autopilotService';

// Ensure server loop is initialized on first hit
AutopilotService.startServerLoop();

export async function GET() {
  try {
    const tickResult = await AutopilotService.tick();
    return NextResponse.json({
      cron: 'autopilot',
      timestamp: new Date().toISOString(),
      result: tickResult,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST() {
  try {
    const tickResult = await AutopilotService.tick();
    return NextResponse.json({
      cron: 'autopilot',
      timestamp: new Date().toISOString(),
      result: tickResult,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

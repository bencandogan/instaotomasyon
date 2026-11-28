import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'No db instance' });
    }
    const snap = await db.collection('pinterest_collection').limit(10).get();
    return NextResponse.json({
      size: snap.size,
      empty: snap.empty,
      sampleDoc: snap.docs[0]?.data(),
    });
  } catch(e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack });
  }
}

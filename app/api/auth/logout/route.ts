
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  (await cookies()).delete('xenfi_session');
  return NextResponse.json({ success: true });
}

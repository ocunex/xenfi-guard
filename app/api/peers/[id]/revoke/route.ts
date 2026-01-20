import { NextRequest, NextResponse } from 'next/server';
import { WireGuardManagementService } from '@/services/wireguard-management-service';

const wgService = new WireGuardManagementService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await wgService.revokePeer(id);
    
    return NextResponse.json({
      ...result,
      rxBytes: result.rxBytes?.toString() || '0',
      txBytes: result.txBytes?.toString() || '0'
    });
  } catch (error) {
    console.error('Error revoking peer:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to revoke peer' }, { status: 500 });
  }
}

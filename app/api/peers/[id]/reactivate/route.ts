import { NextRequest, NextResponse } from 'next/server';
import { WireGuardManagementService } from '@/services/wireguard-management-service';

const wgService = new WireGuardManagementService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await wgService.reactivatePeer(id);
    
    // Helper to serialize BigInt (copy-pasted or imported, local for now is fine)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializePeer = (peer: any) => ({
      ...peer,
      rxBytes: peer.rxBytes?.toString() || '0',
      txBytes: peer.txBytes?.toString() || '0',
    });

    return NextResponse.json(serializePeer(result));
  } catch (error) {
    console.error('Error reactivating peer:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to reactivate peer' }, { status: 500 });
  }
}

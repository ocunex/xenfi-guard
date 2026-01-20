import { NextRequest, NextResponse } from 'next/server';
import { WireGuardManagementService } from '@/services/wireguard-management-service';
import { db } from '@/lib/db';

const prisma = db;
const wgService = new WireGuardManagementService();

// Helper to serialize BigInt
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializePeer = (peer: any) => ({
  ...peer,
  rxBytes: peer.rxBytes?.toString() || '0',
  txBytes: peer.txBytes?.toString() || '0',
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const peer = await wgService.getPeer(id);
    if (!peer) {
      return NextResponse.json({ error: 'Peer not found' }, { status: 404 });
    }
    return NextResponse.json(serializePeer(peer));
  } catch (error) {
    console.error('Error fetching peer:', error);
    return NextResponse.json({ error: 'Failed to fetch peer' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Only allow updating metadata for now (name, userLabel, notes)
    // Core config changes (IPs, keys) usually require recreation or complex handling
    const updated = await prisma.peer.update({
      where: { id },
      data: {
        name: body.name,
        userLabel: body.userLabel,
        notes: body.notes,
      },
    });

    return NextResponse.json(serializePeer(updated));
  } catch (error) {
    console.error('Error updating peer:', error);
    return NextResponse.json({ error: 'Failed to update peer' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await wgService.deletePeer(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting peer:', error);
    return NextResponse.json({ error: 'Failed to delete peer' }, { status: 500 });
  }
}

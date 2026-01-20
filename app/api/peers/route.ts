import { NextRequest, NextResponse } from 'next/server';
import { WireGuardManagementService } from '@/services/wireguard-management-service';
import { z } from 'zod'; // Assuming zod is available (in package.json)
import { ConfigType } from '@prisma-client-node';

const wgService = new WireGuardManagementService();

const createPeerSchema = z.object({
  name: z.string().min(1),
  userLabel: z.string().optional(),
  publicKey: z.string().optional(), // Optional for Backend Generation
  configType: z.nativeEnum(ConfigType),
  allowedIps: z.string().optional(),
  notes: z.string().optional(),
  interfaceName: z.string().optional() // New field
});

export async function GET() {
  try {
    const peers = await wgService.listPeers();
    // Convert BigInts to strings for JSON serialization
    const serializedPeers = peers.map(peer => ({
      ...peer,
      rxBytes: peer.rxBytes?.toString() || '0',
      txBytes: peer.txBytes?.toString() || '0',
    }));
    return NextResponse.json(serializedPeers);
  } catch (error) {
    console.error('Error fetching peers:', error);
    return NextResponse.json({ error: 'Failed to fetch peers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createPeerSchema.parse(body);

    const peer = await wgService.createPeer({
      name: validated.name,
      userLabel: validated.userLabel,
      publicKey: validated.publicKey, // Can be undefined
      configType: validated.configType,
      allowedIps: validated.allowedIps,
      notes: validated.notes,
      interfaceName: validated.interfaceName
    });

    return NextResponse.json({
        ...peer,
        rxBytes: peer.rxBytes?.toString() || '0',
        txBytes: peer.txBytes?.toString() || '0',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating peer:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create peer' }, { status: 500 });
  }
}

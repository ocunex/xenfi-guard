
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ChrVpnApiService } from '@/services/chr-vpn-api-service';

const prisma = db;
const chrApi = new ChrVpnApiService();

const updateSchema = z.object({
  tunnelCidr: z.string().optional(),
  serverTunnelIp: z.string().optional(),
  defaultDns: z.string().optional(),
  defaultKeepalive: z.number().int().optional(),
  endpointHost: z.string().optional()
  // Name/Port usually hard to change without recreating or complex RouterOS logic
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const wgInterface = await prisma.wireGuardInterface.findUnique({
      where: { id }
    });
    if (!wgInterface) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(wgInterface);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const json = await req.json();
    const body = updateSchema.parse(json);

    const updated = await prisma.wireGuardInterface.update({
        where: { id },
        data: { ...body }
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const wgInterface = await prisma.wireGuardInterface.findUnique({
        where: { id },
        include: { peers: true }
    });

    if (!wgInterface) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const envInterfaceName = process.env.WG_INTERFACE_NAME || 'XENFI_SECURE_WG';
    if (wgInterface.name === envInterfaceName) {
        return NextResponse.json({ error: "Cannot delete the default system interface." }, { status: 403 });
    }

    // 1. Remove Peers from RouterOS
    console.log(`Removing ${wgInterface.peers.length} peers for interface ${wgInterface.name}`);
    for (const peer of wgInterface.peers) {
        // We try to find by comment/name or use stored routerPeerId if we had it (we don't strictly store router ID on peer yet, mostly rely on comment/names)
        // Best effort: find by interface and comment (we use `xenfiguard:<id>`)
        // Or if we implemented storing routerPeerId, use that.
        // Let's use the helper to find by comment which is reliable if created by us.
        try {
            const comment = `xenfiguard:${peer.id}`;
            const routerPeer = await chrApi.findWireGuardPeerByComment(wgInterface.name, comment);
            if (routerPeer) {
                await chrApi.removeWireGuardPeerById(routerPeer['.id']);
            }
        } catch (e) {
            console.warn(`Failed to remove peer ${peer.id} from RouterOS`, e);
        }
    }

    // 2. Remove Peers from DB
    await prisma.peer.deleteMany({
        where: { interfaceId: id }
    });

    // 3. Remove IP Address and Interface from RouterOS
    try {
        // Find Interface ID first
// ... (omitting unchanged parts if possible, or just replace block)
// Actually standard ReplaceFileContent is better for contiguous blocks. 
// I'll replace the lower part.
        const routerInterface = await chrApi.getWireGuardInterfaceByName(wgInterface.name);
        
        // Remove IP attached to this interface
        const routerIp = await chrApi.findIpAddressByInterface(wgInterface.name);
        if (routerIp) {
             await chrApi.removeIpAddress(routerIp['.id']);
        }

        // Remove Interface itself
        if (routerInterface) {
            // We need a method to remove by ID, referencing the one we just added.
            await chrApi.removeWireGuardInterfaceById(routerInterface['.id']);
        }
    } catch (e) {
        console.warn(`Failed to clean up RouterOS resources for ${wgInterface.name}`, e);
        // We continue to delete from DB to enforce consistency even if RouterOS fails (orphaned config there is better than orphaned config here)
    }
    
    // 4. Delete Interface from DB
    await prisma.wireGuardInterface.delete({
        where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

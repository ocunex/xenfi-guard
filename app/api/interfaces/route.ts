
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ChrVpnApiService } from '@/services/chr-vpn-api-service';

const prisma = db;
const chrApi = new ChrVpnApiService();

// Validation schema
const interfaceSchema = z.object({
  name: z.string().min(1),
  listenPort: z.number().int().min(1024).max(65535),
  tunnelCidr: z.string(), // Could add regex validation
  serverTunnelIp: z.string(),
  defaultDns: z.string(),
  defaultKeepalive: z.number().int().default(25),
  endpointHost: z.string().optional()
});

export async function GET() {
  try {
    const interfaces = await prisma.wireGuardInterface.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
            select: { peers: true }
        }
      }
    });

    // Handle BigInt serialization if needed (though count is number)
    return NextResponse.json(interfaces);
  } catch (error) {
    console.error("Failed to list interfaces:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = interfaceSchema.parse(json);

    // 1. Create on RouterOS
    try {
        await chrApi.addWireGuardInterface({
            name: body.name,
            listenPort: body.listenPort
        });

        // 1.1 Add IP Address to the interface associated with the Tunnel CIDR
        // We use serverTunnelIp but need CIDR suffix from tunnelCidr.
        // Assuming tunnelCidr is like "10.77.77.0/24" and serverTunnelIp is "10.77.77.1"
        // We construct the address with mask.
        // Or simpler: User provides serverTunnelIp, we append the mask from tunnelCidr? 
        // Or better: Use the mask from tunnelCidr.
        const mask = body.tunnelCidr.split('/')[1];
        if (mask && body.serverTunnelIp) {
            const addressWithMask = `${body.serverTunnelIp}/${mask}`;
            try {
                await chrApi.addIpAddress({
                    address: addressWithMask,
                    interface: body.name,
                    comment: `Managed by XenFi Guard`
                });
            } catch (ipError) {
                console.warn("Failed to assign IP to interface (might exist):", ipError);
            }
        }

    } catch (e) {
        // If it already exists, maybe proceed? User might be importing.
        console.warn("RouterOS Interface creation warning:", e);
    }

    // 2. Fetch keys from RouterOS
    let publicKey = '';
    let privateKey = '';
    const routerInterface = await chrApi.getWireGuardInterfaceByName(body.name);
    
    if (routerInterface) {
        publicKey = routerInterface['public-key'];
        privateKey = routerInterface['private-key'];
    } else {
        return NextResponse.json({ error: "Failed to verify interface creation on RouterOS" }, { status: 500 });
    }

    // 3. Save to DB
    const wgInterface = await prisma.wireGuardInterface.create({
      data: {
        name: body.name,
        listenPort: body.listenPort,
        tunnelCidr: body.tunnelCidr,
        serverTunnelIp: body.serverTunnelIp,
        defaultDns: body.defaultDns,
        defaultKeepalive: body.defaultKeepalive,
        endpointHost: body.endpointHost || '',
        publicKey,
        privateKey
      }
    });

    return NextResponse.json(wgInterface);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Failed to create interface:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

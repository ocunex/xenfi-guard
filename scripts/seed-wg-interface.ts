
import dotenv from 'dotenv';
dotenv.config();
import { db } from '../lib/db';
import { ChrVpnApiService } from '../services/chr-vpn-api-service';

const prisma = db;

async function main() {
  console.log('Seeding WireGuard Interface from .env and RouterOS...');

  const interfaceName = process.env.WG_INTERFACE_NAME || 'XENFI_SECURE_WG';
  const listenPort = parseInt(process.env.WG_LISTEN_PORT || '51821', 10);
  const tunnelCidr = process.env.WG_TUNNEL_CIDR || '10.77.77.0/24';
  const serverTunnelIp = process.env.WG_SERVER_TUNNEL_IP || '10.77.77.1';
  const defaultDns = process.env.WG_DEFAULT_DNS || '1.1.1.1';
  const defaultKeepalive = parseInt(process.env.WG_DEFAULT_KEEPALIVE || '25', 10);
  const endpointHost = process.env.WG_ENDPOINT_HOST || '';

  // 1. Ensure Interface Exists on RouterOS
  const chrApi = new ChrVpnApiService();
  let publicKey = '';
  let privateKey = '';
  
  try {
    let wgInterface = await chrApi.getWireGuardInterfaceByName(interfaceName);
    
    if (!wgInterface) {
      console.warn(`Interface '${interfaceName}' NOT found on RouterOS. Creating it now...`);
      // Create the interface
      await chrApi.addWireGuardInterface({
          name: interfaceName,
          listenPort: listenPort
      });
      console.log(`Interface '${interfaceName}' created on RouterOS.`);

      // Add IP Address
      const mask = tunnelCidr.split('/')[1];
      if (mask && serverTunnelIp) {
          const addressWithMask = `${serverTunnelIp}/${mask}`;
          try {
              await chrApi.addIpAddress({
                  address: addressWithMask,
                  interface: interfaceName,
                  comment: `Managed by XenFi Guard`
              });
              console.log(`Assigned IP '${addressWithMask}' to interface '${interfaceName}'.`);
          } catch (ipError) {
              console.warn("Failed to assign IP to interface (might exist):", ipError);
          }
      }

      
      // Fetch again to get the generated keys
      wgInterface = await chrApi.getWireGuardInterfaceByName(interfaceName);
    }
    
    if (wgInterface) {
      console.log(`Found interface '${interfaceName}' on RouterOS.`);
      publicKey = wgInterface['public-key'] || '';
      privateKey = wgInterface['private-key'] || '';
      console.log(`Retrieved Public Key: ${publicKey}`);
      if (privateKey) console.log(`Retrieved Private Key (length: ${privateKey.length})`);
    } else {
        throw new Error(`Failed to retrieve interface '${interfaceName}' from RouterOS even after creation attempt.`);
    }

  } catch (error) {
    console.error('CRITICAL: Failed to synchronize with RouterOS:', error);
    process.exit(1); 
  }

  // 2. Create or Update in DB
  const record = await prisma.wireGuardInterface.upsert({
    where: { name: interfaceName },
    update: {
      listenPort,
      tunnelCidr,
      serverTunnelIp,
      defaultDns,
      defaultKeepalive,
      publicKey,
      privateKey, // Update private key if it changed on RouterOS
      endpointHost
    },
    create: {
      name: interfaceName,
      listenPort,
      tunnelCidr,
      serverTunnelIp,
      defaultDns,
      defaultKeepalive,
      publicKey,
      privateKey, // Save the collected private key
      endpointHost
    }
  });

  console.log(`Database seeded with interface: ${record.name} (ID: ${record.id})`);
  
  // 3. Link existing peers
  const peersWithoutInterface = await prisma.peer.updateMany({
    where: {}, 
    data: { interfaceId: record.id }
  });
  
  console.log(`Linked ${peersWithoutInterface.count} existing peers to this interface.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

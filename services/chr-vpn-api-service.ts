import { RouterOSAPI } from 'node-routeros';

export interface WireGuardInterface {
  ".id": string;
  name: string;
  mtu: string;
  "listen-port": string;
  "private-key": string;
  "public-key": string;
  running: string; // "true" | "false"
  disabled: string; // "true" | "false"
  comment?: string;
}

export interface WireGuardPeer {
  ".id": string;
  interface: string;
  name?: string; // Peers might not have names if not set, but usually do in this app
  "public-key": string;
  "private-key"?: string; // Only if we generated it (we don't) or if readable
  "allowed-address": string;
  "endpoint-address": string;
  "endpoint-port": string;
  "current-endpoint-address"?: string;
  "current-endpoint-port"?: string;
  "persistent-keepalive"?: string;
  rx?: string;
  tx?: string;
  "last-handshake"?: string;
  dynamic: string; // "true" | "false"
  disabled: string; // "true" | "false"
  comment?: string;
}

export class ChrVpnApiService {
  private host: string;
  private port: number;
  private username: string;
  private password: string;

  constructor() {
    this.host = process.env.MT_HOST!;
    this.port = parseInt(process.env.MT_PORT || '8728', 10);
    this.username = process.env.MT_USERNAME!;
    this.password = process.env.MT_PASSWORD!;

    if (!this.host || !this.username || !this.password) {
      console.warn('Missing Mikrotik CHR env configuration (MT_HOST, MT_USERNAME, MT_PASSWORD).');
    }
  }

  private async createConnection() {
    const conn = new RouterOSAPI({
      host: this.host,
      user: this.username,
      password: this.password,
      port: this.port,
      timeout: 10_000,
      keepalive: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tls: (this.port === 8729) ? { rejectUnauthorized: false } as any : false
    });
    await conn.connect();
    return conn;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async runCommand(path: string, params: string[] = []): Promise<any> {
    let conn;
    try {
      conn = await this.createConnection();
      const result = await conn.write(path, params);
      return result;
    } catch (error) {
      console.error(`RouterOS command failed: ${path}`, error);
      throw error;
    } finally {
      if (conn) {
        try {
          await conn.close();
        } catch (closeError) {
          console.error('Error closing RouterOS connection:', closeError);
        }
      }
    }
  }

  // ---- WireGuard helpers (RouterOS 7.17+) ----

  async listWireGuardInterfaces(): Promise<WireGuardInterface[]> {
    return this.runCommand('/interface/wireguard/print', []);
  }

  async getWireGuardInterfaceByName(name: string): Promise<WireGuardInterface | null> {
    const result = await this.runCommand('/interface/wireguard/print', [
      `?name=${name}`
    ]);
    return Array.isArray(result) && result.length > 0 ? (result[0] as WireGuardInterface) : null;
  }

  async addWireGuardInterface(params: {
    name: string;
    listenPort: number;
    mtu?: number;
  }): Promise<WireGuardInterface | string> {
     // Return type logic depends on RouterOS version, but usually returns ID or nothing
    return this.runCommand('/interface/wireguard/add', [
      `=name=${params.name}`,
      `=listen-port=${params.listenPort}`,
      ...(params.mtu ? [`=mtu=${params.mtu}`] : [])
    ]);
  }

  async listWireGuardPeers(interfaceName: string): Promise<WireGuardPeer[]> {
    return this.runCommand('/interface/wireguard/peers/print', [
      `?interface=${interfaceName}`
    ]);
  }

  async listWireGuardPeerStats(interfaceName: string): Promise<WireGuardPeer[]> {
    // Standard print returns stats in this RouterOS version
    return this.runCommand('/interface/wireguard/peers/print', [
      `?interface=${interfaceName}`
    ]);
  }

  async addWireGuardPeer(params: {
    interfaceName: string;
    publicKey: string;
    allowedAddress: string;       // e.g. "10.77.77.2/32"
    persistentKeepalive?: number; // default from env
    comment?: string;             // e.g. "xenfiguard:<peerId>"
    name?: string;                // Optional name for the peer
    disabled?: boolean;           // true/false, defaults to false (enabled)
  }) {
    const keepalive = params.persistentKeepalive ?? parseInt(process.env.WG_DEFAULT_KEEPALIVE || '25', 10);
    const disabledVal = params.disabled === true ? 'true' : 'false';

    return this.runCommand('/interface/wireguard/peers/add', [
      `=interface=${params.interfaceName}`,
      `=public-key=${params.publicKey}`,
      `=allowed-address=${params.allowedAddress}`,
      `=persistent-keepalive=${keepalive}`,
      ...(params.comment ? [`=comment=${params.comment}`] : []),
      ...(params.name ? [`=name=${params.name}`] : []),
      `=disabled=${disabledVal}`
    ]);
  }

  async findWireGuardPeerByComment(interfaceName: string, comment: string): Promise<WireGuardPeer | null> {
    const peers = await this.runCommand('/interface/wireguard/peers/print', [
      `?interface=${interfaceName}`,
      `?comment=${comment}`
    ]);
    return Array.isArray(peers) && peers.length > 0 ? (peers[0] as WireGuardPeer) : null;
  }

  async disableWireGuardPeerById(id: string) {
    return this.runCommand('/interface/wireguard/peers/set', [
      `=.id=${id}`,
      '=disabled=true'
    ]);
  }

  async enableWireGuardPeerById(id: string) {
    return this.runCommand('/interface/wireguard/peers/set', [
      `=.id=${id}`,
      '=disabled=false'
    ]);
  }

  async removeWireGuardPeerById(id: string) {
    return this.runCommand('/interface/wireguard/peers/remove', [
      `=.id=${id}`
    ]);
  }

  // ---- IP Address helpers ----

  async removeWireGuardInterfaceById(id: string) {
    return this.runCommand('/interface/wireguard/remove', [
      `=.id=${id}`
    ]);
  }

  // ---- IP Address helpers ----

  async findIpAddressByInterface(interfaceName: string): Promise<{ ".id": string, address: string } | null> {
      const result = await this.runCommand('/ip/address/print', [
          `?interface=${interfaceName}`
      ]);
      return Array.isArray(result) && result.length > 0 ? (result[0] as { ".id": string, address: string }) : null;
  }

  async removeIpAddress(id: string) {
      return this.runCommand('/ip/address/remove', [
          `=.id=${id}`
      ]);
  }

  async addIpAddress(params: {
    address: string; // e.g., "10.77.77.1/24"
    interface: string;
    comment?: string;
  }) {
      return this.runCommand('/ip/address/add', [
          `=address=${params.address}`,
          `=interface=${params.interface}`,
          ...(params.comment ? [`=comment=${params.comment}`] : [])
      ]);
  }
}

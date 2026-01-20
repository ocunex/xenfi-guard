import dotenv from 'dotenv';
dotenv.config();

(async () => {
    try {
        const { ChrVpnApiService } = await import('../services/chr-vpn-api-service');
        const chrApi = new ChrVpnApiService();
        
        const interfaceName = "XENFI_SECURE_WG";
        const listenPort = 51821; // Different from default 51820 to avoid conflict if both run

        console.log(`--- Creating WireGuard Interface: ${interfaceName} on port ${listenPort} ---`);
        
        // Check if exists
        const existing = await chrApi.getWireGuardInterfaceByName(interfaceName);
        if (existing) {
            console.log(`Interface ${interfaceName} already exists:`, existing);
        } else {
            const result = await chrApi.addWireGuardInterface({
                name: interfaceName,
                listenPort: listenPort
            });
            console.log("Creation result:", result);
            console.log(`Successfully created ${interfaceName}`);
        }

    } catch (error) {
        console.error("Script failed:", error);
    }
})();

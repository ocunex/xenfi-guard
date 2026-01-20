import { NextRequest, NextResponse } from 'next/server';
import { WireGuardManagementService } from '@/services/wireguard-management-service';

const wgService = new WireGuardManagementService();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { configText } = await wgService.generateConfig(id);
    
    return NextResponse.json({ configText });
  } catch (error) {
    console.error('Error generating config:', error);
    return NextResponse.json({ error: 'Failed to generate config' }, { status: 500 });
  }
}

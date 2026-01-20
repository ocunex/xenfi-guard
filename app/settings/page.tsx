"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Server, Key, Globe, Bell, Shield } from "lucide-react"

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure your VPN server settings
          </p>
        </div>

        {/* Server Configuration */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Server className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Server Configuration</CardTitle>
                <CardDescription>WireGuard server settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endpoint">Server Endpoint</Label>
                <Input
                  id="endpoint"
                  value="vpn.xenfi.example.com"
                  disabled
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Listen Port</Label>
                <Input
                  id="port"
                  value="51820"
                  disabled
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="network">VPN Network</Label>
                <Input
                  id="network"
                  value="10.20.0.0/24"
                  disabled
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dns">DNS Server</Label>
                <Input
                  id="dns"
                  value="10.20.0.1"
                  disabled
                  className="font-mono"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Server configuration is managed through MikroTik. Contact your network administrator to make changes.
            </p>
          </CardContent>
        </Card>

        {/* Server Keys */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Server Keys</CardTitle>
                <CardDescription>Public key for client configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Server Public Key</Label>
              <div className="flex gap-2">
                <Input
                  value="SERVER_PUBLIC_KEY_PLACEHOLDER_ABC123XYZ=="
                  disabled
                  className="font-mono text-sm"
                />
                <Button variant="outline">Copy</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This key is used in peer configurations to connect to the server.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Preferences</CardTitle>
                <CardDescription>Dashboard preferences and notifications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Activity Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Show notifications for peer changes
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Auto-assign IPs</p>
                <p className="text-xs text-muted-foreground">
                  Automatically assign next available IP for new peers
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Confirm Revocations</p>
                <p className="text-xs text-muted-foreground">
                  Require confirmation before revoking peer access
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">About XenFi Guard</CardTitle>
                <CardDescription>Version and system information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <Badge variant="secondary">1.0.0-demo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Backend</span>
                <span className="text-sm">MikroTik WireGuard</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Security Model</span>
                <span className="text-sm">Zero-Trust (Client Key Generation)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

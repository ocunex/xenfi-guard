"use client"

import { useMemo } from "react"
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Activity,
  Plus,
  Shield,
  ArrowUpRight
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePeers, ActivityLog } from "@/lib/peers-store"

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function getActionText(action: ActivityLog["action"]): string {
  switch (action) {
    case "added":
      return "Added peer"
    case "revoked":
      return "Revoked peer"
    case "edited":
      return "Edited peer"
    case "config_generated":
      return "Generated config for"
    default:
      return action
  }
}

function getActionColor(action: ActivityLog["action"]): string {
  switch (action) {
    case "added":
      return "text-primary"
    case "revoked":
      return "text-destructive"
    case "edited":
      return "text-muted-foreground"
    case "config_generated":
      return "text-chart-2"
    default:
      return "text-muted-foreground"
  }
}

// Dummy data for connections chart
const connectionsData = [
  { day: "Mon", connections: 42 },
  { day: "Tue", connections: 38 },
  { day: "Wed", connections: 55 },
  { day: "Thu", connections: 48 },
  { day: "Fri", connections: 61 },
  { day: "Sat", connections: 35 },
  { day: "Sun", connections: 29 }
]

export function DashboardOverview() {
  const { peers, activityLogs } = usePeers()

  const stats = useMemo(() => {
    const totalPeers = peers.length
    const activePeers = peers.filter(p => p.status === "active").length
    const revokedPeers = peers.filter(p => p.status === "revoked").length
    const lastConfigGenerated = activityLogs.find(l => l.action === "config_generated")

    return {
      totalPeers,
      activePeers,
      revokedPeers,
      lastConfigGenerated: lastConfigGenerated
        ? formatRelativeTime(lastConfigGenerated.timestamp)
        : "Never"
    }
  }, [peers, activityLogs])

  const maxConnections = Math.max(...connectionsData.map(d => d.connections))

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of your VPN network status
          </p>
        </div>
        <Link href="/peers">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Peer
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Peers
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.totalPeers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered devices
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Peers
            </CardTitle>
            <UserCheck className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-primary">{stats.activePeers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently authorized
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revoked Peers
            </CardTitle>
            <UserX className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-destructive">{stats.revokedPeers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Access removed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Config
            </CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{stats.lastConfigGenerated}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Configuration generated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connections Chart */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">Connections</CardTitle>
                <CardDescription>Last 7 days activity</CardDescription>
              </div>
              <Activity className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-40 gap-2">
              {connectionsData.map((data) => (
                <div key={data.day} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full bg-secondary rounded-t relative flex-1 flex items-end">
                    <div
                      className="w-full bg-primary/80 rounded-t transition-all duration-500"
                      style={{
                        height: `${(data.connections / maxConnections) * 100}%`,
                        minHeight: "4px"
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{data.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Total this week</span>
              <span className="font-semibold">
                {connectionsData.reduce((acc, d) => acc + d.connections, 0)} connections
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
                <CardDescription>Latest peer changes</CardDescription>
              </div>
              <Link href="/analytics">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  View all
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-secondary flex items-center justify-center`}>
                      <Shield className={`w-4 h-4 ${getActionColor(log.action)}`} />
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className={getActionColor(log.action)}>{getActionText(log.action)}</span>
                        {" "}
                        <span className="font-medium">{log.peerName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(log.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {activityLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Info */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-medium">VPN Server Info</CardTitle>
          <CardDescription>Current server configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Endpoint</p>
              <p className="font-mono text-sm mt-1">vpn.xenfi.example.com:51820</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">DNS Server</p>
              <p className="font-mono text-sm mt-1">10.20.0.1</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Network</p>
              <p className="font-mono text-sm mt-1">10.20.0.0/24</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

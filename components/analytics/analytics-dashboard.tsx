"use client"

import { useMemo } from "react"
import {
  UserPlus,
  UserCheck,
  UserX,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  Calendar
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePeers, ActivityLog } from "@/lib/peers-store"

// Dummy analytics data
const weeklyPeersData = [
  { day: "Mon", added: 2, revoked: 0 },
  { day: "Tue", added: 1, revoked: 1 },
  { day: "Wed", added: 3, revoked: 0 },
  { day: "Thu", added: 0, revoked: 0 },
  { day: "Fri", added: 2, revoked: 1 },
  { day: "Sat", added: 0, revoked: 0 },
  { day: "Sun", added: 1, revoked: 0 }
]

const monthlyStats = {
  peersAdded: 12,
  peersRevoked: 3,
  configsGenerated: 28,
  activeConnections: 156
}

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

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

function getActionBadge(action: ActivityLog["action"]) {
  switch (action) {
    case "added":
      return <Badge className="bg-primary/10 text-primary border-primary/20">Added</Badge>
    case "revoked":
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Revoked</Badge>
    case "edited":
      return <Badge className="bg-muted text-muted-foreground border-border">Edited</Badge>
    case "config_generated":
      return <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20">Config</Badge>
    default:
      return null
  }
}

export function AnalyticsDashboard() {
  const { peers, activityLogs } = usePeers()

  const stats = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const peersThisWeek = activityLogs.filter(
      log => log.action === "added" && new Date(log.timestamp) >= weekAgo
    ).length

    const activePeersToday = peers.filter(p => {
      if (p.status !== "active" || p.lastSeen === "Never") return false
      const lastSeen = new Date(p.lastSeen)
      const today = new Date()
      return lastSeen.toDateString() === today.toDateString()
    }).length

    const revokedThisMonth = activityLogs.filter(
      log => log.action === "revoked" && new Date(log.timestamp) >= monthAgo
    ).length

    return {
      peersThisWeek,
      activePeersToday,
      revokedThisMonth,
      totalActive: peers.filter(p => p.status === "active").length
    }
  }, [peers, activityLogs])

  const maxWeeklyValue = Math.max(...weeklyPeersData.flatMap(d => [d.added, d.revoked])) || 1

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          VPN network statistics and activity overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Peers This Week
            </CardTitle>
            <UserPlus className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{stats.peersThisWeek}</span>
              <span className="text-xs text-primary flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +{stats.peersThisWeek > 0 ? Math.round((stats.peersThisWeek / 5) * 100) : 0}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">New peers added</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Today
            </CardTitle>
            <UserCheck className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-primary">{stats.activePeersToday}</span>
              <span className="text-xs text-muted-foreground">
                / {stats.totalActive} total
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Connected peers</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revoked (Month)
            </CardTitle>
            <UserX className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-destructive">{stats.revokedThisMonth}</span>
              {stats.revokedThisMonth > 2 && (
                <span className="text-xs text-warning flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  High
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Access removed</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Configs Generated
            </CardTitle>
            <Activity className="w-4 h-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{monthlyStats.configsGenerated}</span>
              <span className="text-xs text-muted-foreground">this month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Configuration downloads</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">Peer Activity</CardTitle>
                <CardDescription>Added vs revoked peers (last 7 days)</CardDescription>
              </div>
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Chart */}
              <div className="flex items-end justify-between h-32 gap-2">
                {weeklyPeersData.map((data) => (
                  <div key={data.day} className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-full flex flex-col gap-0.5 flex-1 justify-end">
                      {/* Added bar */}
                      <div
                        className="w-full bg-primary rounded-t transition-all duration-500"
                        style={{
                          height: `${(data.added / maxWeeklyValue) * 60}%`,
                          minHeight: data.added > 0 ? "4px" : "0px"
                        }}
                      />
                      {/* Revoked bar */}
                      <div
                        className="w-full bg-destructive rounded-b transition-all duration-500"
                        style={{
                          height: `${(data.revoked / maxWeeklyValue) * 60}%`,
                          minHeight: data.revoked > 0 ? "4px" : "0px"
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{data.day}</span>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded" />
                  <span className="text-xs text-muted-foreground">Added</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-destructive rounded" />
                  <span className="text-xs text-muted-foreground">Revoked</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Status */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">Network Overview</CardTitle>
                <CardDescription>Current VPN network status</CardDescription>
              </div>
              <Shield className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status indicator */}
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                <div>
                  <p className="font-medium text-primary">Network Healthy</p>
                  <p className="text-xs text-muted-foreground">All systems operational</p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-semibold">{peers.length}</p>
                  <p className="text-xs text-muted-foreground">Total Peers</p>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-semibold text-primary">
                    {peers.filter(p => p.status === "active").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-semibold">{monthlyStats.activeConnections}</p>
                  <p className="text-xs text-muted-foreground">Connections (24h)</p>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-semibold">99.9%</p>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent Peer Changes</CardTitle>
          <CardDescription>Complete activity log</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activityLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No activity recorded yet</p>
              </div>
            ) : (
              activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {getActionBadge(log.action)}
                        <span className="font-medium text-sm">{log.peerName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(log.timestamp)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(log.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

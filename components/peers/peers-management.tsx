"use client"

import { useState } from "react"
import { Plus, Search, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { usePeers, Peer } from "@/lib/peers-store"
import { PeersTable } from "./peers-table"
import { PeerFormDialog } from "./peer-form-dialog"
import { PeerConfigModal } from "./peer-config-modal"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"

export function PeersManagement() {
  const { peers } = usePeers()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "revoked">("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPeer, setEditingPeer] = useState<Peer | null>(null)
  const [configPeer, setConfigPeer] = useState<Peer | null>(null)

  const filteredPeers = peers.filter(peer => {
    const matchesSearch =
      peer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      peer.userLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      peer.tunnelIp.includes(searchQuery)

    const matchesStatus = statusFilter === "all" || peer.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Peers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage VPN peer devices and configurations
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Peer
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-primary">Zero-Trust Key Management</p>
          <p className="text-muted-foreground mt-1">
            In a zero-trust model, the client device generates its own key pair. Only the public key is shared
            with the server. When adding a peer, paste the public key provided by the client.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search peers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary/50 border-border/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-[160px] bg-secondary/50 border-border/50">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredPeers.length} of {peers.length} peers
        </p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Info className="w-4 h-4 mr-1" />
                What is a peer?
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                A peer is a device (laptop, phone, server) that connects to the VPN network.
                Each peer has a unique public key and assigned tunnel IP address.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Table */}
      <PeersTable
        peers={filteredPeers}
        onEdit={setEditingPeer}
        onViewConfig={setConfigPeer}
      />

      {/* Add/Edit Dialog */}
      <PeerFormDialog
        open={isAddDialogOpen || !!editingPeer}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false)
            setEditingPeer(null)
          }
        }}
        peer={editingPeer}
      />

      {/* Config Modal */}
      <PeerConfigModal
        peer={configPeer}
        onClose={() => setConfigPeer(null)}
      />
    </div>
  )
}

"use client"

import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Ban,
  RefreshCw,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { Peer, usePeers } from "@/lib/peers-store"
import { useToast } from "@/hooks/use-toast"

interface PeersTableProps {
  peers: Peer[]
  onEdit: (peer: Peer) => void
  onViewConfig: (peer: Peer) => void
}

function formatDate(dateString: string): string {
  if (dateString === "Never") return "Never"
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })
}

function formatLastSeen(dateString: string): string {
  if (dateString === "Never") return "Never"
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return formatDate(dateString)
}

export function PeersTable({ peers, onEdit, onViewConfig }: PeersTableProps) {
  const { revokePeer, deletePeer, reactivatePeer } = usePeers()
  const { toast } = useToast()
  const [deleteDialogPeer, setDeleteDialogPeer] = useState<Peer | null>(null)
  const [revokeDialogPeer, setRevokeDialogPeer] = useState<Peer | null>(null)

  const handleRevoke = (peer: Peer) => {
    revokePeer(peer.id)
    setRevokeDialogPeer(null)
    toast({
      title: "Peer revoked",
      description: `${peer.name} has been revoked and can no longer access the VPN.`
    })
  }

  const handleDelete = (peer: Peer) => {
    deletePeer(peer.id)
    setDeleteDialogPeer(null)
    toast({
      title: "Peer deleted",
      description: `${peer.name} has been permanently removed.`
    })
  }

  const handleReactivate = (peer: Peer) => {
    reactivatePeer(peer.id)
    toast({
      title: "Peer reactivated",
      description: `${peer.name} has been reactivated and can now access the VPN.`
    })
  }

  if (peers.length === 0) {
    return (
      <div className="border border-border/50 rounded-lg bg-card/50 p-12 text-center">
        <p className="text-muted-foreground">No peers found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search or filter criteria
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="border border-border/50 rounded-lg overflow-hidden bg-card/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Tunnel IP</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Config Type</TableHead>
              <TableHead className="text-muted-foreground hidden lg:table-cell">Last Seen</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {peers.map((peer) => (
              <TableRow key={peer.id} className="border-border/30">
                <TableCell>
                  <div>
                    <p className="font-medium">{peer.name}</p>
                    <p className="text-sm text-muted-foreground">{peer.userLabel}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-sm bg-secondary/50 px-2 py-0.5 rounded">
                    {peer.tunnelIp}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={peer.status === "active" ? "default" : "destructive"}
                    className={
                      peer.status === "active"
                        ? "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                        : "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"
                    }
                  >
                    {peer.status === "active" ? "Active" : "Revoked"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">{peer.configType}</span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {formatLastSeen(peer.lastSeen)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewConfig(peer)}>
                        <FileText className="w-4 h-4 mr-2" />
                        View Config
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(peer)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Peer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {peer.status === "active" ? (
                        <DropdownMenuItem
                          onClick={() => setRevokeDialogPeer(peer)}
                          className="text-warning focus:text-warning"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Revoke Access
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleReactivate(peer)}
                          className="text-primary focus:text-primary"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reactivate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setDeleteDialogPeer(peer)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Peer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!revokeDialogPeer} onOpenChange={() => setRevokeDialogPeer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke peer access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke VPN access for <strong>{revokeDialogPeer?.name}</strong>.
              The peer will no longer be able to connect to the network. You can reactivate them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeDialogPeer && handleRevoke(revokeDialogPeer)}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialogPeer} onOpenChange={() => setDeleteDialogPeer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete peer permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteDialogPeer?.name}</strong> and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialogPeer && handleDelete(deleteDialogPeer)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Peer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

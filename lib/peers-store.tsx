"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"

export interface Peer {
  id: string
  name: string
  userLabel: string
  publicKey: string
  tunnelIp: string
  status: "active" | "revoked"
  createdAt: string
  lastSeen: string
  configType: "Full Tunnel" | "Split Tunnel"
  notes?: string
  interfaceId?: string
}

export type CreatePeerInput = {
  name: string
  userLabel: string
  publicKey?: string
  configType: "Full Tunnel" | "Split Tunnel"
  notes?: string
  interfaceName?: string
}

export interface ActivityLog {
  id: string
  action: "added" | "revoked" | "edited" | "config_generated"
  peerName: string
  timestamp: string
}

interface PeersContextType {
  peers: Peer[]
  activityLogs: ActivityLog[]
  loading: boolean
  addPeer: (peer: CreatePeerInput) => Promise<void>
  updatePeer: (id: string, updates: Partial<Peer>) => Promise<void>
  revokePeer: (id: string) => Promise<void>
  deletePeer: (id: string) => Promise<void>
  reactivatePeer: (id: string) => Promise<void>
  logActivity: (action: ActivityLog["action"], peerName: string) => void
  refreshPeers: () => Promise<void>
}

const PeersContext = createContext<PeersContextType | undefined>(undefined)

export function PeersProvider({ children }: { children: ReactNode }) {
  const [peers, setPeers] = useState<Peer[]>([])
  const [loading, setLoading] = useState(true)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])

  const fetchPeers = useCallback(async () => {
    try {
      const res = await fetch('/api/peers')
      if (!res.ok) throw new Error("Failed to fetch peers")
      const data = await res.json()
      
      // Map API data to UI Peer type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: Peer[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        userLabel: p.userLabel || "",
        publicKey: p.publicKey,
        tunnelIp: p.tunnelIp,
        status: p.status === "ACTIVE" ? "active" : "revoked",
        createdAt: p.createdAt,
        lastSeen: p.lastSeen || "Never",
        configType: p.configType === "FULL_TUNNEL" ? "Full Tunnel" : "Split Tunnel",
        notes: p.notes || "",
        interfaceId: p.interfaceId
      }))
      setPeers(mapped)
    } catch (error) {
      console.error("Error fetching peers:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPeers()
  }, [fetchPeers])

  const refreshPeers = async () => {
    await fetchPeers()
  }

  const addPeer = async (peerData: CreatePeerInput) => {
    try {
      // Map UI types to API types
      const payload = {
        name: peerData.name,
        userLabel: peerData.userLabel,
        publicKey: peerData.publicKey,
        configType: peerData.configType === "Full Tunnel" ? "FULL_TUNNEL" : "SPLIT_TUNNEL",
        notes: peerData.notes,
        interfaceName: peerData.interfaceName
      }

      const res = await fetch('/api/peers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error("Failed to create peer")
      await fetchPeers()
      logActivity("added", peerData.name)
    } catch (error) {
      console.error("Error creating peer:", error)
      throw error
    }
  }

  const updatePeer = async (id: string, updates: Partial<Peer>) => {
    try {
      await fetch(`/api/peers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           name: updates.name,
           userLabel: updates.userLabel,
           notes: updates.notes
        })
      })
      await fetchPeers()
      if (updates.name) logActivity("edited", updates.name)
    } catch (error) {
      console.error("Error updating peer:", error)
      throw error
    }
  }

  const revokePeer = async (id: string) => {
    try {
      const peer = peers.find(p => p.id === id)
      await fetch(`/api/peers/${id}/revoke`, {
        method: 'POST'
      })
      await fetchPeers()
      if (peer) logActivity("revoked", peer.name)
    } catch (error) {
      console.error("Error revoking peer:", error)
      throw error
    }
  }

  const deletePeer = async (id: string) => {
    try {
        const peer = peers.find(p => p.id === id)
        await fetch(`/api/peers/${id}`, {
            method: 'DELETE'
        })
        await fetchPeers() // Refresh list to remove it
        if (peer) logActivity("revoked", peer.name) // Log as revoked or create new type? Using "revoked" as close enough or just log.
    } catch (error) {
        console.error("Error deleting peer:", error)
        throw error
    }
  }

  const reactivatePeer = async (id: string) => {
    try {
        const peer = peers.find(p => p.id === id)
        await fetch(`/api/peers/${id}/reactivate`, {
            method: 'POST'
        })
        await fetchPeers()
        if (peer) logActivity("edited", peer.name) // Log activity
    } catch (error) {
        console.error("Error reactivating peer:", error)
        throw error
    }
  }

  const logActivity = (action: ActivityLog["action"], peerName: string) => {
    // We could POST to a log endpoint if we wanted, but backend logs automatically.
    // We just keep local state for simple UI feedback if needed, or remove.
    // Leaving it empty or minimal.
    console.log("Activity:", action, peerName)
  }

  return (
    <PeersContext.Provider
      value={{
        peers,
        activityLogs,
        loading,
        addPeer,
        updatePeer,
        revokePeer,
        deletePeer,
        reactivatePeer,
        logActivity,
        refreshPeers
      }}
    >
      {children}
    </PeersContext.Provider>
  )
}

export function usePeers() {
  const context = useContext(PeersContext)
  if (context === undefined) {
    throw new Error("usePeers must be used within a PeersProvider")
  }
  return context
}

export function generateDummyPublicKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let key = ""
  for (let i = 0; i < 43; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key + "="
}


"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Key, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Peer, usePeers, generateDummyPublicKey } from "@/lib/peers-store"
import { useToast } from "@/hooks/use-toast"

interface PeerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  peer: Peer | null
}

export function PeerFormDialog({ open, onOpenChange, peer }: PeerFormDialogProps) {
  const { addPeer, updatePeer } = usePeers()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [userLabel, setUserLabel] = useState("")
  const [publicKey, setPublicKey] = useState("")
  const [configType, setConfigType] = useState<"Full Tunnel" | "Split Tunnel">("Full Tunnel")
  const [notes, setNotes] = useState("")
  
  // New State
  const [keyMode, setKeyMode] = useState<"auto" | "manual">("auto")
  const [selectedInterface, setSelectedInterface] = useState("")
  const [interfaces, setInterfaces] = useState<{name: string, id: string}[]>([])

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!peer

  // Fetch interfaces on open
  useEffect(() => {
    if (open && !isEditing) {
        // Fetch interfaces
        fetch('/api/interfaces').then(res => res.json()).then(data => {
            if (Array.isArray(data)) {
                setInterfaces(data);
                // Select default
                if (data.length > 0) setSelectedInterface(data[0].name);
            }
        }).catch(err => console.error("Failed to load interfaces", err));
    }
  }, [open, isEditing]);

  // Reset form when dialog opens/closes or peer changes
  useEffect(() => {
    if (open) {
      if (peer) {
        // Editing existing peer
        setName(peer.name)
        setUserLabel(peer.userLabel)
        setPublicKey(peer.publicKey)
        setConfigType(peer.configType)
        setNotes(peer.notes || "")
        setKeyMode("manual") // Always manual view for existing
      } else {
        // Adding new peer
        setName("")
        setUserLabel("")
        setPublicKey("")
        setConfigType("Full Tunnel")
        setNotes("")
        setKeyMode("auto") // Default to auto
      }
      setErrors({})
    }
  }, [open, peer])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = "Peer name is required"
    if (!userLabel.trim()) newErrors.userLabel = "User label is required"

    if (keyMode === "manual" && !publicKey.trim()) {
      newErrors.publicKey = "Public key is required in manual mode"
    } else if (keyMode === "manual" && publicKey.length < 40) {
      newErrors.publicKey = "Public key appears to be invalid"
    }
    
    // Check interface selected
    if (!isEditing && !selectedInterface) {
        // If interfaces failed to load, we might not block, but backend will use default.
        // It's better to warn?
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)

    try {
      if (isEditing && peer) {
        await updatePeer(peer.id, {
          name,
          userLabel,
          notes: notes || undefined
        })
        toast({
          title: "Peer updated",
          description: `${name} has been updated successfully.`
        })
      } else {
        await addPeer({
          name,
          userLabel,
          publicKey: keyMode === 'manual' ? publicKey : undefined, 
          configType,
          notes: notes || undefined,
          interfaceName: selectedInterface 
        })
        toast({
          title: "Peer added",
          description: `${name} has been added to the VPN network.`
        })
      }
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save peer. Please try again.",
        variant: "destructive"
      })
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateDummyKey = () => {
    setPublicKey(generateDummyPublicKey())
    setErrors(prev => ({ ...prev, publicKey: "" }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Peer" : "Add New Peer"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the peer configuration details."
              : "Add a new device to the VPN network."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Peer Name *</Label>
              <Input
                id="name"
                placeholder="e.g., John - Laptop"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setErrors(prev => ({ ...prev, name: "" }))
                }}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="userLabel">User Label *</Label>
              <Input
                id="userLabel"
                placeholder="e.g., John Doe"
                value={userLabel}
                onChange={(e) => {
                  setUserLabel(e.target.value)
                  setErrors(prev => ({ ...prev, userLabel: "" }))
                }}
                className={errors.userLabel ? "border-destructive" : ""}
              />
              {errors.userLabel && <p className="text-xs text-destructive">{errors.userLabel}</p>}
            </div>
          </div>
          
          {!isEditing && (
            <div className="space-y-2">
                 <Label htmlFor="interface">Network Interface</Label>
                 <Select value={selectedInterface} onValueChange={setSelectedInterface} disabled={interfaces.length === 0}>
                   <SelectTrigger>
                     <SelectValue placeholder="Select Interface" />
                   </SelectTrigger>
                   <SelectContent>
                     {interfaces.map(i => (
                         <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 {interfaces.length === 0 && <p className="text-xs text-muted-foreground">Loading interfaces...</p>}
            </div>
          )}

          {!isEditing && (
              <div className="space-y-2">
                <Label>Key Generation Mode</Label>
                <div className="flex gap-4">
                    <Button 
                        type="button" 
                        variant={keyMode === 'auto' ? 'default' : 'outline'} 
                        onClick={() => setKeyMode('auto')}
                        className="flex-1"
                    >
                        Auto-Generate (Server)
                    </Button>
                    <Button 
                        type="button" 
                        variant={keyMode === 'manual' ? 'default' : 'outline'} 
                        onClick={() => setKeyMode('manual')}
                        className="flex-1"
                    >
                        Manual (Client)
                    </Button>
                </div>
              </div>
          )}

          {(isEditing || keyMode === "manual") && (
            <div className="space-y-2">
                <Label htmlFor="publicKey">Public Key {keyMode === 'manual' && '*'}</Label>
                <div className="flex gap-2">
                <div className="relative flex-1">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                    id="publicKey"
                    placeholder="Paste client's public key here"
                    value={publicKey}
                    onChange={(e) => {
                        setPublicKey(e.target.value)
                        setErrors(prev => ({ ...prev, publicKey: "" }))
                    }}
                    disabled={isEditing}
                    className={`pl-9 font-mono text-sm ${errors.publicKey ? "border-destructive" : ""}`}
                    />
                </div>
                {!isEditing && (
                    <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateDummyKey}
                    className="shrink-0 bg-transparent"
                    >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Demo Key
                    </Button>
                )}
                </div>
                {errors.publicKey && <p className="text-xs text-destructive">{errors.publicKey}</p>}
            </div>
          )}

          {!isEditing && (
             <div className="space-y-2">
                <Label htmlFor="configType">Config Type</Label>
                <Select value={configType} onValueChange={(v) => setConfigType(v as typeof configType)}>
                  <SelectTrigger id="configType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Tunnel">
                      Full Tunnel - All traffic through VPN
                    </SelectItem>
                    <SelectItem value="Split Tunnel">
                      Split Tunnel - Only internal traffic
                    </SelectItem>
                  </SelectContent>
                </Select>
             </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this peer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Peer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


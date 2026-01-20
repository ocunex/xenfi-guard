"use client"

import { useState, useEffect } from "react"
import { Copy, Download, QrCode, FileText, Check, Smartphone, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Peer, usePeers } from "@/lib/peers-store"
import { useToast } from "@/hooks/use-toast"

interface PeerConfigModalProps {
  peer: Peer | null
  onClose: () => void
}

import QRCode from "react-qr-code"

// ... (existing imports, but removed the internal QRCodeDisplay function)

export function PeerConfigModal({ peer, onClose }: PeerConfigModalProps) {
  const { logActivity } = usePeers()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("qr")
  const [configText, setConfigText] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (peer) {
        setLoading(true)
        setError(null)
        setConfigText("")
        fetch(`/api/peers/${peer.id}/config`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch config")
                return res.json()
            })
            .then(data => {
                setConfigText(data.configText)
            })
            .catch(err => {
                console.error(err)
                setError("Failed to load configuration")
            })
            .finally(() => setLoading(false))
    }
  }, [peer])

  if (!peer) return null

  const handleCopy = async () => {
    if (!configText) return
    await navigator.clipboard.writeText(configText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Copied to clipboard",
      description: "The config has been copied to your clipboard."
    })
  }

  const handleDownload = () => {
    if (!configText) return
    const blob = new Blob([configText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${peer.name.toLowerCase().replace(/\s+/g, "-")}.conf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    logActivity("config_generated", peer.name)

    toast({
      title: "Config downloaded",
      description: `${peer.name}.conf has been downloaded.`
    })
  }

  return (
    <Dialog open={!!peer} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>Configuration for {peer.name}</DialogTitle>
            <Badge
              variant={peer.status === "active" ? "default" : "destructive"}
              className={
                peer.status === "active"
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }
            >
              {peer.status}
            </Badge>
          </div>
          <DialogDescription>
            WireGuard configuration for {peer.userLabel} ({peer.tunnelIp})
          </DialogDescription>
        </DialogHeader>

        {loading ? (
             <div className="py-12 flex justify-center">
                 <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
        ) : error ? (
            <div className="py-8 text-center text-destructive">
                {error}
            </div>
        ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qr" className="gap-2">
              <QrCode className="w-4 h-4" />
              QR Code
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <FileText className="w-4 h-4" />
              Config File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="mt-4 space-y-4">
            <div className="relative">
              <pre className="p-4 bg-secondary/50 rounded-lg text-sm font-mono overflow-auto border border-border/50 max-h-[300px] whitespace-pre-wrap break-all">
                {configText}
              </pre>
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleCopy}
                  className="h-8"
                  disabled={!configText}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <p className="text-sm text-warning font-medium">Important: Zero-Trust Notice</p>
              <p className="text-sm text-muted-foreground mt-1">
                The PrivateKey must be generated on the client device and inserted into this config locally.
                Never share your private key. Only the public key should be shared with the server.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCopy} disabled={!configText}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Config
              </Button>
              <Button onClick={handleDownload} disabled={!configText}>
                <Download className="w-4 h-4 mr-2" />
                Download .conf
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="mt-4 space-y-4">
            <div className="flex flex-col items-center gap-6 py-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-border/50">
                  {configText ? (
                    <QRCode
                      value={configText}
                      size={200}
                      level="M"
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                    />
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center">
                       <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>

              <div className="text-center max-w-sm">
                <div className="flex items-center justify-center gap-2 text-sm font-medium mb-2">
                  <Smartphone className="w-4 h-4" />
                  Scan with WireGuard Mobile App
                </div>
                <p className="text-sm text-muted-foreground">
                  Open the WireGuard app on your mobile device, tap the + button, and select
                  &ldquo;Create from QR code&rdquo; to import this configuration.
                </p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 w-full">
                <p className="text-sm text-primary font-medium">Note</p>
                <p className="text-sm text-muted-foreground mt-1">
                  After scanning, you will need to manually add your private key in the app.
                  The QR code contains a placeholder for security reasons.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        )}

        <div className="pt-4 border-t border-border/50 mt-4">
          <h4 className="text-sm font-medium mb-2">Peer Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Config Type:</span>
              <span className="ml-2 font-medium">{peer.configType}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tunnel IP:</span>
              <code className="ml-2 bg-secondary px-1.5 py-0.5 rounded text-xs">
                {peer.tunnelIp}
              </code>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Public Key:</span>
              <code className="ml-2 bg-secondary px-1.5 py-0.5 rounded text-xs break-all">
                {peer.publicKey}
              </code>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


 "use client"

import { AppShell } from "@/components/layout/app-shell"
import { PeersManagement } from "@/components/peers/peers-management"

export default function PeersPage() {
  return (
    <AppShell>
      <PeersManagement />
    </AppShell>
  )
}

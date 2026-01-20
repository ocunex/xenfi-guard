"use client"

import { AppShell } from "@/components/layout/app-shell"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"

export default function AnalyticsPage() {
  return (
    <AppShell>
      <AnalyticsDashboard />
    </AppShell>
  )
}

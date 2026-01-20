
import { InterfacesTable } from "@/components/interfaces/interfaces-table";
import { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Interfaces | XenFi Guard",
  description: "Manage WireGuard Interfaces",
};

export default function InterfacesPage() {
  return (
    <AppShell>
        <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Interfaces</h2>
            <div className="flex items-center space-x-2">
                {/* Optional Actions */}
            </div>
        </div>
        <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
            <InterfacesTable />
        </div>
        </div>
    </AppShell>
  );
}


"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal, Plus, Trash, Settings, Server, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { InterfaceFormDialog } from "./interface-form-dialog"

// Define shape based on Prisma model + count
export type WireGuardInterface = {
  id: string
  name: string
  listenPort: number
  tunnelCidr: string
  endpointHost?: string | null
  serverTunnelIp: string
  defaultDns: string
  publicKey: string
  _count: {
      peers: number
  }
  updatedAt: string
}

export function InterfacesTable() {
  const [data, setData] = React.useState<WireGuardInterface[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  
  const [showAddDialog, setShowAddDialog] = React.useState(false)
  const [editingInterface, setEditingInterface] = React.useState<WireGuardInterface | null>(null)

  const fetchInterfaces = React.useCallback(async () => {
    try {
        const res = await fetch('/api/interfaces');
        if (res.ok) {
            const json = await res.json();
            setData(json);
        }
    } catch (e) {
        console.error(e);
        toast.error("Failed to load interfaces");
    } finally {
        setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInterfaces();
  }, [fetchInterfaces]);

  const handleDelete = async (inter: WireGuardInterface) => {
      // Check for default interface client-side as check first, backup by API
      // But API handles logic.
      if (!confirm(`Are you sure you want to delete ${inter.name}?`)) return;

      try {
          const res = await fetch(`/api/interfaces/${inter.id}`, { method: 'DELETE' });
          const json = await res.json();
          if (!res.ok) {
              toast.error(json.error || "Failed to delete");
              return;
          }
          toast.success("Interface deleted");
          fetchInterfaces();
      } catch(e) {
          toast.error("Error deleting interface");
      }
  };

  const columns: ColumnDef<WireGuardInterface>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="font-medium flex items-center gap-2"><Shield className="h-4 w-4 text-primary"/> {row.getValue("name")}</div>,
    },
    {
      accessorKey: "listenPort",
      header: "Port",
      cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("listenPort")}</div>,
    },
    {
      accessorKey: "tunnelCidr",
      header: "CIDR",
      cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("tunnelCidr")}</div>,
    },
    {
      accessorKey: "endpointHost",
      header: "Endpoint",
      cell: ({ row }) => <div className="">{row.getValue("endpointHost") || "-"}</div>,
    },
    {
        accessorKey: "_count.peers",
        header: "Peers",
        cell: ({ row }) => <Badge variant="secondary">{row.original._count.peers} Active</Badge>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const inter = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => { setEditingInterface(inter); setShowAddDialog(true); }}>
                Edit Configuration
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(inter)} className="text-destructive">
                Delete Interface
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">WireGuard Interfaces</h2>
            <Badge variant="outline" className="text-xs">{data.length}</Badge>
         </div>
         <Button onClick={() => { setEditingInterface(null); setShowAddDialog(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Interface
         </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No interfaces found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <InterfaceFormDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        initialData={editingInterface}
        onSuccess={() => { setShowAddDialog(false); fetchInterfaces(); }}
      />
    </div>
  )
}

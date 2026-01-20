
"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { WireGuardInterface } from "./interfaces-table"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  listenPort: z.coerce.number().min(1024).max(65535),
  tunnelCidr: z.string().min(1, "CIDR is required"),
  serverTunnelIp: z.string().min(1, "Server IP is required"),
  defaultDns: z.string().min(1, "DNS is required"),
  defaultKeepalive: z.coerce.number().min(0).default(25),
  endpointHost: z.string().optional(),
})

interface InterfaceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: WireGuardInterface | null
  onSuccess: () => void
}

export function InterfaceFormDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: InterfaceFormDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      listenPort: 51820,
      tunnelCidr: "10.77.77.0/24",
      serverTunnelIp: "10.77.77.1",
      defaultDns: "1.1.1.1",
      defaultKeepalive: 25,
      endpointHost: "",
    },
  })

  React.useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name,
          listenPort: initialData.listenPort,
          tunnelCidr: initialData.tunnelCidr,
          serverTunnelIp: initialData.serverTunnelIp,
          defaultDns: initialData.defaultDns,
          defaultKeepalive: 25, // default if missing in type or fetched data doesn't have it?
          endpointHost: initialData.endpointHost || "",
        });
        // We might want to lock Name editing for RouterOS consistency or show warning that it creates NEW one?
        // Usually name changes on RouterOS are tricky if dependent peers exist.
      } else {
        form.reset({
          name: "",
          listenPort: 51820,
          tunnelCidr: "10.77.77.0/24",
          serverTunnelIp: "10.77.77.1",
          defaultDns: "1.1.1.1",
          defaultKeepalive: 25,
          endpointHost: "",
        })
      }
    }
  }, [initialData, open, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = initialData ? `/api/interfaces/${initialData.id}` : '/api/interfaces';
      const method = initialData ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save interface");
      }

      toast.success(initialData ? "Interface updated" : "Interface created");
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Interface" : "Add Interface"}</DialogTitle>
          <DialogDescription>
            Configure the WireGuard interface. This will sync with RouterOS.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interface Name</FormLabel>
                  <FormControl>
                    <Input placeholder="wg0" {...field} disabled={!!initialData} />
                  </FormControl>
                  {initialData && <FormDescription>Name cannot be changed after creation.</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="listenPort"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Listen Port</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="defaultKeepalive"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Keepalive (s)</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="tunnelCidr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tunnel CIDR</FormLabel>
                  <FormControl>
                    <Input placeholder="10.77.77.0/24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="serverTunnelIp"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Server Tunnel IP</FormLabel>
                    <FormControl>
                        <Input placeholder="10.77.77.1" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="defaultDns"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Default DNS</FormLabel>
                    <FormControl>
                        <Input placeholder="1.1.1.1" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="endpointHost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Public Endpoint Host</FormLabel>
                  <FormControl>
                    <Input placeholder="vpn.example.com" {...field} />
                  </FormControl>
                  <FormDescription>The public DNS or IP clients connect to.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

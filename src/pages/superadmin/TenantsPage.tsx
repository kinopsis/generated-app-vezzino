import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, MoreHorizontal, FilePen, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Tenant } from "@shared/types";
import { toast } from "sonner";
import { TenantDialog } from "@/components/superadmin/TenantDialog";
export default function TenantsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: () => api('/api/superadmin/tenants'),
  });
  const createMutation = useMutation({
    mutationFn: (newTenant: Omit<Tenant, 'id' | 'created_at'>) => api('/api/superadmin/tenants', {
      method: 'POST',
      body: JSON.stringify(newTenant),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success("Tenant created successfully!");
      setIsDialogOpen(false);
    },
    onError: (err) => toast.error(`Failed to create tenant: ${err.message}`),
  });
  const updateMutation = useMutation({
    mutationFn: (tenant: Tenant) => api(`/api/superadmin/tenants/${tenant.id}`, {
      method: 'PUT',
      body: JSON.stringify(tenant),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success("Tenant updated successfully!");
      setIsDialogOpen(false);
      setEditingTenant(null);
    },
    onError: (err) => toast.error(`Failed to update tenant: ${err.message}`),
  });
  const deleteMutation = useMutation({
    mutationFn: (tenantId: string) => api(`/api/superadmin/tenants/${tenantId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success("Tenant deleted successfully!");
    },
    onError: (err) => toast.error(`Failed to delete tenant: ${err.message}`),
  });
  const handleSave = (data: any) => {
    if (editingTenant) {
      updateMutation.mutate({ ...editingTenant, ...data });
    } else {
      createMutation.mutate(data);
    }
  };
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
            <p className="text-muted-foreground">Oversee all organizations using the platform.</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <PlusCircle className="mr-2 h-5 w-5" />
            New Tenant
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Tenants</CardTitle>
            <CardDescription>A list of all tenant organizations.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants?.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>{tenant.domain || 'N/A'}</TableCell>
                      <TableCell><Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>{tenant.status}</Badge></TableCell>
                      <TableCell>{new Date(tenant.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingTenant(tenant); setIsDialogOpen(true); }}><FilePen className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate(tenant.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <TenantDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setEditingTenant(null); }}
        onSave={handleSave}
        tenant={editingTenant}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </AppLayout>
  );
}
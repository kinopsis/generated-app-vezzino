import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, Search, MoreHorizontal, FilePen, Trash2, PlayCircle, Loader2, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Assembly } from "@shared/types";
import { CreateAssemblyDialog } from "@/components/assemblies/CreateAssemblyDialog";
import { toast } from "sonner";
export default function AssembliesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: assemblies, isLoading, error } = useQuery<Assembly[]>({
    queryKey: ['assemblies'],
    queryFn: () => api('/api/assemblies'),
  });

  const filteredAssemblies = assemblies?.filter(assembly =>
    assembly.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const createAssemblyMutation = useMutation({
    mutationFn: (newAssembly: any) => api('/api/assemblies', {
      method: 'POST',
      body: JSON.stringify(newAssembly),
    }),
    onSuccess: (data: Assembly) => {
      queryClient.invalidateQueries({ queryKey: ['assemblies'] });
      toast.success("Assembly created successfully!");
      setIsCreateOpen(false);
      navigate(`/assemblies/${data.id}/setup`);
    },
    onError: (err) => {
      toast.error(`Failed to create assembly: ${err.message}`);
    }
  });

  const deleteAssemblyMutation = useMutation({
    mutationFn: (assemblyId: string) => api(`/api/assemblies/${assemblyId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assemblies'] });
      toast.success("Assembly deleted successfully!");
    },
    onError: (err) => {
      toast.error(`Failed to delete assembly: ${err.message}`);
    }
  });
  const handleCreateAssembly = (data: any) => {
    createAssemblyMutation.mutate(data);
  };
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Assembly Management</h1>
              <p className="text-muted-foreground">Create, monitor, and review all your assemblies.</p>
            </div>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsCreateOpen(true)}>
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Assembly
            </Button>
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Assemblies</CardTitle>
                  <CardDescription>Browse and manage your organization's assemblies.</CardDescription>
                </div>
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assemblies..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="text-center text-red-500">Failed to load assemblies.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Polls</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssemblies?.map((assembly) => (
                      <TableRow key={assembly.id}>
                        <TableCell className="font-medium">{assembly.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={assembly.status === 'Active' ? 'default' : assembly.status === 'Completed' ? 'secondary' : 'outline'}
                            className={assembly.status === 'Active' ? 'bg-green-600 text-white animate-pulse' : ''}
                          >
                            {assembly.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{assembly.polls?.length || 0}</TableCell>
                        <TableCell>{new Date(assembly.scheduled_start).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => navigate(`/assemblies/${assembly.id}/setup`)}>
                                <Settings2 className="mr-2 h-4 w-4" />
                                Configure
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/assemblies/${assembly.id}`)}>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                {assembly.status === 'Active' ? 'Join Control Panel' : 'View Details'}
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled>
                                <FilePen className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete "${assembly.name}"?`)) {
                                    deleteAssemblyMutation.mutate(assembly.id);
                                  }
                                }}
                                disabled={deleteAssemblyMutation.isPending}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
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
      </div>
      <CreateAssemblyDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreateAssembly}
        isSaving={createAssemblyMutation.isPending}
      />
    </AppLayout>
  );
}
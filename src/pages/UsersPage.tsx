import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, Search, MoreHorizontal, FilePen, Trash2, Upload, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { User } from "@shared/types";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { ImportUsersDialog } from "@/components/users/ImportUsersDialog";
import { toast } from "sonner";
export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isImportUserOpen, setIsImportUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api('/api/users'),
  });
  const createMutation = useMutation({
    mutationFn: (newUser: Omit<User, 'id' | 'tenant_id' | 'status' | 'created_at'>) => api('/api/users', {
      method: 'POST',
      body: JSON.stringify(newUser),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("User created successfully!");
      setIsAddUserOpen(false);
    },
    onError: (err) => {
      toast.error(`Failed to create user: ${err.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (userToUpdate: User) => api(`/api/users/${userToUpdate.id}`, {
      method: 'PUT',
      body: JSON.stringify(userToUpdate),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("User updated successfully!");
      setIsAddUserOpen(false);
      setEditingUser(null);
    },
    onError: (err) => {
      toast.error(`Failed to update user: ${err.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api(`/api/users/${userId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("User deleted successfully!");
    },
    onError: (err) => {
      toast.error(`Failed to delete user: ${err.message}`);
    }
  });

  const handleSaveUser = (data: any) => {
    if (editingUser) {
      updateMutation.mutate({ ...editingUser, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteMutation.mutate(userId);
    }
  };
  const importMutation = useMutation({
    mutationFn: (users: any[]) => api('/api/users/batch', {
      method: 'POST',
      body: JSON.stringify(users),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Users imported successfully!");
      setIsImportUserOpen(false);
    },
    onError: (err) => {
      toast.error(`Failed to import users: ${err.message}`);
    }
  });

  const handleImportUsers = async (importedUsers: any[]) => {
    const usersToImport = importedUsers.map(user => ({
      full_name: user.full_name,
      email: user.email,
      coefficient: parseFloat(user.coefficient) || 1.0,
      role: user.role || 'Voter',
    }));
    await importMutation.mutateAsync(usersToImport);
  };
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
              <p className="text-muted-foreground">Manage your organization's members, roles, and coefficients.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsImportUserOpen(true)}>
                <Upload className="mr-2 h-5 w-5" />
                Import CSV
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsAddUserOpen(true)}>
                <PlusCircle className="mr-2 h-5 w-5" />
                Add User
              </Button>
            </div>
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>A list of all users in your organization.</CardDescription>
                </div>
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search users..." className="pl-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="text-center text-red-500">Failed to load users.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Coefficient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'Admin' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>{user.coefficient.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                            {user.status}
                          </div>
                        </TableCell>
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
                              <DropdownMenuItem onClick={() => { setEditingUser(user); setIsAddUserOpen(true); }}>
                                <FilePen className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
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
      <AddUserDialog
        isOpen={isAddUserOpen}
        onClose={() => { setIsAddUserOpen(false); setEditingUser(null); }}
        onSave={handleSaveUser}
        user={editingUser}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
      <ImportUsersDialog
        isOpen={isImportUserOpen}
        onClose={() => setIsImportUserOpen(false)}
        onImport={handleImportUsers}
        isImporting={importMutation.isPending}
      />
    </AppLayout>
  );
}
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PollEditor } from "@/components/assemblies/PollEditor";
import { PlusCircle, Edit, Trash2, Loader2, ArrowLeft, Play, Download } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Assembly, Poll, Proxy, User } from "@shared/types";
import { toast } from "sonner";
import { ProxyDialog } from "@/components/assemblies/ProxyDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
export default function AssemblySetupPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditingPoll, setIsEditingPoll] = useState<Poll | null | boolean>(false);
  const [isProxyDialogOpen, setIsProxyDialogOpen] = useState(false);
  const [assemblyDetails, setAssemblyDetails] = useState<Partial<Assembly>>({});
  const { data: assembly, isLoading, error } = useQuery<Assembly>({
    queryKey: ['assembly', id],
    queryFn: () => api(`/api/assemblies/${id}`),
    enabled: !!id,
  });
  useEffect(() => {
    if (assembly) {
      setAssemblyDetails({
        name: assembly.name,
        description: assembly.description,
        scheduled_start: assembly.scheduled_start,
      });
    }
  }, [assembly]);
  const { data: proxies } = useQuery<Proxy[]>({
    queryKey: ['proxies', id],
    queryFn: () => api(`/api/assemblies/${id}/proxies`),
    enabled: !!id,
  });
  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api('/api/users'),
  });
  const usersById = new Map(users?.map(u => [u.id, u]));
  const updateAssemblyMutation = useMutation({
    mutationFn: (updatedAssembly: Partial<Assembly>) => api(`/api/assemblies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedAssembly),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assembly', id] });
      toast.success("Assembly updated successfully!");
      setIsEditingPoll(false);
    },
    onError: (err) => toast.error(`Update failed: ${err.message}`),
  });
  const startAssemblyMutation = useMutation({
    mutationFn: () => api(`/api/assemblies/${id}/start`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assembly', id] });
      toast.success("Assembly started!");
      navigate(`/assemblies/${id}`);
    },
    onError: (err) => toast.error(`Failed to start assembly: ${err.message}`),
  });
  const createProxyMutation = useMutation({
    mutationFn: (proxyData: { delegator_id: string, delegate_id: string }) => api(`/api/assemblies/${id}/proxies`, {
      method: 'POST',
      body: JSON.stringify(proxyData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxies', id] });
      toast.success("Proxy created successfully!");
      setIsProxyDialogOpen(false);
    },
    onError: (err) => toast.error(`Failed to create proxy: ${err.message}`),
  });
  const deleteProxyMutation = useMutation({
    mutationFn: (proxyId: string) => api(`/api/assemblies/${id}/proxies/${proxyId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxies', id] });
      toast.success("Proxy delegation removed.");
    },
    onError: (err) => toast.error(`Failed to remove proxy: ${err.message}`),
  });
  const handleSavePoll = (poll: Poll) => {
    if (!assembly) return;
    const existingPollIndex = assembly.polls?.findIndex(p => p.id === poll.id);
    let updatedPolls: Poll[];
    if (existingPollIndex > -1) {
      updatedPolls = [...assembly.polls!];
      updatedPolls[existingPollIndex] = poll;
    } else {
      updatedPolls = [...(assembly.polls || []), poll];
    }
    updateAssemblyMutation.mutate({ ...assembly, polls: updatedPolls });
  };
  const handleDeletePoll = (pollId: string) => {
    if (!assembly) return;
    const updatedPolls = assembly.polls?.filter(p => p.id !== pollId);
    updateAssemblyMutation.mutate({ polls: updatedPolls }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['assembly', id] });
        toast.success("Poll deleted successfully!");
      }
    });
  };
  const handleSaveChanges = () => {
    updateAssemblyMutation.mutate(assemblyDetails, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['assembly', id] });
        toast.success("Assembly details updated successfully!");
      }
    });
  };
  if (isLoading) {
    return <AppLayout><div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div></AppLayout>;
  }
  if (error || !assembly) {
    return <AppLayout><div className="text-center text-red-500 py-20">Failed to load assembly data.</div></AppLayout>;
  }
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10">
          <Button variant="ghost" onClick={() => navigate('/assemblies')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assemblies
          </Button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{assembly.name}</h1>
              <p className="text-muted-foreground">Configure your assembly details and polls.</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg">{assembly.status}</Badge>
              {assembly.status !== 'Active' && assembly.status !== 'Completed' && (
                <Button onClick={() => startAssemblyMutation.mutate()} disabled={startAssemblyMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
                  <Play className="mr-2 h-4 w-4" />
                  {startAssemblyMutation.isPending ? "Starting..." : "Start Assembly"}
                </Button>
              )}
              {assembly.status === 'Completed' && (
                <Button asChild variant="outline">
                  <a href={`/api/assemblies/${id}/export`} download>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </a>
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Polls</CardTitle>
                      <CardDescription>Manage the polls for this assembly.</CardDescription>
                    </div>
                    <Button onClick={() => setIsEditingPoll(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Poll
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditingPoll ? (
                    <PollEditor
                      poll={typeof isEditingPoll === 'object' ? isEditingPoll : undefined}
                      onSave={handleSavePoll}
                      onCancel={() => setIsEditingPoll(false)}
                      isSaving={updateAssemblyMutation.isPending}
                    />
                  ) : (
                    <div className="space-y-4">
                      {assembly.polls.length > 0 ? (
                        assembly.polls.map(poll => (
                          <div key={poll.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">{poll.title}</p>
                              <p className="text-sm text-muted-foreground">{poll.options.length} options</p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="icon" onClick={() => setIsEditingPoll(poll)}><Edit className="h-4 w-4" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete the poll "{poll.title}". This action cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeletePoll(poll.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                          <h3 className="text-lg font-medium">No polls yet</h3>
                          <p className="text-muted-foreground">Click "Add Poll" to get started.</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Proxy Voting</CardTitle>
                      <CardDescription>Manage vote delegations for this assembly.</CardDescription>
                    </div>
                    <Button onClick={() => setIsProxyDialogOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Proxy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {proxies && proxies.length > 0 ? (
                      proxies.map(proxy => (
                        <div key={proxy.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <p><span className="font-medium">{usersById.get(proxy.delegator_id)?.full_name}</span> delegates to <span className="font-medium">{usersById.get(proxy.delegate_id)?.full_name}</span></p>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will remove the proxy delegation. This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteProxyMutation.mutate(proxy.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 border-2 border-dashed rounded-lg">
                        <h3 className="text-lg font-medium">No proxies assigned</h3>
                        <p className="text-muted-foreground">Click "Add Proxy" to create a delegation.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Assembly Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input
                      value={assemblyDetails.name || ''}
                      onChange={(e) => setAssemblyDetails(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Textarea
                      value={assemblyDetails.description || ''}
                      onChange={(e) => setAssemblyDetails(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Scheduled Start</Label>
                    <Input
                      type="datetime-local"
                      value={assemblyDetails.scheduled_start ? new Date(assemblyDetails.scheduled_start).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setAssemblyDetails(prev => ({ ...prev, scheduled_start: new Date(e.target.value).getTime() }))}
                    />
                  </div>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={updateAssemblyMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {updateAssemblyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <ProxyDialog
        isOpen={isProxyDialogOpen}
        onClose={() => setIsProxyDialogOpen(false)}
        onSave={(data) => createProxyMutation.mutate(data)}
        isSaving={createProxyMutation.isPending}
      />
    </AppLayout>
  );
}
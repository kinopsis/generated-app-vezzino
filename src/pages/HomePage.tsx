import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Gavel, PlusCircle, Users, CheckSquare, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Assembly, User } from "@shared/types";
export function HomePage() {
  const navigate = useNavigate();
  const { data: assemblies, isLoading: isLoadingAssemblies } = useQuery<Assembly[]>({
    queryKey: ['assemblies'],
    queryFn: () => api('/api/assemblies'),
  });
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api('/api/users'),
  });
  const recentAssemblies = assemblies?.slice(0, 3) || [];
  const upcomingAssemblies = assemblies?.filter(a => a.status === 'Scheduled' || a.status === 'Draft').length || 0;
  const totalVotes = 0; // This would require more complex aggregation
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back! Here's a summary of your organization's activity.</p>
            </div>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate('/assemblies')}>
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Assembly
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <StatCard title="Upcoming Assemblies" value={isLoadingAssemblies ? "..." : upcomingAssemblies.toString()} icon={Gavel} description="Scheduled for the future" />
            <StatCard title="Total Users" value={isLoadingUsers ? "..." : (users?.length || 0).toString()} icon={Users} description="Active voters and admins" />
            <StatCard title="Completed Votes" value={totalVotes.toString()} icon={CheckSquare} description="Across all past assemblies" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Assemblies</CardTitle>
              <CardDescription>A quick look at your most recent assembly activities.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAssemblies ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assembly Name</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Polls</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAssemblies.map((assembly) =>
                    <TableRow key={assembly.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/assemblies/${assembly.id}/setup`)}>
                        <TableCell className="font-medium">{assembly.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                          variant={
                          assembly.status === 'Active' ? 'default' :
                          assembly.status === 'Completed' ? 'secondary' : 'outline'
                          }
                          className={
                          assembly.status === 'Active' ? 'bg-green-600 text-white' : ''
                          }>
                            {assembly.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{assembly.polls.length}</TableCell>
                        <TableCell className="text-right">{new Date(assembly.scheduled_start).toLocaleDateString()}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>);
}
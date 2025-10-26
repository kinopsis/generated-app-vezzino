import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { VideoPanel } from "@/components/assembly/VideoPanel";
import { ParticipantList } from "@/components/assembly/ParticipantList";
import { QuorumStatus } from "@/components/assembly/QuorumStatus";
import { PollCard } from "@/components/assembly/PollCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Power, Loader2, Users } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Assembly, AssemblyState } from "@shared/types";
import { toast } from "sonner";
import { AdminPollManager } from "@/components/assembly/AdminPollManager";
import { MobileParticipantSheet } from "@/components/assembly/MobileParticipantSheet";
import { useAuthStore } from "@/stores/auth.store";
export default function LiveAssemblyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'Admin';
  const [isParticipantSheetOpen, setParticipantSheetOpen] = useState(false);
  const { data: assembly, isLoading: isLoadingAssembly } = useQuery<Assembly>({
    queryKey: ['assembly', id],
    queryFn: () => api(`/api/assemblies/${id}`),
    enabled: !!id,
  });
  const { data: liveState } = useQuery<AssemblyState>({
    queryKey: ['assemblyState', id],
    queryFn: () => api(`/api/assemblies/${id}/state`),
    enabled: !!id && assembly?.status === 'Active',
    refetchInterval: 3000,
  });
  const { mutate: joinAssembly } = useMutation({
    mutationFn: () => api(`/api/assemblies/${id}/join`, { method: 'POST', body: JSON.stringify({ userId: user?.id }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assemblyState', id] });
    },
  });
  const endAssemblyMutation = useMutation({
    mutationFn: () => api(`/api/assemblies/${id}/end`, { method: 'POST' }),
    onSuccess: () => {
      toast.success("Assembly has been ended.");
      queryClient.invalidateQueries({ queryKey: ['assemblies'] });
      queryClient.invalidateQueries({ queryKey: ['assembly', id] });
      navigate(`/assemblies`);
    },
    onError: (err) => toast.error(`Failed to end assembly: ${err.message}`),
  });
  const pollControlMutation = useMutation({
    mutationFn: ({ pollId, action }: { pollId: string, action: 'activate' | 'close' }) =>
      api(`/api/assemblies/${id}/polls/${pollId}/${action}`, { method: 'POST' }),
    onSuccess: () => {
      toast.success(`Poll action successful!`);
      queryClient.invalidateQueries({ queryKey: ['assemblyState', id] });
    },
    onError: (err) => toast.error(`Poll action failed: ${err.message}`),
  });
  useEffect(() => {
    if (id && assembly?.status === 'Active' && user?.id) {
      joinAssembly();
    }
  }, [id, assembly?.status, user?.id, joinAssembly]);
  if (isLoadingAssembly || !assembly) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-12 w-12 animate-spin" />
        </div>
      </AppLayout>
    );
  }
  const activePoll = assembly.polls.find(p => p.id === liveState?.active_poll_id) || null;
  return (
    <AppLayout container={false} className="bg-secondary/40">
      <div className="h-screen w-full flex flex-col p-2 sm:p-4 gap-4">
        <header className="flex-shrink-0 bg-card rounded-lg p-3 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold">{assembly.name}</h1>
            <div className="flex items-center gap-2">
              <Badge className={assembly.status === 'Active' ? "bg-green-600 text-white animate-pulse" : "bg-gray-500 text-white"}>{assembly.status}</Badge>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {assembly.status === 'Active' ? `Live since ${new Date(assembly.scheduled_start).toLocaleTimeString()}` : `Completed`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" className="lg:hidden" size="icon" onClick={() => setParticipantSheetOpen(true)}>
                <Users className="h-5 w-5" />
              </Button>
            )}
            {isAdmin && assembly.status === 'Active' && (
              <Button variant="destructive" onClick={() => endAssemblyMutation.mutate()} disabled={endAssemblyMutation.isPending}>
                {endAssemblyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Power className="mr-2 h-4 w-4" />}
                <span className="hidden sm:inline">End Assembly</span>
              </Button>
            )}
          </div>
        </header>
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
          <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
            <div className="flex-1 min-h-0">
              <VideoPanel participants={liveState?.participants || []} />
            </div>
            <div className="flex-shrink-0">
              {liveState ? (
                <QuorumStatus
                  presentCoefficient={liveState.present_coefficient}
                  totalCoefficient={liveState.total_coefficient}
                  quorumRequired={assembly.quorum_required}
                />
              ) : <Loader2 className="mx-auto h-6 w-6 animate-spin" />}
            </div>
          </div>
          <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden">
            {isAdmin ? (
              <>
                <div className="flex-1 min-h-0">
                  <AdminPollManager
                    assemblyId={id!}
                    polls={assembly.polls}
                    liveState={liveState}
                    onActivatePoll={(pollId) => pollControlMutation.mutate({ pollId, action: 'activate' })}
                    onClosePoll={(pollId) => pollControlMutation.mutate({ pollId, action: 'close' })}
                  />
                </div>
                <div className="hidden lg:block flex-1 min-h-0">
                  {liveState ? (
                    <ParticipantList participants={liveState.participants} />
                  ) : <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin" />}
                </div>
              </>
            ) : (
              <>
                <div className="hidden lg:block flex-1 min-h-0">
                  {liveState ? (
                    <ParticipantList participants={liveState.participants} />
                  ) : <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin" />}
                </div>
                <div className="flex-1 lg:flex-shrink-0 min-h-0">
                  <PollCard
                    isAdmin={false}
                    assemblyId={id!}
                    activePoll={activePoll}
                    liveState={liveState}
                    onClosePoll={() => {}}
                  />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
      {isAdmin && liveState && (
        <MobileParticipantSheet
          isOpen={isParticipantSheetOpen}
          onClose={() => setParticipantSheetOpen(false)}
          participants={liveState.participants}
        />
      )}
    </AppLayout>
  );
}
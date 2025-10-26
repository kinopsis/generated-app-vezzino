import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Square, BarChart2, Loader2 } from "lucide-react";
import type { Poll, AssemblyState, PollResult } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { PollResultsDialog } from "./PollResultsDialog";
interface AdminPollManagerProps {
  assemblyId: string;
  polls: Poll[];
  liveState: AssemblyState | undefined;
  onActivatePoll: (pollId: string) => void;
  onClosePoll: (pollId: string) => void;
}
export function AdminPollManager({ assemblyId, polls, liveState, onActivatePoll, onClosePoll }: AdminPollManagerProps) {
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const { data: pollResult, isLoading: isLoadingResult } = useQuery<PollResult>({
    queryKey: ['pollResult', assemblyId, selectedPollId],
    queryFn: () => api(`/api/assemblies/${assemblyId}/polls/${selectedPollId}/results`),
    enabled: !!selectedPollId,
  });
  const handleShowResults = (pollId: string) => {
    setSelectedPollId(pollId);
  };
  return (
    <>
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle>Poll Management</CardTitle>
          <CardDescription>Control the flow of voting during the assembly.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-2 p-4 pt-0">
              {polls.length > 0 ? polls.map((poll) => {
                const isActive = liveState?.active_poll_id === poll.id;
                return (
                  <div key={poll.id} className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-accent transition-colors">
                    <div>
                      <p className="font-medium">{poll.title}</p>
                      <p className="text-sm text-muted-foreground">{poll.options.length} options</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <Button variant="destructive" size="sm" onClick={() => onClosePoll(poll.id)}>
                          <Square className="mr-2 h-4 w-4" />
                          Close
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => onActivatePoll(poll.id)} disabled={!!liveState?.active_poll_id}>
                          <Play className="mr-2 h-4 w-4" />
                          Activate
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleShowResults(poll.id)}>
                        {isLoadingResult && selectedPollId === poll.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart2 className="mr-2 h-4 w-4" />}
                        Results
                      </Button>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-10 text-muted-foreground">
                  <p>No polls configured for this assembly.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <PollResultsDialog
        isOpen={!!selectedPollId}
        onClose={() => setSelectedPollId(null)}
        pollResult={pollResult || null}
      />
    </>
  );
}
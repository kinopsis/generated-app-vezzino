import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BarChart, Check, Clock, Vote, X, Loader2, CheckCircle2 } from "lucide-react";
import type { Poll, AssemblyState } from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
interface PollCardProps {
  isAdmin?: boolean;
  assemblyId: string;
  activePoll: Poll | null;
  liveState: AssemblyState | undefined;
  onClosePoll: (pollId: string) => void;
}
export function PollCard({ isAdmin = false, assemblyId, activePoll, liveState, onClosePoll }: PollCardProps) {
  const [selections, setSelections] = useState<string[]>([]);
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const hasVoted = activePoll && userId && liveState?.votes[activePoll.id]?.[userId];
  const voteMutation = useMutation({
    mutationFn: (voteData: { userId: string; pollId: string; selections: string[] }) =>
      api(`/api/assemblies/${assemblyId}/vote`, {
        method: 'POST',
        body: JSON.stringify(voteData),
      }),
    onSuccess: () => {
      toast.success("Vote submitted successfully!");
    },
    onError: (err) => {
      toast.error(`Failed to submit vote: ${err.message}`);
    },
  });
  const handleSingleSelect = (value: string) => {
    setSelections([value]);
  };
  const handleMultiSelect = (optionId: string, checked: boolean) => {
    setSelections(prev => {
      if (checked) {
        return [...prev, optionId];
      } else {
        return prev.filter(id => id !== optionId);
      }
    });
  };
  const handleSubmitVote = () => {
    if (selections.length === 0 || !activePoll || !userId) return;
    voteMutation.mutate({
      userId,
      pollId: activePoll.id,
      selections,
    });
  };
  useEffect(() => {
    setSelections([]);
  }, [activePoll?.id]);
  const renderOptions = () => {
    if (!activePoll) return null;
    if (activePoll.poll_type === 'multiple') {
      return (
        <div className="space-y-3">
          {activePoll.options.map((option) => (
            <Label
              key={option.id}
              htmlFor={option.id}
              className={cn(
                "flex items-center space-x-3 border p-4 rounded-md cursor-pointer hover:bg-accent transition-all",
                selections.includes(option.id) && "bg-blue-50 border-blue-500 dark:bg-blue-900/50"
              )}
            >
              <Checkbox
                id={option.id}
                checked={selections.includes(option.id)}
                onCheckedChange={(checked) => handleMultiSelect(option.id, !!checked)}
              />
              <span>{option.text}</span>
            </Label>
          ))}
        </div>
      );
    }
    return (
      <RadioGroup onValueChange={handleSingleSelect} value={selections[0] || ""}>
        <div className="space-y-3">
          {activePoll.options.map((option) => (
            <Label
              key={option.id}
              htmlFor={option.id}
              className={cn(
                "flex items-center space-x-3 border p-4 rounded-md cursor-pointer hover:bg-accent transition-all",
                selections.includes(option.id) && "bg-blue-50 border-blue-500 dark:bg-blue-900/50"
              )}
            >
              <RadioGroupItem value={option.id} id={option.id} />
              <span>{option.text}</span>
            </Label>
          ))}
        </div>
      </RadioGroup>
    );
  };
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Active Poll</CardTitle>
          {activePoll && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
              <Clock className="h-4 w-4" />
              <span>Voting Open</span>
            </div>
          )}
        </div>
        {activePoll && <CardDescription>{activePoll.title}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1">
        {activePoll ? (
          hasVoted && selections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-green-600">
              <CheckCircle2 className="h-12 w-12 mb-4" />
              <h3 className="font-medium">Vote Submitted</h3>
              <p className="text-sm text-muted-foreground">Your vote has been recorded. You can change your vote until the poll closes.</p>
            </div>
          ) : (
            renderOptions()
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Vote className="h-12 w-12 mb-4" />
            <h3 className="font-medium">No Active Poll</h3>
            <p className="text-sm">Waiting for the administrator to start the next poll.</p>
          </div>
        )}
      </CardContent>
      {activePoll && (
        <CardFooter className="border-t pt-4">
          {isAdmin ?
            <div className="w-full flex items-center justify-between gap-2">
              <Button variant="outline">
                <BarChart className="mr-2 h-4 w-4" />
                View Results
              </Button>
              <Button variant="destructive" onClick={() => onClosePoll(activePoll.id)}>
                <X className="mr-2 h-4 w-4" />
                Close Poll
              </Button>
            </div> :
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubmitVote}
              disabled={selections.length === 0 || voteMutation.isPending}
            >
              {voteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              {hasVoted ? "Update Vote" : "Submit Vote"}
            </Button>
          }
        </CardFooter>
      )}
    </Card>
  );
}
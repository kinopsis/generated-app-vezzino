import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PollResult } from "@shared/types";
interface PollResultsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pollResult: PollResult | null;
}
export function PollResultsDialog({ isOpen, onClose, pollResult }: PollResultsDialogProps) {
  if (!pollResult) return null;
  const maxCoefficient = Math.max(...pollResult.results.map(r => r.coefficient_total), 1);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Poll Results: {pollResult.title}</DialogTitle>
          <DialogDescription>
            A total of {pollResult.total_votes} votes were cast, representing a coefficient of {pollResult.total_coefficient_voted.toFixed(2)}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ScrollArea className="h-72">
            <div className="space-y-4 pr-4">
              {pollResult.results.map(result => (
                <div key={result.option_id}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-medium">{result.text}</p>
                    <p className="text-sm text-muted-foreground">
                      {result.vote_count} votes ({result.coefficient_total.toFixed(2)})
                    </p>
                  </div>
                  <Progress value={(result.coefficient_total / maxCoefficient) * 100} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
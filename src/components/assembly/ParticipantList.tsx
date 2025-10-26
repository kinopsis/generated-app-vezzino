import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, UserCheck, UserX } from "lucide-react";
import type { Participant } from "@shared/types";
interface ParticipantListProps {
  participants: Participant[];
}
export function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Participants ({participants.length})</CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search participants..." className="pl-8" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-1 p-4 pt-0">
            {participants.map((participant) =>
            <div key={participant.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{participant.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{participant.full_name}</p>
                    <p className="text-xs text-muted-foreground">Coeff: {participant.coefficient.toFixed(2)}</p>
                  </div>
                </div>
                {participant.is_present ?
              <UserCheck className="h-4 w-4 text-green-500" /> :
              <UserX className="h-4 w-4 text-muted-foreground" />
              }
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>);
}
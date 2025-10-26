import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Participant } from "@shared/types";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
interface VideoPanelProps {
  participants: Participant[];
}
interface ParticipantState {
  isMuted: boolean;
  isCameraOff: boolean;
}
export function VideoPanel({ participants }: VideoPanelProps) {
  const [participantStates, setParticipantStates] = useState<Record<string, ParticipantState>>({});
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2).toUpperCase();
  };
  const toggleMute = (participantId: string) => {
    setParticipantStates(prev => ({
      ...prev,
      [participantId]: { ...prev[participantId], isMuted: !prev[participantId]?.isMuted }
    }));
  };
  const toggleCamera = (participantId: string) => {
    setParticipantStates(prev => ({
      ...prev,
      [participantId]: { ...prev[participantId], isCameraOff: !prev[participantId]?.isCameraOff }
    }));
  };
  return (
    <div className="h-full bg-card rounded-lg overflow-hidden border p-2 sm:p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 h-full">
        {participants.map((participant) => {
          const state = participantStates[participant.id] || { isMuted: true, isCameraOff: true };
          return (
            <div
              key={participant.id}
              className={cn(
                "relative aspect-video rounded-md flex flex-col items-center justify-center bg-secondary overflow-hidden transition-all duration-300 group",
                participant.is_present ? "border-2 border-green-500" : "opacity-60"
              )}
            >
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16 text-xl sm:text-2xl">
                <AvatarFallback>{getInitials(participant.full_name)}</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {participant.full_name}
              </div>
              {!participant.is_present && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-sm">Offline</span>
                </div>
              )}
              {participant.is_present && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="bg-black/50 p-1.5 rounded-full text-white h-7 w-7 sm:h-8 sm:w-8" onClick={() => toggleMute(participant.id)}>
                    {state.isMuted ? <MicOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Mic className="h-3 w-3 sm:h-4 sm:w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="bg-black/50 p-1.5 rounded-full text-white h-7 w-7 sm:h-8 sm:w-8" onClick={() => toggleCamera(participant.id)}>
                    {state.isCameraOff ? <VideoOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Video className="h-3 w-3 sm:h-4 sm:w-4" />}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
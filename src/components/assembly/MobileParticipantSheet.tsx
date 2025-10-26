import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ParticipantList } from "./ParticipantList";
import type { Participant } from "@shared/types";
interface MobileParticipantSheetProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
}
export function MobileParticipantSheet({ isOpen, onClose, participants }: MobileParticipantSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="p-0 flex flex-col">
        <SheetHeader>
          <SheetTitle>Participants</SheetTitle>
        </SheetHeader>
        <ParticipantList participants={participants} />
      </SheetContent>
    </Sheet>
  );
}
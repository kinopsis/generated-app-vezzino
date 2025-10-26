import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Loader2 } from "lucide-react";
const proxySchema = z.object({
  delegator_id: z.string().min(1, "Delegator is required"),
  delegate_id: z.string().min(1, "Delegate is required"),
});
type ProxyFormData = z.infer<typeof proxySchema>;
interface ProxyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProxyFormData) => void;
  isSaving: boolean;
}
export function ProxyDialog({ isOpen, onClose, onSave, isSaving }: ProxyDialogProps) {
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api('/api/users'),
    enabled: isOpen,
  });
  const { handleSubmit, control, formState: { errors } } = useForm<ProxyFormData>({
    resolver: zodResolver(proxySchema),
  });
  const onSubmit = (data: ProxyFormData) => {
    onSave(data);
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Proxy Vote</DialogTitle>
          <DialogDescription>
            Delegate voting power from one user to another for this assembly.
          </DialogDescription>
        </DialogHeader>
        {isLoadingUsers ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} id="proxy-form">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="delegator_id">Delegator (Gives Vote)</Label>
                <Controller
                  name="delegator_id"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
                      <SelectContent>
                        {users?.map(user => <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.delegator_id && <p className="text-red-500 text-sm">{errors.delegator_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="delegate_id">Delegate (Receives Vote)</Label>
                <Controller
                  name="delegate_id"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
                      <SelectContent>
                        {users?.map(user => <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.delegate_id && <p className="text-red-500 text-sm">{errors.delegate_id.message}</p>}
              </div>
            </div>
          </form>
        )}
        <DialogFooter>
          <Button type="submit" form="proxy-form" disabled={isSaving || isLoadingUsers} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isSaving ? "Saving..." : "Save Proxy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
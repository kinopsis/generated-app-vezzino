import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
const assemblySchema = z.object({
  name: z.string().min(3, "Assembly name is required"),
  description: z.string().optional(),
  scheduled_start: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
});
type AssemblyFormData = z.infer<typeof assemblySchema>;
interface CreateAssemblyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<AssemblyFormData, 'scheduled_start'> & { scheduled_start: number }) => void;
  isSaving: boolean;
}
export function CreateAssemblyDialog({ isOpen, onClose, onSave, isSaving }: CreateAssemblyDialogProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<AssemblyFormData>({
    resolver: zodResolver(assemblySchema),
  });
  const onSubmit = (data: AssemblyFormData) => {
    onSave({
      ...data,
      scheduled_start: new Date(data.scheduled_start).getTime(),
    });
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Assembly</DialogTitle>
          <DialogDescription>
            Provide the details for your new assembly. You can add polls later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="assembly-form">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Assembly Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" {...register("description")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_start">Scheduled Start</Label>
              <Input id="scheduled_start" type="datetime-local" {...register("scheduled_start")} />
              {errors.scheduled_start && <p className="text-red-500 text-sm">{errors.scheduled_start.message}</p>}
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="assembly-form" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isSaving ? "Creating..." : "Create Assembly"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
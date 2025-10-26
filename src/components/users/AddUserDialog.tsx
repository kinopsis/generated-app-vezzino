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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User } from "@shared/types";
import { useEffect } from "react";
const userSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  coefficient: z.coerce.number().min(0, "Coefficient must be non-negative"),
  role: z.enum(['Admin', 'Moderator', 'Voter', 'Observer', 'SuperAdmin']),
});
type UserFormData = z.infer<typeof userSchema>;
interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UserFormData) => void;
  user?: User | null;
  isSaving: boolean;
}
export function AddUserDialog({ isOpen, onClose, onSave, user, isSaving }: AddUserDialogProps) {
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });
  useEffect(() => {
    if (isOpen) {
      if (user) {
        reset({
          full_name: user.full_name,
          email: user.email,
          coefficient: user.coefficient,
          role: user.role,
        });
      } else {
        reset({
          full_name: "",
          email: "",
          coefficient: 1.0,
          role: "Voter",
        });
      }
    }
  }, [user, reset, isOpen]);
  const onSubmit: SubmitHandler<UserFormData> = (data) => {
    onSave(data);
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription>
            {user ? "Update the user's details below." : "Fill in the details for the new user."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="user-form">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">Name</Label>
              <Input id="full_name" {...register("full_name")} className="col-span-3" />
              {errors.full_name && <p className="col-span-4 text-red-500 text-sm text-right">{errors.full_name.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" type="email" {...register("email")} className="col-span-3" />
              {errors.email && <p className="col-span-4 text-red-500 text-sm text-right">{errors.email.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="coefficient" className="text-right">Coefficient</Label>
              <Input id="coefficient" type="number" step="0.01" {...register("coefficient")} className="col-span-3" />
              {errors.coefficient && <p className="col-span-4 text-red-500 text-sm text-right">{errors.coefficient.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Voter">Voter</SelectItem>
                      <SelectItem value="Moderator">Moderator</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Observer">Observer</SelectItem>
                      <SelectItem value="SuperAdmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && <p className="col-span-4 text-red-500 text-sm text-right">{errors.role.message}</p>}
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="user-form" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
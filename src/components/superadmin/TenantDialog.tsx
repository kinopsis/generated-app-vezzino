import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Tenant } from "@shared/types";
const tenantSchema = z.object({
  name: z.string().min(2, "Tenant name is required"),
  domain: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});
type TenantFormData = z.infer<typeof tenantSchema>;
interface TenantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TenantFormData) => void;
  tenant?: Tenant | null;
  isSaving: boolean;
}
export function TenantDialog({ isOpen, onClose, onSave, tenant, isSaving }: TenantDialogProps) {
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
  });
  useEffect(() => {
    if (isOpen) {
      if (tenant) {
        reset(tenant);
      } else {
        reset({ name: "", domain: "", status: "active" });
      }
    }
  }, [tenant, reset, isOpen]);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tenant ? "Edit Tenant" : "Create New Tenant"}</DialogTitle>
          <DialogDescription>Fill in the details for the tenant organization.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} id="tenant-form">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tenant Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domain (Optional)</Label>
              <Input id="domain" {...register("domain")} placeholder="acme.agora.edge" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="tenant-form" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isSaving ? "Saving..." : "Save Tenant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
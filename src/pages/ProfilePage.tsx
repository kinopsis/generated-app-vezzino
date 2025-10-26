import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth.store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { User } from "@shared/types";
const profileSchema = z.object({
  full_name: z.string().min(2, "Full name is required")
});
const passwordSchema = z.object({
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"]
});
type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();
  const { register: registerProfile, handleSubmit: handleSubmitProfile, formState: { errors: profileErrors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || ""
    }
  });
  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: passwordErrors }, reset: resetPassword } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema)
  });
  const updateProfileMutation = useMutation({
    mutationFn: (data: {full_name: string;}) => api<User>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    }
  });
  const updatePasswordMutation = useMutation({
    mutationFn: (data: {password_hash: string;}) => api('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast.success("Password updated successfully!");
      resetPassword();
    },
    onError: (error) => {
      toast.error(`Failed to update password: ${error.message}`);
    }
  });
  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };
  const onPasswordSubmit = (data: PasswordFormData) => {
    updatePasswordMutation.mutate({ password_hash: `hashed_${data.new_password}` });
  };
  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and security settings.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <form onSubmit={handleSubmitProfile(onProfileSubmit)}>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your name and email address.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" {...registerProfile("full_name")} />
                  {profileErrors.full_name && <p className="text-sm text-red-500">{profileErrors.full_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email || ""} disabled />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={updateProfileMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>
          <Card>
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)}>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Set a new password for your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input id="new_password" type="password" {...registerPassword("new_password")} />
                  {passwordErrors.new_password && <p className="text-sm text-red-500">{passwordErrors.new_password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input id="confirm_password" type="password" {...registerPassword("confirm_password")} />
                  {passwordErrors.confirm_password && <p className="text-sm text-red-500">{passwordErrors.confirm_password.message}</p>}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={updatePasswordMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {updatePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
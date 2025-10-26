import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Vote, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
const registerSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
export default function AuthPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => api<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (data) => {
      login(data.user, data.token);
      toast.success("Login successful!");
      navigate('/app');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) => api<{ user: any; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (data) => {
      login(data.user, data.token);
      toast.success("Registration successful!");
      navigate('/app');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/40 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-blue-600 text-white shadow-lg">
              <Vote className="h-8 w-8" />
            </div>
            <h1 className="text-5xl font-bold text-foreground">AgoraEdge</h1>
          </div>
          <p className="text-muted-foreground max-w-md">
            Secure, scalable, and unified platform for modern assemblies and weighted online voting.
          </p>
        </div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm mutation={loginMutation} />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm mutation={registerMutation} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
function LoginForm({ mutation }: { mutation: any }) {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const onSubmit = (data: LoginFormData) => {
    mutation.mutate(data);
  };
  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" type="email" placeholder="m@example.com" {...register("email")} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input id="login-password" type="password" {...register("password")} />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
function RegisterForm({ mutation }: { mutation: any }) {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });
  const onSubmit = (data: RegisterFormData) => {
    mutation.mutate(data);
  };
  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>Create a new account to get started.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="register-name">Full Name</Label>
            <Input id="register-name" placeholder="John Doe" {...register("full_name")} />
            {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-email">Email</Label>
            <Input id="register-email" type="email" placeholder="m@example.com" {...register("email")} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">Password</Label>
            <Input id="register-password" type="password" {...register("password")} />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
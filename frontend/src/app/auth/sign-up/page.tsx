'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
});

export default function SignUpPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  async function handleSignup(data: { email: string; password: string; fullName: string; }) {
    const { email, password, fullName } = data;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        setErrorMessage("This email is already registered. Please use a different email.");
      } else {
        setErrorMessage(error.message);
      }
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center items-center p-4">
      <form onSubmit={handleSubmit(handleSignup)} className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Your full name"
            {...register("fullName")}
          />
          {errors.fullName && <span className="text-red-500">{errors.fullName.message}</span>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email && <span className="text-red-500">{errors.email.message}</span>}
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="password">Password</Label>
          <div
            className="flex flex-row items-center"
          >
          <Input
            id="password"
            className="rounded-r-none"
            type={showPassword ? "text" : "password"}
            placeholder="Your password"
            {...register("password")}
          />
          <Button
            variant="outline"
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="rounded-l-none"
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </Button>
          </div>
          {errors.password && <span className="text-red-500">{errors.password.message}</span>}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Accept terms and conditions
          </label>
        </div>

        {errorMessage && (
          <div className="text-red-500 text-sm">{errorMessage}</div>
        )}

        <Button type="submit" className="w-full">
          Sign Up
        </Button>
      </form>
    </div>
  );
}

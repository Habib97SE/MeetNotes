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
import Link from "next/link";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export default function SignInPage() {
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState('');
    
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
    });

    async function handleSignIn(data: any) {
        const { email, password } = data;

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMessage(error.message);
        } else {
            router.push('/dashboard');
        }
    }

    return (
        <div className="flex min-h-screen flex-col justify-center items-center p-4">
            <form onSubmit={handleSubmit(handleSignIn)} className="w-full max-w-sm space-y-6">
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

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="Your password"
                        {...register("password")}
                    />
                    {errors.password && <span className="text-red-500">{errors.password.message}</span>}
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="remember-me" />
                        <Label htmlFor="remember-me">Remember me</Label>
                    </div>
                    <div>
                        <Link href="/auth/reset-password">Forgot your password?</Link>
                    </div>
                </div>
                {errorMessage && (
                    <div className="text-red-500 text-sm">{errorMessage}</div>
                )}

                <Button type="submit" className="w-full">
                    Sign In
                </Button>
            </form>
        </div>
    );
}

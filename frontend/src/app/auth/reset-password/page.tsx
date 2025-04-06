"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage('');

        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
            setError(error.message);
        } else {
            setMessage('Check your email for the password reset link!');
        }
        setLoading(false);
    };

    return (
        <div
            className="flex flex-col items-center justify-center h-screen"
        >
            <h1 className="text-2xl font-bold">Forgot Password</h1>
            <form onSubmit={handleSubmit}>
                <div
                    className="my-4"
                >
                    <Label htmlFor="email" className="text-sm font-medium mb-2">Email:</Label>
                    <Input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {message && <p style={{ color: 'green' }}>{message}</p>}
        </div>
    );
};

export default ForgotPasswordPage;

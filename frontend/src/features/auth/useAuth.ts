'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
    phone_number?: string;
    profile_picture?: string;
    birth_date?: string;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    created_at?: string;
    updated_at?: string;
}

export function useAuth() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function getCurrentUser() {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                setError(error.message);
                setUser(null);
            } else if (session?.user) {
                const { id, email, user_metadata } = session.user;
                setUser({
                    id,
                    email: email || '',
                    full_name: user_metadata?.full_name || '',
                    role: user_metadata?.role || '',
                    phone_number: user_metadata?.phone_number || '',
                    profile_picture: user_metadata?.profile_picture || '',
                    birth_date: user_metadata?.birth_date || '',
                    gender: user_metadata?.gender || '',
                    address: user_metadata?.address || '',
                    city: user_metadata?.city || '',
                    state: user_metadata?.state || '',
                    zip_code: user_metadata?.zip_code || '',
                    country: user_metadata?.country || '',
                    created_at: user_metadata?.created_at || '',
                    updated_at: user_metadata?.updated_at || '',
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        }

        getCurrentUser();
    }, []);

    async function updateProfile(updates: { full_name?: string }) {
        setLoading(true);
        const { error } = await supabase.auth.updateUser({
            data: updates,
        });
        setLoading(false);

        if (error) {
            setError(error.message);
            throw error;
        }

        // Refresh user profile after update
        await refreshUser();
    }

    async function refreshUser() {
        setLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            setError(error?.message || 'No user found');
            setUser(null);
        } else {
            const { id, email, user_metadata } = user;
            setUser({
                id,
                email: email || '',
                full_name: user_metadata?.full_name || '',
            });
        }
        setLoading(false);
    }

    async function deleteAccount() {
        const { error } = await supabase.rpc('delete_user');
        if (error) {
            setError(error.message);
            throw error;
        }
    }

    return {
        user,
        loading,
        error,
        updateProfile,
        deleteAccount,
        refreshUser,
    };
}

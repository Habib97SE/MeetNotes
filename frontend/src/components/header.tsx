"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { signOut } from "@/features/auth/auth-helper";


function Header() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            setIsLoggedIn(true);
        }
    }, [user]);

    return (
        <header className="flex justify-between items-center p-4 bg-gray-100">
            <div>
                <nav className="flex gap-4">
                    <Link className="hover:text-blue-500" href="/">Home</Link>
                    <Link className="hover:text-blue-500" href="/meetings">Meetings</Link>
                    <Link className="hover:text-blue-500" href="/meetings/upload">Upload</Link>
                </nav>
            </div>
            <div>
                {isLoggedIn ? (
                    <Button variant="outline" className="bg-red-500 text-white hover:bg-red-600 hover:text-white" onClick={signOut}>Sign Out</Button>
                ) : (
                    <Button variant="outline">
                        <Link href="/auth/sign-in">Sign In</Link>
                    </Button>
                )}
            </div>
        </header>
    );
}

export default Header;
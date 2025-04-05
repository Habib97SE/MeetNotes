import Link from "next/link";
import { Button } from "@/components/ui/button";

function Header() {
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
                <Button variant="outline">Sign In</Button>
            </div>
        </header>
    );
}

export default Header;
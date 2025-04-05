import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import footerData from "@/constants/footer-data";

function Footer() {
    return (
        <footer className="bg-gray-100">
            <div className="flex flex-col md:flex-row justify-between px-4 md:px-16 py-8 items-start">
                {footerData.navs.map((nav) => (
                    <div key={nav.title} className="mb-4 md:mb-0">
                        <h2 className="text-sm font-bold">{nav.title}</h2>
                        <ul className="flex flex-col gap-2">
                            {nav.links.map((link) => (
                                <li key={link.label}>
                                    <Link href={link.href}>{link.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                {footerData.social && (
                    <div className="flex flex-col mb-4 md:mb-0">
                        <h2 className="text-sm font-bold">{footerData.social.title}</h2>
                        <div className="flex flex-row gap-4">
                            {footerData.social.links.map((social) => (
                                <Link href={social.href} key={social.label} className="flex items-center">
                                    <social.icon className={social.className} />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
                {footerData.newsletter && (
                    <div className="flex flex-col mb-4 md:mb-0">
                        <h2 className="text-sm font-bold">{footerData.newsletter.title}</h2>
                        <p className="text-sm text-gray-500">{footerData.newsletter.description}</p>
                        <form className="flex flex-row mt-2">
                            <Input
                                placeholder={footerData.newsletter.form.email.placeholder}
                                className="w-full md:w-64 rounded-r-none"
                            />
                            <Button
                                type="submit"
                                className="rounded-l-none"
                            >
                                {footerData.newsletter.form.submit.label}
                            </Button>
                        </form>
                    </div>
                )}
            </div>
            <div className="flex justify-center items-center px-4 md:px-16 py-4 border-t">
                <p className="text-sm text-gray-500">{footerData.copyright.text}</p>
            </div>
        </footer>
    );
}

export default Footer;
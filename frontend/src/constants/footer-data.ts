import { Facebook, Instagram, Twitter } from "lucide-react";

export const footerData = {
    navs: [
        {
            title: "Quick Links",
            links: [
                {
                    label: "Home",
                    href: "/",
                },
                {
                    label: "Meetings",
                    href: "/meetings",
                },
                {
                    label: "Notes",
                    href: "/notes",
                },
                {
                    label: "Settings",
                    href: "/settings",
                },
            ]
        },
        {
            title: "Legal",
            links: [
                {
                    label: "Terms",
                    href: "/terms",
                },
                {
                    label: "Privacy",
                    href: "/privacy",
                },
            ]
        },
        {
            title: "Support",
            links: [
                {
                    label: "Contact",
                    href: "/contact",
                },
            ]
        }
    ],
    social:
    {

        title: "Social",
        links: [
            {
                label: "Twitter",
                href: "https://twitter.com/meetnotes",
                icon: Twitter,
                className: "w-6 h-6 text-gray-500",
            },
            {
                label: "Instagram",
                href: "https://www.instagram.com/meetnotes",
                icon: Instagram,
                className: "w-6 h-6 text-gray-500",
            },
            {
                label: "Facebook",
                href: "https://www.facebook.com/meetnotes",
                icon: Facebook,
                className: "w-6 h-6 text-gray-500",
            }
        ],
    },
    newsletter: {
        title: "Newsletter",
        description: "Subscribe to our newsletter to get the latest news and updates.",
        form: {
            email: {
                label: "Email",
                placeholder: "Enter your email",
                type: "email",
                required: true,
            },
            submit: {
                label: "Subscribe",
                type: "submit",
            },
        },
    },
    copyright: {
        text: `© ${new Date().getFullYear()} MeetNotes. All rights reserved.`,
        
    },
};

export default footerData;

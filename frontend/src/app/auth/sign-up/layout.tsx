import { SessionProvider } from "@/components/providers/session-provider";

import Head from "next/head";


export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {

    

    return (
    <>
      <Head>
        <title>Sign Up | MeetNotes</title>
        <meta name="description" content="Sign up for MeetNotes" />
      </Head>
      <SessionProvider>
        {children}
      </SessionProvider>
    </>
  );
}

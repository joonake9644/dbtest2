import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import Link from 'next/link';
import { cookies } from 'next/headers';
import type { UserSession } from '@/types';

// ... (imports)

// ... (metadata)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('user_session');
  let session: UserSession | null = null;
  if (sessionCookie) {
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {}
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <main className="p-6">
            <Nav session={session} />
            <div className="mt-6">{children}</div>
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

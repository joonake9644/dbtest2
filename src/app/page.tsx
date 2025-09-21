import { cookies } from 'next/headers';
import type { UserSession } from '@/types';
import HomePageClient from './home-client-page';

async function getSessionFromCookie(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');

  if (!sessionCookie) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value) as UserSession;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const session = await getSessionFromCookie();
  return <HomePageClient session={session} />;
}

import { cookies } from 'next/headers';
import type { UserSession } from '@/types';
import HomePageClient from './home-client-page';

function getSessionFromCookie(): UserSession | null {
  const cookieStore = cookies();
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

export default function HomePage() {
  const session = getSessionFromCookie();
  return <HomePageClient session={session} />;
}

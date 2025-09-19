import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import MyReservationsClientPage from './client-page';

type UserSession = {
  userId: string;
  name: string;
};

export default function MyReservationsPage() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('user_session');
  let session: UserSession | null = null;

  if (sessionCookie) {
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      // Invalid cookie, treat as not logged in
    }
  }

  if (!session?.userId) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <h1 className="text-2xl font-semibold mb-4">로그인 필요</h1>
        <p className="text-muted-foreground mb-6">
          예약 내역을 보려면 로그인이 필요합니다.
        </p>
        <Link href="/login">
          <Button>로그인 페이지로 이동</Button>
        </Link>
      </div>
    );
  }

  return <MyReservationsClientPage session={session} />;
}
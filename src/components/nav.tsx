'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { UserSession } from '@/types';
import { Button } from './ui/button';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
  const base = 'hover:underline transition-colors';
  const className = active
    ? `${base} font-semibold underline`
    : `${base} text-muted-foreground`;

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function Nav({ session }: { session: UserSession | null }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Logout failed');
      }
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Logout failed');
    }
  };

  return (
    <nav className="flex items-center justify-between">
      <div className="flex items-center gap-4 text-sm">
        <NavLink href="/">예약 하기</NavLink>
        {session && <NavLink href="/my-reservations">내 예약</NavLink>}
        <NavLink href="/admin">관리자</NavLink>
      </div>
      <div className="flex items-center gap-4 text-sm">
        {session ? (
          <>
            <span className="text-muted-foreground">{session.name}님, 환영합니다.</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              로그아웃
            </Button>
          </>
        ) : (
          <>
            <NavLink href="/login">로그인</NavLink>
            <NavLink href="/signup">회원가입</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

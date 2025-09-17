'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
  const base = 'hover:underline';
  const cls = active ? base + ' font-semibold underline' : base + ' text-muted-foreground';
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export default function Nav() {
  return (
    <nav className="flex items-center gap-4 text-sm">
      <NavLink href="/">예약 하기</NavLink>
      <NavLink href="/my-reservations">예약 조회</NavLink>
      <NavLink href="/admin">관리자</NavLink>
    </nav>
  );
}


'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function AdminNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link href={href} className={`pb-2 ${active ? 'font-semibold text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
      {children}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      </div>
      <nav className="flex gap-6">
        <AdminNavLink href="/admin">Room Management</AdminNavLink>
        <AdminNavLink href="/admin/reservers">Reserver Management</AdminNavLink>
      </nav>
      <div>{children}</div>
    </div>
  );
}

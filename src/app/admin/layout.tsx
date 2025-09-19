'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

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
  const router = useRouter();

  const logout = async () => {
    try {
      const res = await fetch('/api/admin/auth', { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/login');
      } else {
        alert('로그아웃에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to logout', error);
      alert('로그아웃에 실패했습니다.');
    }
  };


  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <Button variant="secondary" onClick={logout}>
          Logout
        </Button>
      </div>
      <nav className="flex gap-6">
        <AdminNavLink href="/admin">Room Management</AdminNavLink>
        <AdminNavLink href="/admin/reservers">Reserver Management</AdminNavLink>
      </nav>
      <div>{children}</div>
    </div>
  );
}

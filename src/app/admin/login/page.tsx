'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function AdminLoginPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || '로그인 실패');
      return;
    }
    window.location.href = '/admin';
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">관리자 로그인</h1>
      <Card className="p-4 space-y-3">
        <div className="space-y-1">
          <Label>관리자 토큰</Label>
          <Input value={token} onChange={(e) => setToken(e.target.value)} type="password" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <Button onClick={login} disabled={loading}>{loading ? '로그인 중...' : '로그인'}</Button>
        </div>
      </Card>
    </div>
  );
}


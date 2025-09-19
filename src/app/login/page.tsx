'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast({ description: '전화번호와 비밀번호를 입력해주세요.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || '로그인에 실패했습니다.');
      }

      toast({
        title: '로그인 성공!',
        description: '성공적으로 로그인되었습니다.',
      });
      // Redirect to the home page or my-reservations
      router.push('/my-reservations');
      router.refresh(); // This will re-fetch server components and get the new cookie
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold text-center mb-6">로그인</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </Card>
      <div className="text-center mt-4 space-x-4">
        <Link href="/signup" className="text-sm text-muted-foreground hover:underline">
          계정이 없으신가요? 회원가입
        </Link>
        <Link href="/forgot-password" className="text-sm text-muted-foreground hover:underline">
          비밀번호를 잊으셨나요?
        </Link>
      </div>
    </div>
  );
}

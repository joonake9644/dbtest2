'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !password) {
      toast({ description: '모든 항목을 입력해주세요.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || '회원가입에 실패했습니다.');
      }

      toast({
        title: '성공!',
        description: '계정이 생성되었습니다. 로그인해주세요.',
      });
      router.push('/login');
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
      <h1 className="text-2xl font-semibold text-center mb-6">회원가입</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">이름</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
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
            {loading ? '가입 중...' : '가입하기'}
          </Button>
        </form>
      </Card>
      <div className="text-center mt-4">
        <Link href="/login" className="text-sm text-muted-foreground hover:underline">
          이미 계정이 있으신가요? 로그인
        </Link>
      </div>
    </div>
  );
}

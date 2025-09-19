'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !newPassword) {
      toast({
        description: 'Please enter your phone number and a new password.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, newPassword }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Failed to reset password.');
      }

      setSuccess(true);
      toast({
        title: 'Success',
        description: 'Your password has been reset for all reservations.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <h1 className="text-2xl font-semibold mb-4">Password Reset Successful</h1>
        <p className="text-muted-foreground mb-4">
          Your password has been successfully reset. You can now use your new password to check your reservations.
        </p>
        <Link href="/my-reservations">
          <Button>Go to My Reservations</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold text-center mb-6">비밀번호 찾기</h1>
      <p className="text-center text-sm text-muted-foreground mb-6">
        전화번호와 새 비밀번호를 입력하세요. 이 전화번호와 연결된 모든 예약의 비밀번호가 재설정됩니다.
      </p>
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
            <Label htmlFor="new-password">새 비밀번호</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '재설정 중...' : '비밀번호 재설정'}
          </Button>
        </form>
      </Card>
      <div className="text-center mt-4">
        <Link href="/my-reservations" className="text-sm text-muted-foreground hover:underline">
          예약 조회로 돌아가기
        </Link>
      </div>
    </div>
  );
}

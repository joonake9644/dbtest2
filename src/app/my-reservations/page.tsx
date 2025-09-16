'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getMyReservations, cancelReservation } from '@/lib/services/reservations';

export default function MyReservationsPage() {
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  const handleSearch = async () => {
    setLoading(true);
    const res = await getMyReservations(phone, password);
    setLoading(false);
    if (!res.success) return toast({ description: res.error, variant: 'destructive' });
    setItems(res.data ?? []);
    if ((res.data ?? []).length === 0) toast({ description: '예약 내역이 없습니다.' });
  };

  const handleCancel = async (id: string) => {
    const res = await cancelReservation(id, phone, password);
    if (!res.success) return toast({ description: res.error, variant: 'destructive' });
    toast({ description: '예약이 취소되었습니다.' });
    handleSearch();
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">내 예약 조회</h1>

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 col-span-2 md:col-span-1">
            <Label>전화번호</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
          </div>
          <div className="space-y-1 col-span-2 md:col-span-1">
            <Label>비밀번호</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSearch} disabled={loading}>{loading ? '조회 중...' : '조회'}</Button>
        </div>
      </Card>

      {items.length > 0 && (
        <Card className="p-4 space-y-2">
          <p className="text-sm text-muted-foreground">총 {items.length}건</p>
          <ul className="space-y-2">
            {items.map((r) => (
              <li key={r.id} className="flex items-center justify-between border rounded p-2">
                <div className="text-sm">
                  <div className="font-medium">{r.reservation_date} · {r.start_time?.slice(0,5)}~{r.end_time?.slice(0,5)}</div>
                  <div className="text-muted-foreground">상태: {r.status}</div>
                </div>
                {r.status === 'active' && (
                  <Button variant="secondary" onClick={() => handleCancel(r.id)}>취소</Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

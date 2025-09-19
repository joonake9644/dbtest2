'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getMyReservations, cancelReservation } from '@/lib/services/reservations';
import type { Reservation, UserSession } from '@/types';

type MyReservation = Reservation & {
  room?: { name: string; location: string; capacity?: number } | null;
};

export default function MyReservationsClientPage({ session }: { session: UserSession }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<MyReservation[]>([]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyReservations();
      if (!result.success) {
        throw new Error(result.error);
      }
      setList((result.data ?? []) as MyReservation[]);
    } catch (e: any) {
      console.error(e);
      toast({ description: e?.message ?? '예약 조회 중 오류가 발생했습니다.', variant: 'destructive' });
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleCancel = async (id: string) => {
    if (!confirm('해당 예약을 취소하시겠습니까?')) return;
    const res = await cancelReservation(id);
    if (!res.success) {
      toast({ description: res.error ?? '취소 실패', variant: 'destructive' });
      return;
    }
    toast({ description: '예약이 취소되었습니다.' });
    fetchList();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">내 예약</h1>
        <p className="text-sm text-muted-foreground">{session.name}님의 예약 내역입니다.</p>
      </header>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">예약 목록을 불러오는 중...</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">예약 내역이 없습니다.</p>
        ) : (
          list
            .sort((a, b) => (a.reservation_date + a.start_time).localeCompare(b.reservation_date + b.start_time))
            .map((r) => (
              <Card key={r.id} className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{r.reservation_date} · {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}</p>
                  <p className="text-xs text-muted-foreground">
                    회의실: {r.room?.name ?? r.room_id}
                    {r.room?.location ? ` · ${r.room?.location}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">상태: {r.status}</p>
                </div>
                <div>
                  {r.status === 'active' ? (
                    <Button variant="destructive" size="sm" onClick={() => handleCancel(r.id)}>취소</Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">취소됨</span>
                  )}
                </div>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}

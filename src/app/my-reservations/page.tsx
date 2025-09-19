'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cancelReservation, getMyReservations } from '@/lib/services/reservations';
import { getRooms } from '@/lib/services/rooms';
import type { Reservation } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type MyReservation = Reservation & {
  reserver_name?: string;
  reserver_phone?: string;
  room?: { name: string; location: string; capacity?: number } | null;
};

export default function MyReservationsPage() {
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<MyReservation[]>([]);
  const [roomMap, setRoomMap] = useState<Record<string, { name: string; location: string; capacity?: number }>>({});
  const [status, setStatus] = useState<'all' | 'active' | 'cancelled'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [queried, setQueried] = useState(false);

  // No initial rooms load — API returns merged room info in one call.

  const fetchList = async () => {
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();

    if (trimmedPhone !== phone) setPhone(trimmedPhone);
    if (trimmedPassword !== password) setPassword(trimmedPassword);

    if (!trimmedPhone || !trimmedPassword) {
      toast({ description: '전화번호와 비밀번호를 입력해주세요.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const result = await getMyReservations(trimmedPhone, trimmedPassword, from, to);
      if (!result.success) {
        throw new Error(result.error ?? '예약 조회 중 오류가 발생했습니다.');
      }

      const rawList = (result.data ?? []) as MyReservation[];
      const map: Record<string, { name: string; location: string; capacity?: number }> = {};

      if (rawList.length) {
        const roomIds = Array.from(new Set(rawList.map((r) => r.room_id).filter(Boolean)));
        if (roomIds.length) {
          const rooms = await getRooms();
          rooms.forEach((room) => {
            if (roomIds.includes(room.id)) {
              map[room.id] = { name: room.name, location: room.location, capacity: room.capacity };
            }
          });
        }
      }

      const merged = rawList.map((reservation) => ({
        ...reservation,
        room: map[reservation.room_id] ?? reservation.room ?? null,
      }));

      setRoomMap(map);
      setList(merged);
    } catch (e: any) {
      console.error(e);
      toast({ description: e?.message ?? '예약 조회 중 오류가 발생했습니다.', variant: 'destructive' });
      setList([]);
      setRoomMap({});
    } finally {
      setLoading(false);
      setQueried(true);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('해당 예약을 취소하시겠습니까?')) return;
    const res = await cancelReservation(id, phone, password);
    if (!res.success) {
      toast({ description: res.error ?? '취소 실패', variant: 'destructive' });
      return;
    }
    toast({ description: '예약이 취소되었습니다.' });
    fetchList();
  };

  const filtered = list.filter((r) => {
    if (status !== 'all' && r.status !== status) return false;
    if (from && r.reservation_date < from) return false;
    if (to && r.reservation_date > to) return false;
    return true;
  });

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const rows = filtered.map((r) => ({
      id: r.id,
      date: r.reservation_date,
      start: r.start_time,
      end: r.end_time,
      room: roomMap[r.room_id]?.name ?? r.room_id,
      location: roomMap[r.room_id]?.location ?? '',
      name: r.reserver_name,
      phone: r.reserver_phone,
      status: r.status,
    }));
    const header = Object.keys(rows[0]);
    const csv = [
      header.join(','),
      ...rows.map((o) => header.map((k) => `"${String((o as any)[k] ?? '').replaceAll('"', '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-reservations.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">예약 조회</h1>
        <p className="text-sm text-muted-foreground">휴대폰번호와 비밀번호로 내 예약을 조회/취소합니다.</p>
      </header>

      <Separator />

      <Card className="p-4 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="phone">전화번호</Label>
            <Input id="phone" placeholder="010-0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>상태</Label>
            <Select value={status} onValueChange={(v: 'all'|'active'|'cancelled') => setStatus(v)}>
              <SelectTrigger><SelectValue placeholder="상태 선택" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="cancelled">취소됨</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>시작일</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>종료일</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={exportCsv} disabled={filtered.length === 0}>CSV 내보내기</Button>
          <Button onClick={fetchList} disabled={loading || !phone || !password}>
            {loading ? '조회 중…' : '조회'}
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {!queried
              ? '표시할 예약이 없습니다. 먼저 조회를 실행하세요.'
              : (list.length === 0
                  ? '조회된 예약이 없습니다.'
                  : '필터 조건에 맞는 예약이 없습니다.')}
          </p>
        ) : (
          filtered
            .sort((a, b) => (a.reservation_date + a.start_time).localeCompare(b.reservation_date + b.start_time))
            .map((r) => (
              <Card key={r.id} className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{r.reservation_date} · {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}</p>
                  <p className="text-xs text-muted-foreground">
                    회의실: {roomMap[r.room_id]?.name ?? r.room_id}
                    {roomMap[r.room_id]?.location ? ` · ${roomMap[r.room_id]?.location}` : ''}
                    {roomMap[r.room_id]?.capacity ? ` · ${roomMap[r.room_id]?.capacity}명` : ''}
                    {' '}· 상태: {r.status}
                  </p>
                  <p className="text-xs text-muted-foreground">예약자: {r.reserver_name} · {r.reserver_phone}</p>
                </div>
                <div>
                  {r.status === 'active' ? (
                    <Button variant="destructive" onClick={() => handleCancel(r.id)}>취소</Button>
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

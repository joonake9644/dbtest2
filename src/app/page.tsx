'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { generateTimeSlots, isOverlapping } from '@/lib/utils';
import type { RoomWithReservations } from '@/types';
import { getRoomsWithReservationsByDate } from '@/lib/services/rooms';
import { createReservation } from '@/lib/services/reservations';
import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export default function Home() {
  const { toast } = useToast();
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [rooms, setRooms] = useState<RoomWithReservations[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const timeSlots = useMemo(() => generateTimeSlots(9, 18, 30), []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const data = await getRoomsWithReservationsByDate(date);
        if (!cancelled) setRooms(data);
      } catch (e: any) {
        toast({ title: '불러오기 실패', description: e?.message ?? '데이터 조회 중 오류', variant: 'destructive' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [date, toast]);

  // Realtime subscription to refresh when reservations change
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('reservations:realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, async (payload) => {
        // Refresh if the change touches the selected date
        const d = (payload.new as any)?.reservation_date || (payload.old as any)?.reservation_date;
        if (!d || d === date) {
          const data = await getRoomsWithReservationsByDate(date);
          setRooms(data);
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [date]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">회의실 예약</h1>
          <p className="text-sm text-muted-foreground">날짜별 현황 확인 및 예약</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <Label htmlFor="date">날짜</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <Button onClick={() => setDate(new Date().toISOString().slice(0, 10))} variant="secondary">오늘</Button>
        </div>
      </header>

      <Separator />

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {rooms.map((room) => (
            <Card key={room.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{room.name}</p>
                  <p className="text-xs text-muted-foreground">{room.location} · {room.capacity}인</p>
                </div>
                <Sheet open={open && selectedRoomId === room.id} onOpenChange={(o) => setOpen(o)}>
                  <SheetTrigger asChild>
                    <Button onClick={() => { setSelectedRoomId(room.id); setOpen(true); }}>예약하기</Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="bg-white p-6 rounded-l-md shadow-lg w-full sm:max-w-sm">
                    <BookingForm
                      date={date}
                      roomId={room.id}
                      busy={room.reservations.map(r => ({ start: r.start_time, end: r.end_time }))}
                      onDone={(ok, msg) => {
                        setOpen(false);
                        if (ok) {
                          toast({ description: '예약이 완료되었습니다.' });
                          // refresh list
                          getRoomsWithReservationsByDate(date).then(setRooms);
                        } else {
                          toast({ description: msg ?? '예약 실패', variant: 'destructive' });
                        }
                      }}
                    />
                  </SheetContent>
                </Sheet>
              </div>

              <div className="text-xs text-muted-foreground">
                {room.reservations.length === 0 ? (
                  <p>예약 없음</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {room.reservations.map((r) => (
                      <li key={r.id} className="px-2 py-1 rounded bg-gray-100">
                        {r.start_time.slice(0,5)}~{r.end_time.slice(0,5)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const bookingSchema = z.object({
  start: z.string(),
  end: z.string().refine((v, ctx) => v > (ctx.parent as any).start, { message: '종료 시간은 시작 시간보다 늦어야 합니다' }),
  reserver_name: z.string().min(1, '이름을 입력해 주세요'),
  reserver_phone: z.string().regex(/^010-\d{4}-\d{4}$/i, '전화번호 형식: 010-0000-0000'),
  reserver_password: z.string().min(4, '비밀번호는 4자 이상'),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

function BookingForm({
  date,
  roomId,
  busy,
  onDone,
}: {
  date: string;
  roomId: string;
  busy: { start: string; end: string }[];
  onDone: (ok: boolean, message?: string) => void;
}) {
  const timeSlots = useMemo(() => generateTimeSlots(9, 18, 30), []);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      start: '09:00:00',
      end: '09:30:00',
      reserver_name: '',
      reserver_phone: '',
      reserver_password: '',
    },
  });

  const start = watch('start');
  useEffect(() => {
    const next = nextSlot(start, timeSlots);
    if (watch('end') <= start) setValue('end', next);
  }, [start]);

  const onSubmit = async (values: BookingFormValues) => {
    const overlap = busy.some((b) => isOverlapping(values.start, values.end, b.start, b.end));
    if (overlap) return onDone(false, '해당 시간은 이미 예약되어 있습니다');
    const result = await createReservation({
      room_id: roomId,
      reservation_date: date,
      start_time: values.start,
      end_time: values.end,
      reserver_name: values.reserver_name,
      reserver_phone: values.reserver_phone,
      reserver_password: values.reserver_password,
    });
    if (!result.success) return onDone(false, result.error);
    onDone(true);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <SheetHeader>
        <SheetTitle>예약 생성</SheetTitle>
      </SheetHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>시작</Label>
          <select className="border rounded px-2 py-1 w-full" {...register('start')}>
            {timeSlots.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>종료</Label>
          <select className="border rounded px-2 py-1 w-full" {...register('end')}>
            {timeSlots.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {errors.end && <p className="text-xs text-red-600 mt-1">{errors.end.message}</p>}
        </div>
        <div className="space-y-1 col-span-2">
          <Label>이름</Label>
          <Input {...register('reserver_name')} />
          {errors.reserver_name && <p className="text-xs text-red-600 mt-1">{errors.reserver_name.message}</p>}
        </div>
        <div className="space-y-1 col-span-2">
          <Label>전화번호</Label>
          <Input placeholder="010-0000-0000" {...register('reserver_phone')} />
          {errors.reserver_phone && <p className="text-xs text-red-600 mt-1">{errors.reserver_phone.message}</p>}
        </div>
        <div className="space-y-1 col-span-2">
          <Label>비밀번호</Label>
          <Input type="password" {...register('reserver_password')} />
          {errors.reserver_password && <p className="text-xs text-red-600 mt-1">{errors.reserver_password.message}</p>}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? '예약 중...' : '예약'}</Button>
      </div>
    </form>
  );
}

function nextSlot(value: string, slots: { value: string }[]) {
  const idx = slots.findIndex((s) => s.value === value);
  return slots[Math.min(slots.length - 1, Math.max(0, idx + 1))].value;
}

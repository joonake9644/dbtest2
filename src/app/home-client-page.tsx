'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { addMonths, isSameMonth, startOfMonth } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MonthlyReservationCalendar } from '@/components/reservations/calendar/monthly-reservation-calendar';
import { generateTimeSlots, isOverlapping } from '@/lib/utils';
import type { Reservation, RoomWithReservations, UserSession } from '@/types';
import { getMonthlyReservations, getRoomsWithReservationsByDate } from '@/lib/services/rooms';
import { createReservation } from '@/lib/services/reservations';
import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

// Main component that receives session from server component
export default function HomePageClient({ session }: { session: UserSession | null }) {
  const { toast } = useToast();
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [rooms, setRooms] = useState<RoomWithReservations[]>([]);
  const [monthlyReservations, setMonthlyReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => startOfMonth(new Date()));

  const silentRefreshMonthly = useCallback(async () => {
    try {
      const data = await getMonthlyReservations(calendarMonth);
      setMonthlyReservations(data);
    } catch (error) {
      console.error('월간 예약 목록을 새로 고치는 중 오류가 발생했습니다.', error);
    }
  }, [calendarMonth]);

  useEffect(() => {
    setCalendarMonth((prev) => {
      const target = startOfMonth(new Date(date));
      return isSameMonth(prev, target) ? prev : target;
    });
  }, [date]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const data = await getRoomsWithReservationsByDate(date);
        if (!cancelled) setRooms(data);
      } catch (e: any) {
        toast({ title: '예약 정보 불러오기 실패', description: e?.message ?? '회의실 정보를 조회할 수 없었습니다.', variant: 'destructive' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [date, toast]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setCalendarLoading(true);
      try {
        const data = await getMonthlyReservations(calendarMonth);
        if (!cancelled) setMonthlyReservations(data);
      } catch (e: any) {
        if (!cancelled) {
          toast({
            title: '월간 예약 불러오기 실패',
            description: e?.message ?? '월간 예약 정보를 불러오는 중 문제가 발생했습니다.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setCalendarLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [calendarMonth, toast]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('reservations:realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, async () => {
        try {
          const [dailyRooms, monthly] = await Promise.all([
            getRoomsWithReservationsByDate(date),
            getMonthlyReservations(calendarMonth),
          ]);
          setRooms(dailyRooms);
          setMonthlyReservations(monthly);
        } catch (error) {
          console.error('실시간 예약 정보를 동기화하는데 실패했습니다.', error);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [calendarMonth, date]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCalendarMonth((prev) => addMonths(prev, direction === 'prev' ? -1 : 1));
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">회의실 현황</h1>
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
                  <p className="text-xs text-muted-foreground">{room.location} · {room.capacity}명</p>
                </div>
                <Sheet open={open && selectedRoomId === room.id} onOpenChange={(o) => setOpen(o)}>
                  <SheetTrigger asChild>
                    <Button onClick={() => { setSelectedRoomId(room.id); setOpen(true); }}>예약하기</Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="bg-white p-6 rounded-l-md shadow-lg w-full sm:max-w-sm">
                    <BookingForm
                      session={session}
                      date={date}
                      roomId={room.id}
                      busy={room.reservations.map((r) => ({ start: r.start_time, end: r.end_time }))}
                      onDone={(ok, msg) => {
                        setOpen(false);
                        if (ok) {
                          toast({ description: '예약이 완료되었습니다.' });
                          getRoomsWithReservationsByDate(date).then(setRooms);
                          void silentRefreshMonthly();
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
                        {r.start_time.slice(0, 5)}~{r.end_time.slice(0, 5)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Separator />

      <MonthlyReservationCalendar
        month={calendarMonth}
        rooms={rooms}
        reservations={monthlyReservations}
        isLoading={calendarLoading}
        onMonthChange={handleMonthChange}
      />
    </div>
  );
}

// --- Booking Form --- //

const loggedInSchema = z.object({
  start: z.string(),
  end: z.string(),
}).refine((data) => data.end > data.start, {
  message: '종료 시간은 시작 시간보다 늦어야 합니다',
  path: ['end'],
});

type BookingFormValues = z.infer<typeof loggedInSchema>;

function BookingForm({
  session,
  date,
  roomId,
  busy,
  onDone,
}: {
  session: UserSession | null;
  date: string;
  roomId: string;
  busy: { start: string; end: string }[];
  onDone: (ok: boolean, message?: string) => void;
}) {
  const router = useRouter();
  const timeSlots = useMemo(() => generateTimeSlots(9, 18, 30), []);

  const {
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
    control,
  } = useForm<BookingFormValues>({
    resolver: zodResolver(loggedInSchema),
    defaultValues: { start: '09:00:00', end: '09:30:00' },
  });

  const start = watch('start');
  useEffect(() => {
    const next = nextSlot(start, timeSlots);
    if (watch('end') <= start) setValue('end', next);
  }, [start, timeSlots, watch, setValue]);

  const onSubmit = async (values: BookingFormValues) => {
    if (!session) return; // Should not happen if button is disabled

    const overlap = busy.some((b) => isOverlapping(values.start, values.end, b.start, b.end));
    if (overlap) return onDone(false, '해당 시간은 이미 예약되어 있습니다');

    const result = await createReservation({
      room_id: roomId,
      reservation_date: date,
      start_time: values.start,
      end_time: values.end,
    });

    if (!result.success) return onDone(false, result.error);
    onDone(true);
  };

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <SheetHeader>
        <SheetTitle>예약 작성</SheetTitle>
        {session && <p className="text-sm text-muted-foreground">{session.name}님, 환영합니다.</p>}
      </SheetHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>시작</Label>
          <Controller
            control={control}
            name="start"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1">
          <Label>종료</Label>
          <Controller
            control={control}
            name="end"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
          {errors.end && <p className="text-xs text-red-600 mt-1">{errors.end.message}</p>}
        </div>
      </div>

      {!session && (
        <Card className="bg-muted/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">예약을 진행하려면 로그인이 필요합니다.</p>
        </Card>
      )}

      <div className="flex justify-end gap-2 pt-4">
        {session ? (
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? '예약 중...' : '예약 확정'}</Button>
        ) : (
          <Button type="button" onClick={handleLoginRedirect}>로그인 후 예약</Button>
        )}
      </div>
    </form>
  );
}

function nextSlot(value: string, slots: { value: string }[]) {
  const idx = slots.findIndex((s) => s.value === value);
  return slots[Math.min(slots.length - 1, Math.max(0, idx + 1))].value;
}

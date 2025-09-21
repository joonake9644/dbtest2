import React, { Fragment, useMemo } from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Reservation, Room } from '@/types';
import { Button } from '@/components/ui/button';
import { CalendarDayCell, type CalendarReservationGroup } from './calendar-day-cell';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

type MatrixCell = {
  date: Date;
  groups: CalendarReservationGroup[];
  isCurrentMonth: boolean;
  isToday: boolean;
};

interface MonthlyReservationCalendarProps {
  month: Date;
  rooms: Room[];
  reservations: Reservation[];
  isLoading?: boolean;
  onMonthChange?: (direction: 'prev' | 'next') => void;
}

export function MonthlyReservationCalendar({
  month,
  rooms,
  reservations,
  isLoading,
  onMonthChange,
}: MonthlyReservationCalendarProps) {
  const monthTitle = format(month, 'yyyy년 M월');

  const roomLookup = useMemo(() => {
    const map = new Map<string, Room>();
    rooms.forEach((room) => {
      map.set(room.id, room);
    });
    return map;
  }, [rooms]);

  const reservationsByDate = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    reservations.forEach((reservation) => {
      const key = reservation.reservation_date;
      const list = map.get(key) ?? [];
      list.push(reservation);
      map.set(key, list);
    });
    return map;
  }, [reservations]);

  const dayMatrix = useMemo(() => {
    const calendarStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const today = new Date();

    const matrix: MatrixCell[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      const weekDays = days.slice(i, i + 7).map((date) => {
        const key = format(date, 'yyyy-MM-dd');
        const dateReservations = reservationsByDate.get(key) ?? [];
        return {
          date,
          groups: buildGroups(dateReservations, roomLookup),
          isCurrentMonth: isSameMonth(date, month),
          isToday: isSameDay(date, today),
        };
      });
      matrix.push(weekDays);
    }
    return matrix;
  }, [month, reservationsByDate, roomLookup]);

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">월간 예약 현황</h2>
          {onMonthChange && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => onMonthChange('prev')} aria-label="이전 달">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => onMonthChange('next')} aria-label="다음 달">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <span className="text-sm text-muted-foreground">{monthTitle}</span>
      </header>

      <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
        {DAY_LABELS.map((label) => (
          <div key={label} className="font-medium">
            {label}
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-md border p-8 text-sm text-muted-foreground">
          월간 예약 정보를 불러오는 중...
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {dayMatrix.map((week, index) => (
            <Fragment key={`week-${index}`}>
              {week.map((day) => (
                <CalendarDayCell
                  key={day.date.toISOString()}
                  date={day.date}
                  isCurrentMonth={day.isCurrentMonth}
                  isToday={day.isToday}
                  reservations={day.groups}
                />
              ))}
            </Fragment>
          ))}
        </div>
      )}
    </section>
  );
}

function buildGroups(reservations: Reservation[], roomLookup: Map<string, Room>): CalendarReservationGroup[] {
  const groups = new Map<string, CalendarReservationGroup>();

  reservations.forEach((reservation) => {
    const room = roomLookup.get(reservation.room_id);
    if (!groups.has(reservation.room_id)) {
      groups.set(reservation.room_id, {
        roomId: reservation.room_id,
        roomName: room?.name ?? '미지정 회의실',
        roomLocation: room?.location ?? '',
        slots: [],
      });
    }
    const group = groups.get(reservation.room_id)!;
    group.slots.push({
      id: reservation.id,
      startTime: reservation.start_time.slice(0, 5),
      endTime: reservation.end_time.slice(0, 5),
    });
  });

  const result = Array.from(groups.values());
  result.sort((a, b) => a.roomName.localeCompare(b.roomName, 'ko'));
  result.forEach((group) => {
    group.slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  });
  return result;
}

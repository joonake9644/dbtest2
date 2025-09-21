import React from 'react';
import { cn } from '@/lib/utils';

export interface CalendarReservationSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface CalendarReservationGroup {
  roomId: string;
  roomName: string;
  roomLocation: string;
  slots: CalendarReservationSlot[];
}

interface CalendarDayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  reservations: CalendarReservationGroup[];
}

export function CalendarDayCell({ date, isCurrentMonth, isToday, reservations }: CalendarDayCellProps) {
  const dayNumber = date.getDate();
  const hasReservations = reservations.length > 0;

  return (
    <article
      className={cn(
        'flex min-h-28 flex-col gap-2 rounded-md border bg-white p-2 text-xs transition-colors',
        !isCurrentMonth && 'bg-muted/40 text-muted-foreground',
        isToday && 'border-primary'
      )}
    >
      <header className="flex items-center justify-between text-[11px]">
        <span className={cn('font-medium', isToday && 'text-primary')}>{dayNumber}</span>
        {!isCurrentMonth && <span className="text-muted-foreground">·</span>}
      </header>
      <div className="flex-1 space-y-1">
        {hasReservations ? (
          reservations.map((group) => (
            <div key={group.roomId} className="rounded border border-primary/20 bg-primary/5 p-1">
              <p className="text-[11px] font-semibold text-primary">
                {group.roomName}
                {group.roomLocation && (
                  <span className="ml-1 text-[10px] font-normal text-muted-foreground">({group.roomLocation})</span>
                )}
              </p>
              <ul className="mt-1 space-y-0.5 text-[10px] text-muted-foreground">
                {group.slots.map((slot) => (
                  <li key={slot.id} className="text-foreground">
                    {slot.startTime}~{slot.endTime}
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-[10px] text-muted-foreground">예약 없음</p>
        )}
      </div>
    </article>
  );
}

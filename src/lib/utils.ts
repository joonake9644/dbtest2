import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Time helpers for 30-min slot scheduling
export function generateTimeSlots(
  startHour = 9,
  endHour = 18,
  stepMinutes = 30
) {
  const slots: { label: string; value: string }[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      if (h === endHour && m > 0) break;
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      slots.push({ label: `${hh}:${mm}`, value: `${hh}:${mm}:00` });
    }
  }
  return slots;
}

export function isOverlapping(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
) {
  return aStart < bEnd && bStart < aEnd;
}

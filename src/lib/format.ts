import { STUDIO_TIMEZONE } from "@/lib/config";

export function fmtDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: STUDIO_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function fmtTime(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: STUDIO_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: STUDIO_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

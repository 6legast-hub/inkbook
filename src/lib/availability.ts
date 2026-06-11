import { SLOT_STEP_MINUTES } from "@/lib/config";

// ── Таймзонные хелперы (без внешних зависимостей) ──────────────

// Смещение таймзоны (мс) в конкретный момент времени.
function tzOffsetMs(utcDate: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(utcDate)) map[p.type] = p.value;
  const asUTC = Date.UTC(
    +map.year,
    +map.month - 1,
    +map.day,
    +map.hour,
    +map.minute,
    +map.second,
  );
  return asUTC - utcDate.getTime();
}

// Настенное время студии ("YYYY-MM-DD", "HH:MM") → момент в UTC.
export function zonedWallTimeToUtc(
  dateStr: string,
  timeStr: string,
  tz: string,
): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm, 0);
  const off = tzOffsetMs(new Date(guess), tz);
  return new Date(guess - off);
}

// Ключ дня недели ('mon'..'sun') для даты в таймзоне студии.
export function weekdayKey(dateStr: string, tz: string): string {
  const noon = zonedWallTimeToUtc(dateStr, "12:00", tz);
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" })
    .format(noon)
    .toLowerCase()
    .slice(0, 3);
}

// Часы:минуты момента в таймзоне студии (для подписи слота).
export function formatSlotTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// ── Расчёт слотов ──────────────────────────────────────────────

export interface BusyRange {
  start: string | Date;
  end: string | Date;
}

export interface DayAvailabilityInput {
  dateStr: string; // 'YYYY-MM-DD' в таймзоне студии
  durationMinutes: number; // длительность выбранной услуги
  workingHours: Record<string, [string, string][]>; // из master_profile
  busy: BusyRange[]; // занятые записи + выходные (UTC)
  timezone: string;
  now?: Date; // для отсева прошедших слотов (по умолчанию — текущий момент)
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

// Возвращает ISO-строки доступных времён начала записи в этот день.
export function computeDayAvailability({
  dateStr,
  durationMinutes,
  workingHours,
  busy,
  timezone,
  now = new Date(),
}: DayAvailabilityInput): string[] {
  const intervals = workingHours[weekdayKey(dateStr, timezone)] ?? [];
  if (intervals.length === 0) return [];

  const durationMs = durationMinutes * 60_000;
  const stepMs = SLOT_STEP_MINUTES * 60_000;
  const nowMs = now.getTime();

  const busyMs = busy.map((b) => ({
    start: new Date(b.start).getTime(),
    end: new Date(b.end).getTime(),
  }));

  const slots: string[] = [];

  for (const [from, to] of intervals) {
    const intervalStart = zonedWallTimeToUtc(dateStr, from, timezone).getTime();
    const intervalEnd = zonedWallTimeToUtc(dateStr, to, timezone).getTime();

    for (let s = intervalStart; s + durationMs <= intervalEnd; s += stepMs) {
      const e = s + durationMs;
      if (s < nowMs) continue; // прошедшее время
      const taken = busyMs.some((b) => overlaps(s, e, b.start, b.end));
      if (!taken) slots.push(new Date(s).toISOString());
    }
  }

  return slots;
}

// Список дат ('YYYY-MM-DD' в таймзоне студии) на N дней вперёд от сегодня.
export function upcomingDates(days: number, tz: string): string[] {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }); // en-CA даёт YYYY-MM-DD
  const out: string[] = [];
  const base = Date.now();
  for (let i = 0; i < days; i++) {
    out.push(fmt.format(new Date(base + i * 86_400_000)));
  }
  return out;
}

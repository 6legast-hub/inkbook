import Link from "next/link";
import { loadMaster } from "@/lib/data";
import { upcomingDates, weekdayKey } from "@/lib/availability";
import {
  DEFAULT_MASTER_SLUG,
  STUDIO_TIMEZONE,
  BOOKING_WINDOW_DAYS,
} from "@/lib/config";
import { BookingFlow, type DayOption } from "./booking-flow";

export const dynamic = "force-dynamic";

export default async function BookPage() {
  const { profile, types } = await loadMaster(DEFAULT_MASTER_SLUG);

  const labelFmt = new Intl.DateTimeFormat("ru-RU", {
    timeZone: STUDIO_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const days: DayOption[] = upcomingDates(BOOKING_WINDOW_DAYS, STUDIO_TIMEZONE).map(
    (date) => {
      const wd = weekdayKey(date, STUDIO_TIMEZONE);
      const open = (profile.workingHours[wd]?.length ?? 0) > 0;
      // noon UTC ≈ тот же календарный день в студии — годится для подписи
      const label = labelFmt.format(new Date(`${date}T12:00:00Z`));
      return { date, label, open };
    },
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/"
        className="label transition-colors hover:text-blood"
      >
        ← {profile.name}
      </Link>
      <h1 className="display mt-6 text-6xl md:text-7xl">Запись</h1>
      <p className="mt-3 max-w-xl text-bone-dim">
        Выбери услугу и свободное время. Заявка уйдёт мастеру на подтверждение —
        ответ придёт в Telegram.
      </p>

      <BookingFlow types={types} days={days} />
    </main>
  );
}

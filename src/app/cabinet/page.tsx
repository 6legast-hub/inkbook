import Link from "next/link";
import { requireMaster } from "@/lib/auth";
import { zonedWallTimeToUtc, upcomingDates } from "@/lib/availability";
import { STUDIO_TIMEZONE } from "@/lib/config";
import { StatusBadge } from "@/components/cabinet/status-badge";
import { AppointmentActions } from "@/components/cabinet/appointment-actions";
import { fmtTime } from "@/lib/format";

export const dynamic = "force-dynamic";

interface Appt {
  id: string;
  start_at: string;
  status: string;
  client_name: string | null;
  body_part: string | null;
}

export default async function Dashboard() {
  const { supabase, userId } = await requireMaster();

  const [today, tomorrow] = upcomingDates(2, STUDIO_TIMEZONE);
  const dayAfter = upcomingDates(3, STUDIO_TIMEZONE)[2];
  const from = zonedWallTimeToUtc(today, "00:00", STUDIO_TIMEZONE).toISOString();
  const to = zonedWallTimeToUtc(dayAfter, "00:00", STUDIO_TIMEZONE).toISOString();

  const { data } = await supabase
    .from("appointments")
    .select("id, start_at, status, client_name, body_part")
    .eq("master_id", userId)
    .gte("start_at", from)
    .lt("start_at", to)
    .order("start_at", { ascending: true });

  const appts = (data ?? []) as Appt[];
  const tomorrowStart = zonedWallTimeToUtc(tomorrow, "00:00", STUDIO_TIMEZONE).getTime();
  const todayAppts = appts.filter((a) => new Date(a.start_at).getTime() < tomorrowStart);
  const tomorrowAppts = appts.filter((a) => new Date(a.start_at).getTime() >= tomorrowStart);

  const { count: pendingCount } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("master_id", userId)
    .eq("status", "pending");

  return (
    <div className="space-y-12">
      <div className="flex items-end justify-between">
        <h1 className="display text-6xl md:text-7xl">Сегодня</h1>
        {(pendingCount ?? 0) > 0 && (
          <Link
            href="/cabinet/appointments?status=pending"
            className="border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm text-amber-400 transition-colors hover:bg-amber-400/20"
          >
            {pendingCount} новых заявок →
          </Link>
        )}
      </div>

      <DayBlock title="Сегодня" appts={todayAppts} empty="На сегодня записей нет." />
      <DayBlock title="Завтра" appts={tomorrowAppts} empty="На завтра записей нет." />
    </div>
  );
}

function DayBlock({
  title,
  appts,
  empty,
}: {
  title: string;
  appts: Appt[];
  empty: string;
}) {
  return (
    <section>
      <p className="label mb-4">{title}</p>
      {appts.length === 0 ? (
        <p className="text-bone-faint">{empty}</p>
      ) : (
        <ul className="divide-y divide-ink-800 border-y border-ink-800">
          {appts.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center gap-4 py-4"
            >
              <span className="display w-16 text-2xl tabular-nums text-blood">
                {fmtTime(a.start_at)}
              </span>
              <Link
                href={`/cabinet/appointments/${a.id}`}
                className="flex-1 hover:text-blood"
              >
                <span className="block font-medium">
                  {a.client_name ?? "Без имени"}
                </span>
                <span className="text-sm text-bone-faint">{a.body_part}</span>
              </Link>
              <StatusBadge status={a.status} />
              <AppointmentActions id={a.id} status={a.status} compact />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

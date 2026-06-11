import Link from "next/link";
import { requireMaster } from "@/lib/auth";
import { StatusBadge } from "@/components/cabinet/status-badge";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "Все" },
  { key: "pending", label: "Новые" },
  { key: "confirmed", label: "Подтверждённые" },
  { key: "completed", label: "Завершённые" },
  { key: "cancelled", label: "Отменённые" },
];

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase, userId } = await requireMaster();
  const { status } = await searchParams;
  const active = status && FILTERS.some((f) => f.key === status) ? status : "all";

  let query = supabase
    .from("appointments")
    .select("id, start_at, status, client_name, body_part, size")
    .eq("master_id", userId)
    .order("start_at", { ascending: false });

  if (active !== "all") query = query.eq("status", active);

  const { data } = await query;
  const appts = data ?? [];

  return (
    <div>
      <h1 className="display text-6xl md:text-7xl">Заявки</h1>

      <nav className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/cabinet/appointments${f.key === "all" ? "" : `?status=${f.key}`}`}
            className={`border px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${
              active === f.key
                ? "border-blood text-blood"
                : "border-ink-700 text-bone-dim hover:border-blood"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {appts.length === 0 ? (
        <p className="mt-10 text-bone-faint">Здесь пока пусто.</p>
      ) : (
        <ul className="mt-8 divide-y divide-ink-800 border-y border-ink-800">
          {appts.map((a) => (
            <li key={a.id}>
              <Link
                href={`/cabinet/appointments/${a.id}`}
                className="flex flex-wrap items-center gap-4 py-4 transition-colors hover:text-blood"
              >
                <span className="w-48 shrink-0 text-sm text-bone-dim">
                  {fmtDateTime(a.start_at)}
                </span>
                <span className="flex-1 font-medium">
                  {a.client_name ?? "Без имени"}
                </span>
                <span className="text-sm text-bone-faint">
                  {a.body_part} {a.size ? `· ${a.size}` : ""}
                </span>
                <StatusBadge status={a.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

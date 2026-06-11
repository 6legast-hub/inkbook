import Link from "next/link";
import { requireMaster } from "@/lib/auth";
import { StatusBadge } from "@/components/cabinet/status-badge";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  start_at: string;
  status: string;
  client_name: string | null;
  client_phone: string | null;
  client_telegram: string | null;
  body_part: string | null;
}

interface Client {
  key: string;
  name: string;
  phone: string | null;
  telegram: string | null;
  visits: Row[];
}

export default async function ClientsPage() {
  const { supabase, userId } = await requireMaster();

  const { data } = await supabase
    .from("appointments")
    .select(
      "id, start_at, status, client_name, client_phone, client_telegram, body_part",
    )
    .eq("master_id", userId)
    .order("start_at", { ascending: false });

  const rows = (data ?? []) as Row[];

  // группировка по телефону → telegram → имени
  const map = new Map<string, Client>();
  for (const r of rows) {
    const key = (r.client_phone || r.client_telegram || r.client_name || r.id)
      .toLowerCase()
      .trim();
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: r.client_name ?? "Без имени",
        phone: r.client_phone,
        telegram: r.client_telegram,
        visits: [],
      });
    }
    map.get(key)!.visits.push(r);
  }
  const clients = [...map.values()];

  return (
    <div>
      <div className="flex items-end justify-between">
        <h1 className="display text-6xl md:text-7xl">Клиенты</h1>
        <span className="label">{clients.length}</span>
      </div>

      {clients.length === 0 ? (
        <p className="mt-10 text-bone-faint">Клиентов пока нет.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {clients.map((c) => {
            const completed = c.visits.filter((v) => v.status === "completed").length;
            return (
              <li key={c.key} className="border border-ink-700 p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="display text-2xl">{c.name}</span>
                  <span className="text-sm text-bone-faint">
                    {c.visits.length} записей · {completed} сеансов
                  </span>
                </div>
                <p className="mt-1 text-sm text-bone-dim">
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="hover:text-blood">
                      {c.phone}
                    </a>
                  )}
                  {c.phone && c.telegram ? " · " : ""}
                  {c.telegram && (
                    <a
                      href={`https://t.me/${c.telegram.replace("@", "")}`}
                      className="hover:text-blood"
                    >
                      {c.telegram}
                    </a>
                  )}
                </p>
                <ul className="mt-4 space-y-2">
                  {c.visits.map((v) => (
                    <li key={v.id} className="flex items-center gap-3 text-sm">
                      <Link
                        href={`/cabinet/appointments/${v.id}`}
                        className="flex-1 text-bone-dim hover:text-blood"
                      >
                        {fmtDateTime(v.start_at)}
                        {v.body_part ? ` · ${v.body_part}` : ""}
                      </Link>
                      <StatusBadge status={v.status} />
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

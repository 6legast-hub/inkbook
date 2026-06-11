import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/data";
import { STUDIO_TIMEZONE } from "@/lib/config";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; tone: string; note: string }> = {
  pending: {
    label: "Ждёт подтверждения",
    tone: "text-amber-400 border-amber-400/40 bg-amber-400/10",
    note: "Мастер скоро посмотрит заявку и подтвердит время.",
  },
  confirmed: {
    label: "Подтверждено",
    tone: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
    note: "Время за тобой. Ждём в студии — не опаздывай.",
  },
  completed: {
    label: "Завершено",
    tone: "text-bone-dim border-ink-600 bg-ink-800",
    note: "Спасибо, что пришёл! Заживления и носи с удовольствием.",
  },
  cancelled: {
    label: "Отменено",
    tone: "text-blood border-blood/40 bg-blood/10",
    note: "Эта запись отменена.",
  },
  no_show: {
    label: "Не состоялось",
    tone: "text-blood border-blood/40 bg-blood/10",
    note: "Запись отмечена как несостоявшаяся.",
  },
};

export default async function BookingStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let appt:
    | {
        start_at: string;
        end_at: string;
        status: string;
        client_name: string | null;
        body_part: string | null;
        size: string | null;
        description: string | null;
      }
    | null = null;

  if (isSupabaseConfigured()) {
    const db = createAdminClient();
    const { data } = await db
      .from("appointments")
      .select("start_at, end_at, status, client_name, body_part, size, description")
      .eq("access_token", token)
      .maybeSingle();
    appt = data;
  }

  if (!appt) {
    return (
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="display text-5xl">Запись не найдена</h1>
        <p className="mt-4 text-bone-dim">
          Ссылка неверна или запись удалена.
        </p>
        <Link href="/book" className="label mt-8 inline-block hover:text-blood">
          ← К записи
        </Link>
      </main>
    );
  }

  const s = STATUS[appt.status] ?? STATUS.pending;
  const when = new Intl.DateTimeFormat("ru-RU", {
    timeZone: STUDIO_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(appt.start_at));

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <span
        className={`inline-block border px-3 py-1 text-xs uppercase tracking-widest ${s.tone}`}
      >
        {s.label}
      </span>

      <h1 className="display mt-6 text-5xl md:text-6xl">
        {appt.client_name ? `${appt.client_name}, ` : ""}запись
        <br />
        <span className="text-blood">создана</span>
      </h1>

      <p className="mt-4 text-bone-dim">{s.note}</p>

      <dl className="mt-10 divide-y divide-ink-800 border-y border-ink-800">
        <Row label="Когда" value={when} />
        {appt.body_part && <Row label="Место" value={appt.body_part} />}
        {appt.size && <Row label="Размер" value={appt.size} />}
        {appt.description && <Row label="Идея" value={appt.description} />}
      </dl>

      <p className="mt-8 text-sm text-bone-faint">
        Сохрани эту ссылку — по ней ты всегда видишь статус записи.
      </p>

      <Link href="/" className="label mt-8 inline-block hover:text-blood">
        ← На главную
      </Link>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 py-4">
      <dt className="label shrink-0">{label}</dt>
      <dd className="text-right text-bone">{value}</dd>
    </div>
  );
}

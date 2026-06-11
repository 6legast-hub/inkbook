import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMaster } from "@/lib/auth";
import { StatusBadge } from "@/components/cabinet/status-badge";
import { AppointmentActions } from "@/components/cabinet/appointment-actions";
import { NotesEditor } from "@/components/cabinet/notes-editor";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AppointmentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, userId } = await requireMaster();

  const { data: a } = await supabase
    .from("appointments")
    .select(
      "id, start_at, end_at, status, client_name, client_phone, client_telegram, body_part, size, description, reference_urls, master_notes, cancellation_reason, appointment_types(name)",
    )
    .eq("id", id)
    .eq("master_id", userId)
    .maybeSingle();

  if (!a) notFound();

  const typeName =
    (a.appointment_types as { name?: string } | null)?.name ?? "—";
  const refs = (a.reference_urls as string[]) ?? [];

  return (
    <div className="max-w-2xl">
      <Link href="/cabinet/appointments" className="label hover:text-blood">
        ← Все заявки
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <h1 className="display text-5xl">{a.client_name ?? "Без имени"}</h1>
        <StatusBadge status={a.status} />
      </div>
      <p className="mt-2 text-bone-dim">
        {typeName} · {fmtDateTime(a.start_at)}
      </p>

      {a.cancellation_reason && (
        <p className="mt-3 text-sm text-blood">
          Причина отмены: {a.cancellation_reason}
        </p>
      )}

      {/* контакты */}
      <dl className="mt-8 divide-y divide-ink-800 border-y border-ink-800">
        <Row label="Телефон">
          {a.client_phone ? (
            <a href={`tel:${a.client_phone}`} className="hover:text-blood">
              {a.client_phone}
            </a>
          ) : (
            "—"
          )}
        </Row>
        <Row label="Telegram">
          {a.client_telegram ? (
            <a
              href={`https://t.me/${a.client_telegram.replace("@", "")}`}
              className="hover:text-blood"
            >
              {a.client_telegram}
            </a>
          ) : (
            "—"
          )}
        </Row>
        <Row label="Место / размер">
          {a.body_part} {a.size ? `· ${a.size}` : ""}
        </Row>
        {a.description && <Row label="Идея">{a.description}</Row>}
      </dl>

      {/* референсы */}
      {refs.length > 0 && (
        <section className="mt-8">
          <p className="label mb-3">Референсы</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {refs.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block aspect-square overflow-hidden border border-ink-700"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`референс ${i + 1}`}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* действия */}
      <section className="mt-10">
        <p className="label mb-3">Действия</p>
        <AppointmentActions id={a.id} status={a.status} />
      </section>

      {/* заметки */}
      <section className="mt-10">
        <p className="label mb-3">Заметки мастера (приватно)</p>
        <NotesEditor id={a.id} initial={(a.master_notes as string) ?? ""} />
      </section>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-6 py-3">
      <dt className="label shrink-0">{label}</dt>
      <dd className="text-right text-bone">{children}</dd>
    </div>
  );
}

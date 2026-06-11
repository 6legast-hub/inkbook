export const STATUS_META: Record<
  string,
  { label: string; tone: string }
> = {
  pending: { label: "Ждёт ответа", tone: "text-amber-400 border-amber-400/40 bg-amber-400/10" },
  confirmed: { label: "Подтверждено", tone: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10" },
  completed: { label: "Завершено", tone: "text-bone-dim border-ink-600 bg-ink-800" },
  cancelled: { label: "Отменено", tone: "text-blood border-blood/40 bg-blood/10" },
  no_show: { label: "Не пришёл", tone: "text-blood border-blood/40 bg-blood/10" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span
      className={`inline-block border px-2.5 py-0.5 text-[10px] uppercase tracking-widest ${s.tone}`}
    >
      {s.label}
    </span>
  );
}

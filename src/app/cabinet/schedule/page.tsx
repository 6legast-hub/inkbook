import { requireMaster } from "@/lib/auth";
import { saveWorkingHours, addBlock, deleteBlock } from "../actions";
import { fmtDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const DAYS = [
  { key: "mon", label: "Понедельник" },
  { key: "tue", label: "Вторник" },
  { key: "wed", label: "Среда" },
  { key: "thu", label: "Четверг" },
  { key: "fri", label: "Пятница" },
  { key: "sat", label: "Суббота" },
  { key: "sun", label: "Воскресенье" },
];

export default async function SchedulePage() {
  const { supabase, userId } = await requireMaster();

  const { data: mp } = await supabase
    .from("master_profile")
    .select("working_hours")
    .eq("user_id", userId)
    .maybeSingle();

  const wh = (mp?.working_hours as Record<string, [string, string][]>) ?? {};

  const { data: blocks } = await supabase
    .from("blocked_slots")
    .select("id, start_at, end_at, reason")
    .eq("master_id", userId)
    .gte("end_at", new Date().toISOString())
    .order("start_at", { ascending: true });

  return (
    <div className="max-w-2xl space-y-14">
      <h1 className="display text-6xl md:text-7xl">Расписание</h1>

      {/* рабочие часы */}
      <section>
        <p className="label mb-5">Рабочие часы</p>
        <form action={saveWorkingHours} className="space-y-3">
          {DAYS.map((d) => {
            const interval = wh[d.key]?.[0];
            const open = Boolean(interval);
            return (
              <div
                key={d.key}
                className="flex flex-wrap items-center gap-4 border-b border-ink-800 pb-3"
              >
                <label className="flex w-40 items-center gap-3">
                  <input
                    type="checkbox"
                    name={`${d.key}_open`}
                    defaultChecked={open}
                    className="h-4 w-4 accent-blood"
                  />
                  <span className="text-sm">{d.label}</span>
                </label>
                <input
                  type="time"
                  name={`${d.key}_from`}
                  defaultValue={interval?.[0] ?? "11:00"}
                  className="border border-ink-700 bg-ink-900 px-3 py-2 text-bone outline-none focus:border-blood"
                />
                <span className="text-bone-faint">—</span>
                <input
                  type="time"
                  name={`${d.key}_to`}
                  defaultValue={interval?.[1] ?? "20:00"}
                  className="border border-ink-700 bg-ink-900 px-3 py-2 text-bone outline-none focus:border-blood"
                />
              </div>
            );
          })}
          <Button type="submit" variant="outline" className="mt-2">
            Сохранить часы
          </Button>
        </form>
      </section>

      {/* выходные / отпуск / перерывы */}
      <section>
        <p className="label mb-5">Выходные, отпуск, перерывы</p>

        {blocks && blocks.length > 0 ? (
          <ul className="mb-6 divide-y divide-ink-800 border-y border-ink-800">
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center gap-4 py-3">
                <span className="flex-1 text-sm">
                  {fmtDateTime(b.start_at)} → {fmtDateTime(b.end_at)}
                  {b.reason ? (
                    <span className="text-bone-faint"> · {b.reason}</span>
                  ) : null}
                </span>
                <form action={deleteBlock.bind(null, b.id)}>
                  <button className="text-xs uppercase tracking-widest text-bone-faint hover:text-blood">
                    Удалить
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-6 text-bone-faint">Закрытых периодов нет.</p>
        )}

        <form action={addBlock} className="space-y-3 border border-ink-700 p-4">
          <div className="flex flex-wrap gap-3">
            <label className="flex-1">
              <span className="label mb-1 block">С</span>
              <input
                type="datetime-local"
                name="start"
                required
                className="w-full border border-ink-700 bg-ink-900 px-3 py-2 text-bone outline-none focus:border-blood"
              />
            </label>
            <label className="flex-1">
              <span className="label mb-1 block">По</span>
              <input
                type="datetime-local"
                name="end"
                required
                className="w-full border border-ink-700 bg-ink-900 px-3 py-2 text-bone outline-none focus:border-blood"
              />
            </label>
          </div>
          <input
            name="reason"
            placeholder="причина (отпуск, обед…)"
            className="w-full border border-ink-700 bg-ink-900 px-3 py-2 text-bone outline-none focus:border-blood"
          />
          <Button type="submit" variant="outline">
            Добавить
          </Button>
        </form>
      </section>
    </div>
  );
}

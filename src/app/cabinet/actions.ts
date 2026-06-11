"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMaster } from "@/lib/auth";
import { zonedWallTimeToUtc } from "@/lib/availability";
import { STUDIO_TIMEZONE, BLOCKING_STATUSES } from "@/lib/config";
import { notifyClientConfirmed } from "@/lib/notify";
import { fmtDateTime } from "@/lib/format";

const VALID_STATUS = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;
type Status = (typeof VALID_STATUS)[number];

function refresh() {
  revalidatePath("/cabinet");
  revalidatePath("/cabinet/appointments");
  revalidatePath("/cabinet/clients");
  revalidatePath("/cabinet/schedule");
}

// ── Статусы заявки ─────────────────────────────────────────────
export async function setStatus(
  id: string,
  status: Status,
  reason?: string,
) {
  if (!VALID_STATUS.includes(status)) return;
  const { supabase, userId } = await requireMaster();
  await supabase
    .from("appointments")
    .update({
      status,
      cancellation_reason: status === "cancelled" ? reason ?? null : null,
    })
    .eq("id", id)
    .eq("master_id", userId);

  // при подтверждении — письмо клиенту (если оставил email)
  if (status === "confirmed") {
    const { data } = await supabase
      .from("appointments")
      .select("client_email, client_name, start_at, access_token")
      .eq("id", id)
      .eq("master_id", userId)
      .maybeSingle();
    if (data) {
      await notifyClientConfirmed({
        email: data.client_email as string | null,
        name: (data.client_name as string) ?? "",
        whenStr: fmtDateTime(data.start_at as string),
        token: data.access_token as string,
      });
    }
  }

  refresh();
  revalidatePath(`/cabinet/appointments/${id}`);
}

// ── Заметки мастера ────────────────────────────────────────────
export async function saveNotes(id: string, notes: string) {
  const { supabase, userId } = await requireMaster();
  await supabase
    .from("appointments")
    .update({ master_notes: notes || null })
    .eq("id", id)
    .eq("master_id", userId);
  revalidatePath(`/cabinet/appointments/${id}`);
}

// ── Перенос записи ─────────────────────────────────────────────
// newStartLocal: "YYYY-MM-DDTHH:MM" (настенное время студии)
export async function reschedule(
  id: string,
  newStartLocal: string,
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, userId } = await requireMaster();

  const { data: appt } = await supabase
    .from("appointments")
    .select("start_at, end_at")
    .eq("id", id)
    .eq("master_id", userId)
    .maybeSingle();
  if (!appt) return { ok: false, error: "Запись не найдена" };

  const [dateStr, timeStr] = newStartLocal.split("T");
  if (!dateStr || !timeStr) return { ok: false, error: "Неверное время" };

  const durationMs =
    new Date(appt.end_at).getTime() - new Date(appt.start_at).getTime();
  const newStart = zonedWallTimeToUtc(dateStr, timeStr, STUDIO_TIMEZONE);
  const newEnd = new Date(newStart.getTime() + durationMs);

  // пересечение с другими записями/выходными (исключая саму себя)
  const from = zonedWallTimeToUtc(dateStr, "00:00", STUDIO_TIMEZONE).toISOString();
  const to = zonedWallTimeToUtc(dateStr, "23:59", STUDIO_TIMEZONE).toISOString();

  const [{ data: appts }, { data: blocks }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, start_at, end_at")
      .eq("master_id", userId)
      .in("status", [...BLOCKING_STATUSES])
      .lt("start_at", to)
      .gt("end_at", from),
    supabase
      .from("blocked_slots")
      .select("start_at, end_at")
      .eq("master_id", userId)
      .lt("start_at", to)
      .gt("end_at", from),
  ]);

  const ns = newStart.getTime();
  const ne = newEnd.getTime();
  const clash = [
    ...(appts ?? []).filter((a) => a.id !== id),
    ...(blocks ?? []),
  ].some((b) => {
    const bs = new Date(b.start_at).getTime();
    const be = new Date(b.end_at).getTime();
    return ns < be && bs < ne;
  });
  if (clash) return { ok: false, error: "Это время пересекается с другой записью" };

  await supabase
    .from("appointments")
    .update({ start_at: newStart.toISOString(), end_at: newEnd.toISOString() })
    .eq("id", id)
    .eq("master_id", userId);

  refresh();
  revalidatePath(`/cabinet/appointments/${id}`);
  return { ok: true };
}

// ── Рабочие часы ───────────────────────────────────────────────
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export async function saveWorkingHours(formData: FormData) {
  const { supabase, userId } = await requireMaster();
  const wh: Record<string, [string, string][]> = {};
  for (const k of DAY_KEYS) {
    const open = formData.get(`${k}_open`) === "on";
    const from = String(formData.get(`${k}_from`) ?? "");
    const to = String(formData.get(`${k}_to`) ?? "");
    wh[k] = open && from && to ? [[from, to]] : [];
  }
  await supabase
    .from("master_profile")
    .update({ working_hours: wh })
    .eq("user_id", userId);
  revalidatePath("/cabinet/schedule");
}

// ── Выходные / отпуск / перерывы ───────────────────────────────
export async function addBlock(formData: FormData) {
  const { supabase, userId } = await requireMaster();
  const startLocal = String(formData.get("start") ?? "");
  const endLocal = String(formData.get("end") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const [sd, st] = startLocal.split("T");
  const [ed, et] = endLocal.split("T");
  if (!sd || !st || !ed || !et) return;

  const start = zonedWallTimeToUtc(sd, st, STUDIO_TIMEZONE);
  const end = zonedWallTimeToUtc(ed, et, STUDIO_TIMEZONE);
  if (end <= start) return;

  await supabase.from("blocked_slots").insert({
    master_id: userId,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    reason: reason || null,
  });
  revalidatePath("/cabinet/schedule");
}

export async function deleteBlock(id: string) {
  const { supabase, userId } = await requireMaster();
  await supabase.from("blocked_slots").delete().eq("id", id).eq("master_id", userId);
  revalidatePath("/cabinet/schedule");
}

// ── Выход ──────────────────────────────────────────────────────
export async function signOut() {
  const { supabase } = await requireMaster();
  await supabase.auth.signOut();
  redirect("/login");
}

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/data";
import { notifyClientReminder } from "@/lib/notify";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

// Проверка секрета: заголовок Authorization: Bearer <CRON_SECRET> (Vercel)
// ИЛИ ?secret=<CRON_SECRET> (внешний планировщик, напр. cron-job.org).
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  if (req.nextUrl.searchParams.get("secret") === secret) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase not configured" }, { status: 500 });
  }

  const db = createAdminClient();
  const now = Date.now();
  const in24h = new Date(now + 24 * 3600_000).toISOString();
  const in1h = new Date(now + 3600_000).toISOString();
  const nowIso = new Date(now).toISOString();

  let sent24 = 0;
  let sent1 = 0;

  // — напоминания за 24 часа —
  const { data: due24 } = await db
    .from("appointments")
    .select("id, client_email, client_name, start_at, access_token")
    .eq("status", "confirmed")
    .eq("reminded_24h", false)
    .gt("start_at", nowIso)
    .lte("start_at", in24h);

  for (const a of due24 ?? []) {
    await notifyClientReminder({
      email: a.client_email as string | null,
      name: (a.client_name as string) ?? "",
      whenStr: fmtDateTime(a.start_at as string),
      token: a.access_token as string,
      hours: 24,
    });
    await db.from("appointments").update({ reminded_24h: true }).eq("id", a.id);
    sent24++;
  }

  // — напоминания за 1 час —
  const { data: due1 } = await db
    .from("appointments")
    .select("id, client_email, client_name, start_at, access_token")
    .eq("status", "confirmed")
    .eq("reminded_1h", false)
    .gt("start_at", nowIso)
    .lte("start_at", in1h);

  for (const a of due1 ?? []) {
    await notifyClientReminder({
      email: a.client_email as string | null,
      name: (a.client_name as string) ?? "",
      whenStr: fmtDateTime(a.start_at as string),
      token: a.access_token as string,
      hours: 1,
    });
    await db.from("appointments").update({ reminded_1h: true }).eq("id", a.id);
    sent1++;
  }

  // запрос к БД выше также сбрасывает таймер «засыпания» Supabase (keep-alive).
  return NextResponse.json({ ok: true, sent24, sent1, at: nowIso });
}

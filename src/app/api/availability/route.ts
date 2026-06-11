import { NextResponse, type NextRequest } from "next/server";
import { loadMaster, getBusyRanges, isSupabaseConfigured } from "@/lib/data";
import { computeDayAvailability, zonedWallTimeToUtc } from "@/lib/availability";
import { STUDIO_TIMEZONE, DEFAULT_MASTER_SLUG } from "@/lib/config";

export const dynamic = "force-dynamic";

// GET /api/availability?date=YYYY-MM-DD&typeId=...
// Возвращает { slots: ISOString[] } — только свободные времена начала.
// Данные занятых записей наружу не отдаются.
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const typeId = req.nextUrl.searchParams.get("typeId");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "bad date" }, { status: 400 });
  }

  const { id, profile, types } = await loadMaster(DEFAULT_MASTER_SLUG);
  const type = types.find((t) => t.id === typeId) ?? types[0];
  if (!type) return NextResponse.json({ slots: [] });

  // занятые окна берём только если есть реальный мастер в БД
  let busy: { start: string; end: string }[] = [];
  if (id && isSupabaseConfigured()) {
    const from = zonedWallTimeToUtc(date, "00:00", STUDIO_TIMEZONE).toISOString();
    const to = zonedWallTimeToUtc(date, "23:59", STUDIO_TIMEZONE).toISOString();
    busy = await getBusyRanges(id, from, to);
  }

  const slots = computeDayAvailability({
    dateStr: date,
    durationMinutes: type.durationMinutes,
    workingHours: profile.workingHours,
    busy,
    timezone: STUDIO_TIMEZONE,
  });

  return NextResponse.json({ slots });
}

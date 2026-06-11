"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { loadMaster, getBusyRanges, isSupabaseConfigured } from "@/lib/data";
import { computeDayAvailability, zonedWallTimeToUtc } from "@/lib/availability";
import { bookingSchema } from "@/lib/booking-schema";
import { notifyMasterNewBooking } from "@/lib/notify";
import { fmtDateTime } from "@/lib/format";
import {
  STUDIO_TIMEZONE,
  DEFAULT_MASTER_SLUG,
  MAX_REFERENCES,
  MAX_REFERENCE_MB,
  REFERENCES_BUCKET,
} from "@/lib/config";

export interface BookingResult {
  ok: boolean;
  token?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function createBooking(
  _prev: BookingResult | null,
  formData: FormData,
): Promise<BookingResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        "Запись пока не подключена к базе. Настрой Supabase по инструкции в README, и форма заработает.",
    };
  }

  // 1. Валидация полей
  const parsed = bookingSchema.safeParse({
    typeId: formData.get("typeId"),
    startAt: formData.get("startAt"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    telegram: formData.get("telegram") ?? "",
    email: formData.get("email") ?? "",
    size: formData.get("size"),
    bodyPart: formData.get("bodyPart"),
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Проверь поля формы", fieldErrors };
  }
  const input = parsed.data;

  // 2. Мастер и услуга
  const { id: masterId, types } = await loadMaster(DEFAULT_MASTER_SLUG);
  if (!masterId) {
    return {
      ok: false,
      error: "Мастер ещё не заведён в базе. См. README → seed_master.sql.",
    };
  }
  const type = types.find((t) => t.id === input.typeId);
  if (!type) return { ok: false, error: "Услуга не найдена" };

  const start = new Date(input.startAt);
  const end = new Date(start.getTime() + type.durationMinutes * 60_000);

  // 3. Перепроверка, что слот всё ещё свободен (защита от гонки)
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(start);

  const from = zonedWallTimeToUtc(dateStr, "00:00", STUDIO_TIMEZONE).toISOString();
  const to = zonedWallTimeToUtc(dateStr, "23:59", STUDIO_TIMEZONE).toISOString();
  const busy = await getBusyRanges(masterId, from, to);

  const freeSlots = computeDayAvailability({
    dateStr,
    durationMinutes: type.durationMinutes,
    workingHours: (await loadMaster(DEFAULT_MASTER_SLUG)).profile.workingHours,
    busy,
    timezone: STUDIO_TIMEZONE,
  });
  if (!freeSlots.includes(start.toISOString())) {
    return {
      ok: false,
      error: "Это время только что заняли. Выбери другое, пожалуйста.",
    };
  }

  const db = createAdminClient();

  // 4. Загрузка референсов в Storage
  const files = formData
    .getAll("references")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length > MAX_REFERENCES) {
    return { ok: false, error: `Не больше ${MAX_REFERENCES} референсов` };
  }

  const folder = crypto.randomUUID();
  const referenceUrls: string[] = [];

  for (const file of files) {
    if (file.size > MAX_REFERENCE_MB * 1024 * 1024) {
      return { ok: false, error: `Файл больше ${MAX_REFERENCE_MB} МБ` };
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await db.storage
      .from(REFERENCES_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      return { ok: false, error: `Не загрузился референс: ${upErr.message}` };
    }
    const { data } = db.storage.from(REFERENCES_BUCKET).getPublicUrl(path);
    referenceUrls.push(data.publicUrl);
  }

  // 5. Создание записи
  const { data: inserted, error: insErr } = await db
    .from("appointments")
    .insert({
      master_id: masterId,
      type_id: input.typeId,
      client_name: input.name,
      client_phone: input.phone,
      client_telegram: input.telegram || null,
      client_email: input.email || null,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      status: "pending",
      size: input.size,
      body_part: input.bodyPart,
      description: input.description || null,
      reference_urls: referenceUrls,
    })
    .select("id, access_token")
    .single();

  if (insErr || !inserted) {
    return { ok: false, error: `Не удалось сохранить запись: ${insErr?.message}` };
  }

  // уведомление мастеру в Telegram (тихо, не ломает поток при сбое)
  await notifyMasterNewBooking({
    name: input.name,
    phone: input.phone,
    telegram: input.telegram || null,
    typeName: type.name,
    whenStr: fmtDateTime(start.toISOString()),
    bodyPart: input.bodyPart,
    apptId: (inserted as { id?: string }).id ?? "",
  });

  return { ok: true, token: inserted.access_token as string };
}

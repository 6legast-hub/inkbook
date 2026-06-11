import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { SAMPLE_MASTER, SAMPLE_TYPES } from "@/lib/sample-data";
import { BLOCKING_STATUSES } from "@/lib/config";
import type { MasterProfile, AppointmentType, PortfolioItem } from "@/lib/types";

// Настроен ли Supabase. Если нет — работаем на демо-данных (read-only).
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export interface LoadedMaster {
  id: string | null; // null в демо-режиме (без БД)
  profile: MasterProfile;
  types: AppointmentType[];
}

// Загружает мастера + услуги по slug. Откатывается на демо-данные.
export async function loadMaster(slug: string): Promise<LoadedMaster> {
  if (!isSupabaseConfigured()) {
    return { id: null, profile: SAMPLE_MASTER, types: SAMPLE_TYPES };
  }

  const db = createAdminClient();

  const { data: mp } = await db
    .from("master_profile")
    .select(
      "user_id, slug, bio, studio_address, instagram, portfolio_images, working_hours, profiles(name, avatar_url)",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!mp) {
    // мастер ещё не заведён в БД — показываем демо, но без id (бронь невозможна)
    return { id: null, profile: SAMPLE_MASTER, types: SAMPLE_TYPES };
  }

  const { data: typeRows } = await db
    .from("appointment_types")
    .select("id, name, duration_minutes, price_from, color")
    .eq("master_id", mp.user_id)
    .eq("is_active", true)
    .order("duration_minutes", { ascending: true });

  const prof = (mp.profiles as { name?: string; avatar_url?: string } | null) ?? {};

  const profile: MasterProfile = {
    slug: mp.slug,
    name: prof.name ?? SAMPLE_MASTER.name,
    tagline: SAMPLE_MASTER.tagline, // tagline пока в sample; можно добавить колонку
    bio: mp.bio ?? "",
    studioAddress: mp.studio_address ?? "",
    instagram: mp.instagram ?? "",
    avatarUrl: prof.avatar_url ?? null,
    workingHours: (mp.working_hours as MasterProfile["workingHours"]) ?? {},
    portfolioImages: ((mp.portfolio_images as string[]) ?? []).map(
      (url, i): PortfolioItem => ({
        id: `p${i}`,
        title: "",
        style: "",
        url,
      }),
    ),
  };

  const types: AppointmentType[] = (typeRows ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    durationMinutes: t.duration_minutes,
    priceFrom: t.price_from,
    color: t.color ?? "#d7263d",
    description: "",
  }));

  return {
    id: mp.user_id,
    profile,
    types: types.length ? types : SAMPLE_TYPES,
  };
}

// Занятые интервалы мастера в диапазоне (записи + выходные). Только start/end —
// без персональных данных клиентов. Вызывается на сервере.
export async function getBusyRanges(
  masterId: string,
  fromISO: string,
  toISO: string,
): Promise<{ start: string; end: string }[]> {
  const db = createAdminClient();

  const [{ data: appts }, { data: blocks }] = await Promise.all([
    db
      .from("appointments")
      .select("start_at, end_at")
      .eq("master_id", masterId)
      .in("status", [...BLOCKING_STATUSES])
      .lt("start_at", toISO)
      .gt("end_at", fromISO),
    db
      .from("blocked_slots")
      .select("start_at, end_at")
      .eq("master_id", masterId)
      .lt("start_at", toISO)
      .gt("end_at", fromISO),
  ]);

  return [...(appts ?? []), ...(blocks ?? [])].map((r) => ({
    start: r.start_at as string,
    end: r.end_at as string,
  }));
}

// Типы домена, синхронные со схемой БД (supabase/migrations/001_init_schema.sql).
// Когда подключишь Supabase, можно сгенерировать строгие типы командой:
//   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type AppointmentSize = "S" | "M" | "L";

export interface MasterProfile {
  slug: string;
  name: string;
  tagline: string;
  bio: string;
  studioAddress: string;
  instagram: string;
  avatarUrl?: string | null;
  portfolioImages: PortfolioItem[];
  workingHours: Record<string, [string, string][]>;
}

export interface PortfolioItem {
  id: string;
  title: string;
  style: string;
  url?: string | null; // если null — рисуем стилизованный плейсхолдер
}

export interface AppointmentType {
  id: string;
  name: string;
  durationMinutes: number;
  priceFrom: number | null;
  color: string;
  description: string;
}

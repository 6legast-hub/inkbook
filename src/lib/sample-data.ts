import type { MasterProfile, AppointmentType } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// ВРЕМЕННЫЕ ДАННЫЕ для лендинга.
// Неделя 1: лендинг живёт сразу, без настроенной БД.
// Неделя 2+: заменить на загрузку master_profile / appointment_types
//            из Supabase по slug (см. README → «Следующие шаги»).
// Просто отредактируй под реального мастера.
// ─────────────────────────────────────────────────────────────

export const SAMPLE_MASTER: MasterProfile = {
  slug: "anna-ink",
  name: "Anna Volkova",
  tagline: "Тонкая графика и блэкворк",
  bio: "Тату-мастер с 7 годами практики. Работаю в стилях fine-line, блэкворк и орнаментал. Каждый эскиз — индивидуально под клиента, без флэша из каталога. Стерильность, аккуратность и спокойная атмосфера в студии.",
  studioAddress: "Москва, Большой Козихинский пер., 12 · студия INKROOM",
  instagram: "anna.ink.studio",
  avatarUrl: null,
  workingHours: {
    mon: [["11:00", "20:00"]],
    tue: [["11:00", "20:00"]],
    wed: [["11:00", "20:00"]],
    thu: [["11:00", "20:00"]],
    fri: [["11:00", "18:00"]],
    sat: [],
    sun: [],
  },
  portfolioImages: [
    { id: "p1", title: "Змея и пионы", style: "Блэкворк" },
    { id: "p2", title: "Линейный портрет", style: "Fine-line" },
    { id: "p3", title: "Орнамент на предплечье", style: "Орнаментал" },
    { id: "p4", title: "Минимал-ветка", style: "Fine-line" },
    { id: "p5", title: "Геометрия", style: "Блэкворк" },
    { id: "p6", title: "Бабочка", style: "Fine-line" },
  ],
};

export const SAMPLE_TYPES: AppointmentType[] = [
  {
    id: "t1",
    name: "Консультация",
    durationMinutes: 30,
    priceFrom: 0,
    color: "#d7263d",
    description: "Обсудим идею, подберём размер и место, сориентирую по цене.",
  },
  {
    id: "t2",
    name: "Маленькая тату",
    durationMinutes: 120,
    priceFrom: 6000,
    color: "#e0a458",
    description: "До 10 см. Fine-line, минимал, надписи.",
  },
  {
    id: "t3",
    name: "Средний сеанс",
    durationMinutes: 240,
    priceFrom: 14000,
    color: "#5b8c5a",
    description: "Проработанная работа за один заход.",
  },
  {
    id: "t4",
    name: "Большая работа",
    durationMinutes: 300,
    priceFrom: 22000,
    color: "#4361ee",
    description: "Рукав, спина — обычно в несколько сеансов.",
  },
];

// Глобальные настройки записи.
// Когда станет мультимастерским — перенести в master_profile.

// Таймзона студии. Все рабочие часы и слоты считаются в ней,
// в БД хранится timestamptz (UTC). Поменяй под свой город.
export const STUDIO_TIMEZONE = "Europe/Moscow";

// Шаг сетки слотов в минутах (через сколько может начинаться запись).
export const SLOT_STEP_MINUTES = 30;

// На сколько дней вперёд открыта запись.
export const BOOKING_WINDOW_DAYS = 30;

// Загрузка референсов.
export const MAX_REFERENCES = 5;
export const MAX_REFERENCE_MB = 8;
export const REFERENCES_BUCKET = "references";

// Какие статусы записи «занимают» слот (нельзя поверх записаться).
export const BLOCKING_STATUSES = ["pending", "confirmed"] as const;

// Slug мастера по умолчанию (single-master MVP). Должен совпадать
// со slug в master_profile и со slug в sample-data.
export const DEFAULT_MASTER_SLUG = "anna-ink";

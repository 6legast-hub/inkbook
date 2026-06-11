-- ============================================================
-- INK BOOK — поля для уведомлений и напоминаний
-- Migration: 003_notifications.sql
-- ============================================================
alter table public.appointments
  add column if not exists client_email  text,
  add column if not exists reminded_24h   boolean not null default false,
  add column if not exists reminded_1h    boolean not null default false;

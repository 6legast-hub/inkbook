-- ============================================================
-- INK BOOK — initial database schema (Supabase / Postgres)
-- Migration: 001_init_schema.sql
-- ------------------------------------------------------------
-- Вставь целиком в Supabase SQL Editor и нажми Run.
-- Дизайн-решение: вместо собственной таблицы `users` используем
-- штатную auth.users (Supabase Auth) + таблицу profiles, привязанную
-- к ней через id. Так авторизация работает из коробки, а профиль
-- расширяет данные пользователя.
-- ============================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---------- Enums ----------
create type user_role as enum ('master', 'client');

create type appointment_status as enum (
  'pending',     -- заявка создана, ждёт подтверждения мастера
  'confirmed',   -- мастер подтвердил
  'completed',   -- сеанс прошёл
  'cancelled',   -- отменена (клиентом или мастером)
  'no_show'      -- клиент не пришёл
);

-- ============================================================
-- profiles — расширение auth.users
-- ============================================================
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  role              user_role   not null default 'client',
  email             text,
  phone             text,
  telegram_username text,
  name              text,
  avatar_url        text,
  created_at        timestamptz not null default now()
);

-- ============================================================
-- master_profile — публичная страница-визитка мастера
-- ============================================================
create table public.master_profile (
  user_id          uuid primary key references public.profiles (id) on delete cascade,
  bio              text,
  studio_address   text,
  instagram        text,
  portfolio_images text[] default '{}',                   -- URL из Storage
  working_hours    jsonb  default '{}'::jsonb,            -- { "mon": [["10:00","20:00"]], "tue": [...], ... }
  slug             text   unique,                          -- для красивого URL: /m/anna-ink
  created_at       timestamptz not null default now()
);

-- ============================================================
-- appointment_types — виды услуг (консультация / маленькая / большая)
-- ============================================================
create table public.appointment_types (
  id               uuid primary key default gen_random_uuid(),
  master_id        uuid not null references public.profiles (id) on delete cascade,
  name             text not null,
  duration_minutes int  not null check (duration_minutes > 0),
  price_from       int,                                    -- в минимальных единицах валюты (₽)
  color            text default '#6366f1',                 -- для отрисовки в календаре
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create index appointment_types_master_idx on public.appointment_types (master_id);

-- ============================================================
-- appointments — сами записи
-- ============================================================
create table public.appointments (
  id                  uuid primary key default gen_random_uuid(),
  master_id           uuid not null references public.profiles (id) on delete cascade,
  client_id           uuid references public.profiles (id) on delete set null, -- может быть null для гостевой записи
  type_id             uuid references public.appointment_types (id) on delete set null,
  -- денормализованные контакты клиента (для гостевой записи без регистрации)
  client_name         text,
  client_phone        text,
  client_telegram     text,
  start_at            timestamptz not null,
  end_at              timestamptz not null,
  status              appointment_status not null default 'pending',
  description         text,
  body_part           text,
  size                text,                                -- 'S' | 'M' | 'L' (валидируем в приложении)
  reference_urls      text[] default '{}',
  master_notes        text,                                -- приватно, видит только мастер
  cancellation_reason text,
  access_token        uuid not null default gen_random_uuid(), -- магическая ссылка для клиента без регистрации
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (end_at > start_at)
);

create index appointments_master_idx     on public.appointments (master_id);
create index appointments_client_idx     on public.appointments (client_id);
create index appointments_start_idx      on public.appointments (start_at);
create index appointments_token_idx      on public.appointments (access_token);

-- ============================================================
-- blocked_slots — выходные, отпуск, перерывы
-- ============================================================
create table public.blocked_slots (
  id         uuid primary key default gen_random_uuid(),
  master_id  uuid not null references public.profiles (id) on delete cascade,
  start_at   timestamptz not null,
  end_at     timestamptz not null,
  reason     text,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

create index blocked_slots_master_idx on public.blocked_slots (master_id);

-- ============================================================
-- messages — чат клиент/мастер (v2)
-- ============================================================
create table public.messages (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  sender_id      uuid references public.profiles (id) on delete set null,
  content        text not null,
  created_at     timestamptz not null default now()
);

create index messages_appointment_idx on public.messages (appointment_id);

-- ============================================================
-- updated_at trigger для appointments
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- ============================================================
-- Автосоздание profile при регистрации в auth.users
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
-- Принцип:
--   * клиент видит и правит только своё;
--   * мастер видит и правит только своё хозяйство;
--   * публичные данные (визитка, услуги) читают все, в т.ч. анонимы;
--   * ГОСТЕВАЯ запись без регистрации делается на сервере через
--     service_role key (он обходит RLS) — поэтому INSERT в appointments
--     анонимам напрямую НЕ открываем. Так безопаснее.
-- ============================================================

alter table public.profiles          enable row level security;
alter table public.master_profile    enable row level security;
alter table public.appointment_types enable row level security;
alter table public.appointments      enable row level security;
alter table public.blocked_slots     enable row level security;
alter table public.messages          enable row level security;

-- ---------- helper: текущий пользователь — мастер? ----------
create or replace function public.is_master()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'master'
  );
$$;

-- ---------- profiles ----------
create policy "profiles: владелец читает своё"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: владелец правит своё"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles: мастер читает профили своих клиентов"
  on public.profiles for select
  using (
    exists (
      select 1 from public.appointments a
      where a.master_id = auth.uid()
        and a.client_id = profiles.id
    )
  );

-- ---------- master_profile ----------
create policy "master_profile: публичное чтение"
  on public.master_profile for select
  using (true);

create policy "master_profile: мастер правит своё"
  on public.master_profile for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- appointment_types ----------
create policy "appointment_types: публичное чтение активных"
  on public.appointment_types for select
  using (is_active = true or auth.uid() = master_id);

create policy "appointment_types: мастер управляет своими"
  on public.appointment_types for all
  using (auth.uid() = master_id)
  with check (auth.uid() = master_id);

-- ---------- appointments ----------
create policy "appointments: клиент видит свои"
  on public.appointments for select
  using (auth.uid() = client_id);

create policy "appointments: мастер видит свои"
  on public.appointments for select
  using (auth.uid() = master_id);

create policy "appointments: мастер управляет своими"
  on public.appointments for update
  using (auth.uid() = master_id)
  with check (auth.uid() = master_id);

-- INSERT для зарегистрированного клиента (гостевые — через service_role на сервере)
create policy "appointments: клиент создаёт свою запись"
  on public.appointments for insert
  with check (auth.uid() = client_id);

-- ---------- blocked_slots ----------
create policy "blocked_slots: публичное чтение (для расчёта свободных окон)"
  on public.blocked_slots for select
  using (true);

create policy "blocked_slots: мастер управляет своими"
  on public.blocked_slots for all
  using (auth.uid() = master_id)
  with check (auth.uid() = master_id);

-- ---------- messages ----------
create policy "messages: участники записи читают"
  on public.messages for select
  using (
    exists (
      select 1 from public.appointments a
      where a.id = messages.appointment_id
        and (a.master_id = auth.uid() or a.client_id = auth.uid())
    )
  );

create policy "messages: участники записи пишут"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.appointments a
      where a.id = messages.appointment_id
        and (a.master_id = auth.uid() or a.client_id = auth.uid())
    )
  );

-- ============================================================
-- Конец миграции 001
-- ============================================================

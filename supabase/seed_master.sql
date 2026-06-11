-- ============================================================
-- INK BOOK — завести мастера в БД (выполнить ОДИН раз)
-- ============================================================
-- Порядок:
-- 1. Мастер регистрируется на сайте (email+пароль) — появится строка в auth.users.
-- 2. Узнай его user_id:
--      select id, email from auth.users order by created_at desc;
-- 3. Вставь этот id вместо <MASTER_USER_ID> ниже и выполни весь скрипт.
-- 4. slug 'anna-ink' должен совпадать с DEFAULT_MASTER_SLUG в src/lib/config.ts.
-- ============================================================

-- роль мастера
update public.profiles
set role = 'master', name = 'Anna Volkova'
where id = '<MASTER_USER_ID>';

-- публичная визитка + рабочие часы
insert into public.master_profile
  (user_id, slug, bio, studio_address, instagram, portfolio_images, working_hours)
values (
  '<MASTER_USER_ID>',
  'anna-ink',
  'Тату-мастер, fine-line / блэкворк / орнаментал. Каждый эскиз индивидуально.',
  'Москва, Большой Козихинский пер., 12 · студия INKROOM',
  'anna.ink.studio',
  '{}',
  '{"mon":[["11:00","20:00"]],"tue":[["11:00","20:00"]],"wed":[["11:00","20:00"]],"thu":[["11:00","20:00"]],"fri":[["11:00","18:00"]],"sat":[],"sun":[]}'::jsonb
)
on conflict (user_id) do update
  set slug = excluded.slug,
      bio = excluded.bio,
      studio_address = excluded.studio_address,
      instagram = excluded.instagram,
      working_hours = excluded.working_hours;

-- услуги
insert into public.appointment_types
  (master_id, name, duration_minutes, price_from, color)
values
  ('<MASTER_USER_ID>', 'Консультация',   30,  0,     '#d7263d'),
  ('<MASTER_USER_ID>', 'Маленькая тату', 120, 6000,  '#e0a458'),
  ('<MASTER_USER_ID>', 'Средний сеанс',  240, 14000, '#5b8c5a'),
  ('<MASTER_USER_ID>', 'Большая работа', 300, 22000, '#4361ee');

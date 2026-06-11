# INK BOOK

Онлайн-запись к тату-мастеру. Клиент выбирает услугу и свободное время, оставляет заявку с референсами — мастер ведёт записи в кабинете и получает уведомления.

**Стек:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Auth + Storage) · Zod · Telegram Bot API · Resend · Vercel. Всё на бесплатных тарифах.

> ## 📖 Устанавливаешь? Открой **[SETUP.md](./SETUP.md)** — пошаговая инструкция с нуля, без программирования.

---

## MVP готов (Недели 1–4)

- **Неделя 1 — фундамент:** каркас, тёмная тема, лендинг мастера, клиенты Supabase, схема БД с RLS.
- **Неделя 2 — запись:** `/book` (услуга → дата/слот → форма с референсами), расчёт свободных окон с учётом таймзоны/часов/занятости/выходных, «магическая ссылка» статуса для клиента.
- **Неделя 3 — кабинет:** вход, защита по роли, дашборд, заявки и карточки, действия (подтвердить/перенести/отменить/завершить), расписание, клиенты с историей.
- **Неделя 4 — уведомления:** Telegram мастеру о новой заявке, email клиенту при подтверждении, напоминания за 24 ч и 1 ч, keep-alive для Supabase. Все каналы опциональны и не ломают приложение, если не настроены.

---

## Запуск локально

```bash
npm install
cp .env.example .env.local   # заполнить по SETUP.md
npm run dev                  # http://localhost:3000
```

Лендинг и шаги записи работают и без БД (демо-данные). Кабинет, отправка заявок и уведомления требуют настроенного Supabase (см. SETUP.md).

---

## Как работают напоминания (важно про бесплатный тариф)

Бесплатный Vercel Cron запускается максимум раз в сутки — для «за 1 час» этого мало. Поэтому эндпоинт `/api/cron/reminders` идемпотентный (каждую заявку напоминает один раз) и дёргается **внешним планировщиком cron-job.org раз в 30 минут** (бесплатно). Он же будит Supabase, чтобы проект не «засыпал» после 7 дней. В `vercel.json` оставлен ещё и ежедневный запуск как резерв. Настройка — шаг 7 в SETUP.md.

---

## Структура

```
src/app/
  page.tsx                       лендинг
  login/page.tsx                 вход мастера
  book/ (page, booking-flow, actions)   запись + уведомление мастеру
  booking/[token]/page.tsx       статус заявки для клиента
  api/availability/route.ts      свободные слоты
  api/cron/reminders/route.ts    напоминания 24ч/1ч + keep-alive
  cabinet/ (layout, page, appointments, schedule, clients, actions)
src/lib/
  auth.ts, availability.ts, data.ts, format.ts
  booking-schema.ts, config.ts, notify.ts
  supabase/ (server, client, admin, middleware)
src/components/
  ui/button.tsx · landing/portfolio-tile.tsx
  cabinet/ (status-badge, appointment-actions, notes-editor)
supabase/
  migrations/001_init_schema.sql · 002_storage.sql · 003_notifications.sql
  seed_master.sql
vercel.json                      резервный ежедневный cron
SETUP.md                         инструкция по установке
```

---

## Настройки под себя

- `src/lib/config.ts` — `STUDIO_TIMEZONE` (таймзона студии), `SLOT_STEP_MINUTES` (шаг слотов), `BOOKING_WINDOW_DAYS`, `DEFAULT_MASTER_SLUG`.
- Данные мастера, услуги, рабочие часы — меняются в кабинете или в `seed_master.sql`.
- Внешний вид/тексты лендинга — `src/app/page.tsx` и `src/lib/sample-data.ts`.

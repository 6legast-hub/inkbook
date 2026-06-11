-- ============================================================
-- INK BOOK — Storage для референсов клиентов
-- Migration: 002_storage.sql
-- ============================================================
-- Публичный бакет: ссылки на файлы — случайные UUID, угадать нельзя.
-- Загрузка идёт с сервера через service_role (обходит RLS), поэтому
-- отдельные insert-политики для гостевой загрузки не нужны.

insert into storage.buckets (id, name, public)
values ('references', 'references', true)
on conflict (id) do nothing;

-- Публичное чтение объектов из бакета references (для показа мастеру/клиенту).
create policy "references: публичное чтение"
  on storage.objects for select
  using (bucket_id = 'references');

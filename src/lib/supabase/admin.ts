// Сервисный клиент — ТОЛЬКО на сервере. Обходит RLS.
// Использовать для гостевой записи без регистрации и системных задач.
// НИКОГДА не импортировать в клиентский код.
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function configured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

// Гарантирует, что текущий пользователь — авторизованный мастер.
// Иначе редиректит на /login. Возвращает session-клиент (уважает RLS) и данные.
export async function requireMaster() {
  if (!configured()) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "master") redirect("/login");

  return { supabase, userId: user.id, name: (profile.name as string) ?? "Мастер" };
}

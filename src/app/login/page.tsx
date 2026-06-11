"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const configured =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError("Не вышло войти. Проверь почту и пароль.");
        setPending(false);
        return;
      }
      router.push("/cabinet");
      router.refresh();
    } catch {
      setError("Ошибка соединения с сервером.");
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <span className="display text-3xl tracking-wide">
        INK<span className="text-blood">BOOK</span>
      </span>
      <h1 className="display mt-6 text-5xl">Кабинет мастера</h1>
      <p className="mt-2 text-bone-dim">Вход для мастера.</p>

      {!configured && (
        <p className="mt-6 border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-400">
          Supabase не настроен. Заполни <code>.env.local</code> по README, тогда
          вход заработает.
        </p>
      )}

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label className="label mb-2 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-ink-700 bg-ink-900 px-4 py-3 text-bone outline-none transition-colors focus:border-blood"
          />
        </div>
        <div>
          <label className="label mb-2 block">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-ink-700 bg-ink-900 px-4 py-3 text-bone outline-none transition-colors focus:border-blood"
          />
        </div>

        {error && (
          <p className="border border-blood/40 bg-blood/10 px-4 py-3 text-sm text-blood">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? "Вхожу…" : "Войти"}
        </Button>
      </form>
    </main>
  );
}

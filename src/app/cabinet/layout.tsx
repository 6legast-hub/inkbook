import Link from "next/link";
import { requireMaster } from "@/lib/auth";
import { signOut } from "./actions";

const NAV = [
  { href: "/cabinet", label: "Сегодня" },
  { href: "/cabinet/appointments", label: "Заявки" },
  { href: "/cabinet/schedule", label: "Расписание" },
  { href: "/cabinet/clients", label: "Клиенты" },
];

export default async function CabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { name } = await requireMaster();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/cabinet" className="display text-2xl tracking-wide">
            INK<span className="text-blood">BOOK</span>
          </Link>
          <nav className="flex flex-1 flex-wrap gap-5 text-xs uppercase tracking-widest text-bone-dim">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-bone">
                {n.label}
              </Link>
            ))}
          </nav>
          <form action={signOut}>
            <button className="text-xs uppercase tracking-widest text-bone-faint hover:text-blood">
              Выйти
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <p className="label mb-8">{name}</p>
        {children}
      </div>
    </div>
  );
}

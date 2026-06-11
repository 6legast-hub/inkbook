import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PortfolioTile } from "@/components/landing/portfolio-tile";
import { SAMPLE_MASTER, SAMPLE_TYPES } from "@/lib/sample-data";
import { formatPrice } from "@/lib/utils";

const DAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Пн" },
  { key: "tue", label: "Вт" },
  { key: "wed", label: "Ср" },
  { key: "thu", label: "Чт" },
  { key: "fri", label: "Пт" },
  { key: "sat", label: "Сб" },
  { key: "sun", label: "Вс" },
];

export default function Home() {
  const master = SAMPLE_MASTER;
  const types = SAMPLE_TYPES;

  return (
    <main className="relative">
      {/* ── NAV ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="display text-2xl tracking-wide">
            INK<span className="text-blood">BOOK</span>
          </span>
          <nav className="hidden gap-8 text-xs uppercase tracking-widest text-bone-dim md:flex">
            <a href="#work" className="transition-colors hover:text-bone">
              Работы
            </a>
            <a href="#services" className="transition-colors hover:text-bone">
              Услуги
            </a>
            <a href="#studio" className="transition-colors hover:text-bone">
              Студия
            </a>
          </nav>
          <Button size="sm" asChild>
            <Link href="/book">Записаться</Link>
          </Button>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20 md:pt-32">
        <div className="pointer-events-none absolute -right-32 top-0 select-none text-[40vw] leading-none text-ink-900 md:text-[28vw]">
          ✦
        </div>
        <div className="mx-auto max-w-6xl">
          <p className="label animate-fade-up">{master.tagline}</p>
          <h1 className="display mt-6 text-[18vw] leading-[0.8] animate-fade-up md:text-[12rem]">
            {master.name.split(" ").map((word, i) => (
              <span key={i} className="block">
                {i === 1 ? <span className="text-blood">{word}</span> : word}
              </span>
            ))}
          </h1>
          <div
            className="mt-10 grid max-w-3xl gap-8 animate-fade-up md:grid-cols-[2fr_1fr]"
            style={{ animationDelay: "120ms" }}
          >
            <p className="text-lg leading-relaxed text-bone-dim">
              {master.bio}
            </p>
            <div className="flex flex-col gap-3">
              <Button size="lg" asChild>
                <Link href="/book">Выбрать время</Link>
              </Button>
              <a
                href={`https://instagram.com/${master.instagram}`}
                className="text-center text-xs uppercase tracking-widest text-bone-faint transition-colors hover:text-blood"
              >
                @{master.instagram}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── PORTFOLIO ─────────────────────────────────── */}
      <section id="work" className="hairline px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex items-end justify-between">
            <h2 className="display text-6xl md:text-8xl">Работы</h2>
            <span className="label hidden md:block">
              {master.portfolioImages.length} избранных
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {master.portfolioImages.map((item, i) => (
              <PortfolioTile key={item.id} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES / PRICING ────────────────────────── */}
      <section id="services" className="hairline px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="display mb-12 text-6xl md:text-8xl">Услуги</h2>
          <div className="divide-y divide-ink-800 border-y border-ink-800">
            {types.map((t) => (
              <div
                key={t.id}
                className="group flex flex-col gap-2 py-7 transition-colors hover:bg-ink-900/40 md:flex-row md:items-center md:gap-8 md:px-2"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <div className="md:w-64">
                  <h3 className="display text-3xl">{t.name}</h3>
                  <p className="label mt-1">
                    {t.durationMinutes >= 60
                      ? `${Math.round((t.durationMinutes / 60) * 10) / 10} ч`
                      : `${t.durationMinutes} мин`}
                  </p>
                </div>
                <p className="flex-1 text-bone-dim">{t.description}</p>
                <p className="display text-3xl text-blood md:w-40 md:text-right">
                  {t.priceFrom ? `от ${formatPrice(t.priceFrom)}` : "бесплатно"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STUDIO / HOURS ────────────────────────────── */}
      <section id="studio" className="hairline px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
          <div>
            <h2 className="display mb-8 text-6xl md:text-8xl">Студия</h2>
            <p className="mb-2 text-lg text-bone">{master.studioAddress}</p>
            <p className="text-bone-faint">
              Запись по предварительному согласованию. Точный адрес и детали
              приходят после подтверждения.
            </p>
          </div>
          <div>
            <p className="label mb-6">График работы</p>
            <ul className="space-y-3">
              {DAYS.map((d) => {
                const hours = master.workingHours[d.key] ?? [];
                const isOpen = hours.length > 0;
                return (
                  <li
                    key={d.key}
                    className="flex items-center justify-between border-b border-ink-800 pb-3 text-sm"
                  >
                    <span className="uppercase tracking-widest text-bone-dim">
                      {d.label}
                    </span>
                    <span
                      className={isOpen ? "text-bone" : "text-bone-faint"}
                    >
                      {isOpen
                        ? hours.map((h) => `${h[0]}–${h[1]}`).join(", ")
                        : "выходной"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* ── BOOKING CTA ───────────────────────────────── */}
      <section id="book" className="hairline px-6 py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="label mb-6">Запись</p>
          <h2 className="display text-6xl leading-[0.9] md:text-8xl">
            Выбери свободное
            <br />
            <span className="text-blood">окно</span> и приходи
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-bone-dim">
            Выбираешь услугу и свободное окно, заполняешь заявку с описанием и
            референсами — мастер подтверждает время в Telegram.
          </p>
          <div className="mt-10">
            <Button size="lg" asChild>
              <Link href="/book">Выбрать время и записаться</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer className="border-t border-ink-800 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs uppercase tracking-widest text-bone-faint md:flex-row">
          <span>
            INK<span className="text-blood">BOOK</span> · {master.name}
          </span>
          <Link href="/login" className="hover:text-blood">Кабинет мастера</Link>
        </div>
      </footer>
    </main>
  );
}

import type { Metadata } from "next";
import { Oswald, Golos_Text } from "next/font/google";
import "./globals.css";

// Oswald — конденсед-гротеск с кириллицей (замена Bebas Neue для RU-заголовков).
const display = Oswald({
  weight: ["500", "600"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
});

// Golos Text — чистый кириллический гротеск российского дизайна.
const body = Golos_Text({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "INK BOOK — запись к мастеру",
  description:
    "Онлайн-запись к тату-мастеру: свободные слоты, референсы, подтверждение в Telegram.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable}`}>
      <body className="grain min-h-screen">{children}</body>
    </html>
  );
}

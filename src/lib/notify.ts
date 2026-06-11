import "server-only";

// Все функции «тихие»: если канал не настроен или упал — не ломают основной поток.

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_MASTER = process.env.TELEGRAM_MASTER_CHAT_ID;
const RESEND_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM ?? "INK BOOK <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

async function tgSend(chatId: string, text: string) {
  if (!TG_TOKEN || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch {
    /* игнорируем сбой уведомления */
  }
}

async function emailSend(to: string, subject: string, html: string) {
  if (!RESEND_KEY || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
    });
  } catch {
    /* игнорируем сбой письма */
  }
}

// ── Мастеру: новая заявка ──────────────────────────────────────
export async function notifyMasterNewBooking(a: {
  name: string;
  phone: string;
  telegram?: string | null;
  typeName: string;
  whenStr: string;
  bodyPart: string;
  apptId: string;
}) {
  if (!TG_MASTER) return;
  const link = APP_URL ? `\n${APP_URL}/cabinet/appointments/${a.apptId}` : "";
  const tg = a.telegram ? `\nTelegram: ${a.telegram}` : "";
  await tgSend(
    TG_MASTER,
    `🖊 <b>Новая заявка</b>\n\n` +
      `<b>${a.name}</b>\n` +
      `${a.typeName} · ${a.bodyPart}\n` +
      `🗓 ${a.whenStr}\n` +
      `☎️ ${a.phone}${tg}` +
      `${link}`,
  );
}

// ── Клиенту: подтверждение ─────────────────────────────────────
export async function notifyClientConfirmed(a: {
  email?: string | null;
  name: string;
  whenStr: string;
  token: string;
}) {
  if (!a.email) return;
  const link = APP_URL ? `${APP_URL}/booking/${a.token}` : "";
  await emailSend(
    a.email,
    "Запись подтверждена · INK BOOK",
    `<p>${a.name}, мастер подтвердил твою запись.</p>` +
      `<p><b>${a.whenStr}</b></p>` +
      (link ? `<p>Статус и детали: <a href="${link}">${link}</a></p>` : "") +
      `<p>До встречи!</p>`,
  );
}

// ── Клиенту: напоминание ───────────────────────────────────────
export async function notifyClientReminder(a: {
  email?: string | null;
  name: string;
  whenStr: string;
  token: string;
  hours: 24 | 1;
}) {
  if (!a.email) return;
  const link = APP_URL ? `${APP_URL}/booking/${a.token}` : "";
  const lead = a.hours === 24 ? "завтра" : "через час";
  await emailSend(
    a.email,
    `Напоминание о записи (${lead}) · INK BOOK`,
    `<p>${a.name}, напоминаем: запись ${lead}.</p>` +
      `<p><b>${a.whenStr}</b></p>` +
      (link ? `<p>Детали: <a href="${link}">${link}</a></p>` : "") +
      (a.hours === 1
        ? `<p>Если не сможешь — дай знать мастеру заранее.</p>`
        : ""),
  );
}

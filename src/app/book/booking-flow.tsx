"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBooking, type BookingResult } from "./actions";
import { SIZE_LABELS } from "@/lib/booking-schema";
import { formatSlotTime } from "@/lib/availability";
import { STUDIO_TIMEZONE, MAX_REFERENCES } from "@/lib/config";
import { formatPrice } from "@/lib/utils";
import type { AppointmentType } from "@/lib/types";

export interface DayOption {
  date: string; // YYYY-MM-DD
  label: string; // «пн 2 июн»
  open: boolean;
}

type Step = 1 | 2 | 3;

export function BookingFlow({
  types,
  days,
}: {
  types: AppointmentType[];
  days: DayOption[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [type, setType] = useState<AppointmentType | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);

  const [slots, setSlots] = useState<string[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [state, formAction, pending] = useActionState<BookingResult | null, FormData>(
    createBooking,
    null,
  );

  // редирект на страницу подтверждения после успеха
  useEffect(() => {
    if (state?.ok && state.token) router.push(`/booking/${state.token}`);
  }, [state, router]);

  // подгрузка слотов при выборе даты
  useEffect(() => {
    if (!date || !type) return;
    setLoadingSlots(true);
    setSlot(null);
    fetch(`/api/availability?date=${date}&typeId=${type.id}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date, type]);

  return (
    <div className="mt-12">
      <Stepper step={step} />

      {/* ШАГ 1 — услуга */}
      {step === 1 && (
        <div className="mt-8 space-y-3">
          {types.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setType(t);
                setStep(2);
              }}
              className="group flex w-full items-center justify-between border border-ink-700 px-5 py-5 text-left transition-colors hover:border-blood"
            >
              <span className="flex items-center gap-4">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span>
                  <span className="display block text-2xl">{t.name}</span>
                  <span className="label">
                    {t.durationMinutes >= 60
                      ? `${Math.round((t.durationMinutes / 60) * 10) / 10} ч`
                      : `${t.durationMinutes} мин`}
                  </span>
                </span>
              </span>
              <span className="display text-2xl text-blood">
                {t.priceFrom ? `от ${formatPrice(t.priceFrom)}` : "бесплатно"}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ШАГ 2 — дата и время */}
      {step === 2 && type && (
        <div className="mt-8">
          <BackLink onClick={() => setStep(1)}>{type.name}</BackLink>

          <p className="label mt-6 mb-3">Дата</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {days.map((d) => (
              <button
                key={d.date}
                disabled={!d.open}
                onClick={() => setDate(d.date)}
                className={[
                  "border px-2 py-3 text-sm transition-colors",
                  !d.open
                    ? "cursor-not-allowed border-ink-800 text-ink-600"
                    : date === d.date
                      ? "border-blood bg-blood/10 text-bone"
                      : "border-ink-700 text-bone-dim hover:border-blood",
                ].join(" ")}
              >
                {d.label}
              </button>
            ))}
          </div>

          {date && (
            <>
              <p className="label mb-3 mt-8">Время</p>
              {loadingSlots ? (
                <p className="text-bone-faint">Загружаю свободные окна…</p>
              ) : slots && slots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {slots.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSlot(s);
                        setStep(3);
                      }}
                      className="border border-ink-700 py-3 text-sm tabular-nums text-bone-dim transition-colors hover:border-blood hover:text-bone"
                    >
                      {formatSlotTime(s, STUDIO_TIMEZONE)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-bone-faint">
                  На этот день свободных окон нет — выбери другую дату.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* ШАГ 3 — данные и референсы */}
      {step === 3 && type && slot && (
        <form action={formAction} className="mt-8 space-y-5">
          <BackLink onClick={() => setStep(2)}>
            {type.name} ·{" "}
            {new Intl.DateTimeFormat("ru-RU", {
              timeZone: STUDIO_TIMEZONE,
              day: "numeric",
              month: "long",
            }).format(new Date(slot))}{" "}
            в {formatSlotTime(slot, STUDIO_TIMEZONE)}
          </BackLink>

          <input type="hidden" name="typeId" value={type.id} />
          <input type="hidden" name="startAt" value={slot} />

          <Field label="Имя" name="name" error={state?.fieldErrors?.name} required />
          <Field
            label="Телефон"
            name="phone"
            type="tel"
            placeholder="+7 999 123-45-67"
            error={state?.fieldErrors?.phone}
            required
          />
          <Field
            label="Telegram (по желанию)"
            name="telegram"
            placeholder="@username"
            error={state?.fieldErrors?.telegram}
          />
          <Field
            label="Email (по желанию — для напоминаний)"
            name="email"
            type="email"
            placeholder="you@example.com"
            error={state?.fieldErrors?.email}
          />

          <div>
            <label className="label mb-2 block">Размер</label>
            <div className="grid grid-cols-3 gap-2">
              {(["S", "M", "L"] as const).map((s) => (
                <label
                  key={s}
                  className="flex cursor-pointer items-center justify-center border border-ink-700 py-3 text-sm text-bone-dim transition-colors has-[:checked]:border-blood has-[:checked]:text-bone"
                >
                  <input type="radio" name="size" value={s} className="sr-only" />
                  {SIZE_LABELS[s]}
                </label>
              ))}
            </div>
            {state?.fieldErrors?.size && <ErrText>{state.fieldErrors.size}</ErrText>}
          </div>

          <Field
            label="Место на теле"
            name="bodyPart"
            placeholder="предплечье, голень…"
            error={state?.fieldErrors?.bodyPart}
            required
          />

          <div>
            <label className="label mb-2 block">Описание идеи</label>
            <textarea
              name="description"
              rows={4}
              placeholder="Что хочешь, стиль, размер, пожелания…"
              className="w-full border border-ink-700 bg-ink-900 px-4 py-3 text-bone outline-none transition-colors focus:border-blood"
            />
          </div>

          <div>
            <label className="label mb-2 block">
              Референсы (до {MAX_REFERENCES} фото)
            </label>
            <input
              type="file"
              name="references"
              accept="image/*"
              multiple
              className="block w-full text-sm text-bone-dim file:mr-4 file:border file:border-ink-600 file:bg-ink-800 file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-widest file:text-bone hover:file:border-blood"
            />
          </div>

          {state && !state.ok && state.error && (
            <p className="border border-blood/40 bg-blood/10 px-4 py-3 text-sm text-blood">
              {state.error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={pending} className="w-full">
            {pending ? "Отправляю…" : "Отправить заявку"}
          </Button>
        </form>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const labels = ["Услуга", "Время", "Данные"];
  return (
    <div className="flex gap-2">
      {labels.map((l, i) => (
        <div key={l} className="flex-1">
          <div
            className={`h-0.5 ${i < step ? "bg-blood" : "bg-ink-700"}`}
          />
          <span
            className={`mt-2 block text-xs uppercase tracking-widest ${
              i < step ? "text-bone" : "text-bone-faint"
            }`}
          >
            {l}
          </span>
        </div>
      ))}
    </div>
  );
}

function BackLink({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="label transition-colors hover:text-blood"
    >
      ← {children}
    </button>
  );
}

function ErrText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-blood">{children}</p>;
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  error,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label mb-2 block">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full border border-ink-700 bg-ink-900 px-4 py-3 text-bone outline-none transition-colors focus:border-blood"
      />
      {error && <ErrText>{error}</ErrText>}
    </div>
  );
}

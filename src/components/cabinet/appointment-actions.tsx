"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setStatus, reschedule } from "@/app/cabinet/actions";

export function AppointmentActions({
  id,
  status,
  compact = false,
}: {
  id: string;
  status: string;
  compact?: boolean;
}) {
  const [pending, start] = useTransition();
  const [showCancel, setShowCancel] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [reason, setReason] = useState("");
  const [newTime, setNewTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  const act = (fn: () => Promise<unknown>) => start(() => void fn());

  // компактный вид — только «подтвердить» для pending (для списков)
  if (compact) {
    if (status !== "pending") return null;
    return (
      <Button
        size="sm"
        disabled={pending}
        onClick={() => act(() => setStatus(id, "confirmed"))}
      >
        Подтвердить
      </Button>
    );
  }

  const isOpen = status === "pending" || status === "confirmed";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {status === "pending" && (
          <Button
            disabled={pending}
            onClick={() => act(() => setStatus(id, "confirmed"))}
          >
            Подтвердить
          </Button>
        )}
        {status === "confirmed" && (
          <>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => act(() => setStatus(id, "completed"))}
            >
              Завершено
            </Button>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => act(() => setStatus(id, "no_show"))}
            >
              Не пришёл
            </Button>
          </>
        )}
        {isOpen && (
          <>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                setShowReschedule((v) => !v);
                setShowCancel(false);
              }}
            >
              Перенести
            </Button>
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setShowCancel((v) => !v);
                setShowReschedule(false);
              }}
            >
              Отменить
            </Button>
          </>
        )}
      </div>

      {showReschedule && (
        <div className="space-y-2 border border-ink-700 p-4">
          <label className="label block">Новое время</label>
          <input
            type="datetime-local"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="border border-ink-700 bg-ink-900 px-3 py-2 text-bone outline-none focus:border-blood"
          />
          {error && <p className="text-xs text-blood">{error}</p>}
          <div>
            <Button
              size="sm"
              disabled={pending || !newTime}
              onClick={() =>
                act(async () => {
                  setError(null);
                  const r = await reschedule(id, newTime);
                  if (!r.ok) setError(r.error ?? "Не удалось перенести");
                  else setShowReschedule(false);
                })
              }
            >
              Перенести
            </Button>
          </div>
        </div>
      )}

      {showCancel && (
        <div className="space-y-2 border border-blood/40 p-4">
          <label className="label block">Причина отмены (для статистики)</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="клиент передумал, перенос…"
            className="w-full border border-ink-700 bg-ink-900 px-3 py-2 text-bone outline-none focus:border-blood"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              act(async () => {
                await setStatus(id, "cancelled", reason);
                setShowCancel(false);
              })
            }
          >
            Подтвердить отмену
          </Button>
        </div>
      )}
    </div>
  );
}

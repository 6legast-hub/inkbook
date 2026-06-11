"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { saveNotes } from "@/app/cabinet/actions";

export function NotesEditor({
  id,
  initial,
}: {
  id: string;
  initial: string;
}) {
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        rows={4}
        placeholder="Приватные заметки: аллергии, особенности кожи, договорённости…"
        className="w-full border border-ink-700 bg-ink-900 px-4 py-3 text-bone outline-none transition-colors focus:border-blood"
      />
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await saveNotes(id, value);
              setSaved(true);
            })
          }
        >
          {pending ? "Сохраняю…" : "Сохранить заметку"}
        </Button>
        {saved && <span className="text-xs text-emerald-400">Сохранено</span>}
      </div>
    </div>
  );
}

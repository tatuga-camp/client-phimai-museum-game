"use client";
import { useState } from "react";
import type { Task } from "@/types";

type Item = { id: string; label: string; imageUrl?: string };
type Props = {
  task: Task;
  submit: (p: Record<string, unknown>) => Promise<void>;
  error: string;
};

export default function ReorderTask({ task, submit }: Props) {
  const initial = (task.content as { items: Item[] }).items;
  const [items, setItems] = useState<Item[]>(initial);
  const [busy, setBusy] = useState(false);

  const move = (i: number, dir: -1 | 1) =>
    setItems((arr) => {
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      const n = [...arr];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  return (
    <div>
      <p className="hint">Oldest first — tap ▲▼ to move / เรียงจากเก่าไปใหม่</p>
      {items.map((it, i) => (
        <div
          key={it.id}
          className="chip"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <b>{i + 1}.</b>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {it.imageUrl && (
            <img
              src={it.imageUrl}
              alt=""
              style={{
                width: 48,
                height: 48,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
          )}
          <span style={{ flex: 1 }}>{it.label}</span>
          <button
            className="btn"
            style={{ width: 44, padding: 6 }}
            onClick={() => move(i, -1)}
          >
            ▲
          </button>
          <button
            className="btn"
            style={{ width: 44, padding: 6 }}
            onClick={() => move(i, 1)}
          >
            ▼
          </button>
        </div>
      ))}
      <button
        className="btn"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await submit({ type: "reorder", order: items.map((x) => x.id) });
          setBusy(false);
        }}
      >
        Submit — one chance only! ⚠️
      </button>
    </div>
  );
}

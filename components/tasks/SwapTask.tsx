"use client";
import { useState } from "react";
import type { Task } from "@/types";

type Item = { id: string; label: string; imageUrl?: string };
type Props = {
  task: Task;
  submit: (p: Record<string, unknown>) => Promise<void>;
  error: string;
};

export default function SwapTask({ task, submit }: Props) {
  const content = task.content as { slotLabels: string[]; items: Item[] };
  const [arrangement, setArrangement] = useState<Item[]>(content.items);
  const [picked, setPicked] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const tap = (i: number) => {
    if (picked === null) return setPicked(i);
    setArrangement((arr) => {
      const n = [...arr];
      [n[picked], n[i]] = [n[i], n[picked]];
      return n;
    });
    setPicked(null);
  };

  return (
    <div>
      <p className="hint">Tap two items to swap them / แตะสองชิ้นเพื่อสลับ</p>
      {content.slotLabels.map((slot, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span className="hint" style={{ width: 100 }}>
            {slot}
          </span>
          <button
            className={`chip${picked === i ? " sel" : ""}`}
            style={{ flex: 1, marginBottom: 0 }}
            onClick={() => tap(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {arrangement[i].imageUrl && (
              <img
                src={arrangement[i].imageUrl}
                alt=""
                style={{
                  width: 40,
                  height: 40,
                  objectFit: "cover",
                  borderRadius: 8,
                  verticalAlign: "middle",
                  marginRight: 8,
                }}
              />
            )}
            {arrangement[i].label}
          </button>
        </div>
      ))}
      <button
        className="btn"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await submit({
            type: "swap",
            arrangement: arrangement.map((x) => x.id),
          });
          setBusy(false);
        }}
      >
        Submit — one chance only! ⚠️
      </button>
    </div>
  );
}

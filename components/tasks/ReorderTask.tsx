"use client";
import { useState } from "react";
import { DragDropProvider, KeyboardSensor, PointerSensor } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { PointerActivationConstraints } from "@dnd-kit/dom";
import { move } from "@dnd-kit/helpers";
import type { Task } from "@/types";
import ConfirmModal from "@/components/ConfirmModal";
import { SUBMIT_CONFIRM } from "@/components/tasks/submitConfirm";

// dnd-kit's default touch behaviour is a 250ms long-press before a drag starts
// (to avoid mistaking a scroll swipe for a drag). Because every row has a
// dedicated ☰ handle with `touch-action: none`, a swipe on the handle can never
// be a page scroll — so we start the drag as soon as the finger moves ~5px,
// matching the immediate feel of a mouse drag. Mouse-on-handle stays instant.
const sensors = [
  PointerSensor.configure({
    activationConstraints(event, source) {
      const { pointerType, target } = event;
      if (
        pointerType === "mouse" &&
        target instanceof Element &&
        (source.handle === target || source.handle?.contains(target))
      ) {
        return undefined;
      }
      return [new PointerActivationConstraints.Distance({ value: 5 })];
    },
  }),
  KeyboardSensor,
];

type Item = { id: string; label: string; imageUrl?: string };
type Props = {
  task: Task;
  submit: (p: Record<string, unknown>) => Promise<void>;
  error: string;
};

function SortableRow({
  item,
  index,
  onUp,
  onDown,
}: {
  item: Item;
  index: number;
  onUp: () => void;
  onDown: () => void;
}) {
  const { ref, handleRef, isDragging } = useSortable({ id: item.id, index });

  return (
    <div
      ref={ref}
      className="chip"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        opacity: isDragging ? 0.6 : 1,
        transform: isDragging ? "scale(1.02)" : undefined,
      }}
    >
      <button
        ref={handleRef}
        type="button"
        aria-label="Drag to reorder"
        className="btn"
        style={{ width: 44, padding: 6, cursor: "grab", touchAction: "none" }}
      >
        ☰
      </button>
      <b>{index + 1}.</b>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt=""
          style={{
            width: 80,
            height: 80,
            objectFit: "cover",
            borderRadius: 8,
          }}
        />
      )}
      <span style={{ flex: 1 }}>{item.label}</span>
      <button
        type="button"
        className="btn"
        style={{ width: 44, padding: 6 }}
        onClick={onUp}
      >
        ▲
      </button>
      <button
        type="button"
        className="btn"
        style={{ width: 44, padding: 6 }}
        onClick={onDown}
      >
        ▼
      </button>
    </div>
  );
}

export default function ReorderTask({ task, submit }: Props) {
  const initial = (task.content as { items: Item[] }).items;
  const [items, setItems] = useState<Item[]>(initial);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function doSubmit() {
    setBusy(true);
    await submit({ type: "reorder", order: items.map((x) => x.id) });
    setBusy(false);
    setConfirming(false);
  }

  const moveBy = (i: number, dir: -1 | 1) =>
    setItems((arr) => {
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      const n = [...arr];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  return (
    <div>
      <p className="hint">
        Oldest first — drag ☰ or tap ▲▼ to move / เรียงจากเก่าไปใหม่
      </p>
      <DragDropProvider
        sensors={sensors}
        onDragEnd={(event) => setItems((cur) => move(cur, event))}
      >
        {items.map((it, i) => (
          <SortableRow
            key={it.id}
            item={it}
            index={i}
            onUp={() => moveBy(i, -1)}
            onDown={() => moveBy(i, 1)}
          />
        ))}
      </DragDropProvider>
      <button
        className="btn"
        disabled={busy}
        onClick={() => setConfirming(true)}
      >
        Submit — one chance only! ⚠️
      </button>
      <ConfirmModal
        open={confirming}
        {...SUBMIT_CONFIRM}
        busy={busy}
        onConfirm={doSubmit}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}

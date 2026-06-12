"use client";
import { useState } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import type { Task } from "@/types";
import ConfirmModal from "@/components/ConfirmModal";
import { SUBMIT_CONFIRM } from "@/components/tasks/submitConfirm";
import { dragSensors, type DndItem } from "@/components/tasks/dnd";
type Props = {
  task: Task;
  submit: (p: Record<string, unknown>) => Promise<void>;
  error: string;
};

function SortableRow({
  item,
  index,
}: {
  item: DndItem;
  index: number;
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
      {/* eslint-disable @next/next/no-img-element */}
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
      {/* eslint-enable @next/next/no-img-element */}
      <span style={{ flex: 1 }}>{item.label}</span>
    </div>
  );
}

export default function ReorderTask({ task, submit }: Props) {
  const initial = (task.content as { items: DndItem[] }).items;
  const [items, setItems] = useState<DndItem[]>(initial);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function doSubmit() {
    setBusy(true);
    await submit({ type: "reorder", order: items.map((x) => x.id) });
    setBusy(false);
    setConfirming(false);
  }

  return (
    <div>
      <p className="hint">
        Oldest first — drag ☰ to move / เรียงจากเก่าไปใหม่
      </p>
      <DragDropProvider
        sensors={dragSensors}
        onDragEnd={(event) => setItems((cur) => move(cur, event))}
      >
        {items.map((it, i) => (
          <SortableRow
            key={it.id}
            item={it}
            index={i}
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

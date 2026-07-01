"use client";
import { useRef, useState } from "react";
import { DragDropProvider, useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { CollisionPriority } from "@dnd-kit/abstract";
import { move } from "@dnd-kit/helpers";
import type { Task } from "@/types";
import ConfirmModal from "@/components/ConfirmModal";
import { SUBMIT_CONFIRM } from "@/components/tasks/submitConfirm";
import { dragSensors, type DndItem } from "@/components/tasks/dnd";
import ZoomableImage from "@/components/ZoomableImage";

type Group = { id: string; label: string };
type Props = {
  task: Task;
  submit: (p: Record<string, unknown>) => Promise<void>;
  error: string;
};

/** Deal the (server-shuffled) items round-robin so every group starts filled. */
function deal(items: DndItem[], groups: Group[]): Record<string, string[]> {
  const board: Record<string, string[]> = Object.fromEntries(
    groups.map((g) => [g.id, []]),
  );
  items.forEach((it, i) => board[groups[i % groups.length].id].push(it.id));
  return board;
}

function GroupBox({
  group,
  isEmpty,
  children,
}: {
  group: Group;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  const { ref, isDropTarget } = useDroppable({
    id: group.id,
    type: "group",
    accept: "item",
    collisionPriority: CollisionPriority.Low,
  });
  return (
    <div
      ref={ref}
      style={{
        border: "2px dashed var(--color-swan)",
        borderRadius: 12,
        padding: 8,
        marginBottom: 10,
        background: isDropTarget ? "var(--color-sky-soft)" : undefined,
      }}
    >
      <p className="hint" style={{ margin: "0 0 6px" }}>
        {group.label}
      </p>
      {children}
      {isEmpty && (
        <p className="hint" style={{ opacity: 0.5, margin: 0 }}>
          drop here / วางที่นี่
        </p>
      )}
    </div>
  );
}

function GroupItem({
  item,
  index,
  group,
}: {
  item: DndItem;
  index: number;
  group: string;
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: item.id,
    index,
    type: "item",
    accept: "item",
    group,
  });
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
        aria-label="Drag to a group"
        className="btn"
        style={{ width: 44, padding: 6, cursor: "grab", touchAction: "none" }}
      >
        ☰
      </button>
      {item.imageUrl && (
        <ZoomableImage
          src={item.imageUrl}
          style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }}
        />
      )}
      <span style={{ flex: 1 }}>{item.label}</span>
    </div>
  );
}

export default function GroupTask({ task, submit }: Props) {
  const content = task.content as { groups: Group[]; items: DndItem[] };
  const [board, setBoard] = useState(() => deal(content.items, content.groups));
  // onDragOver commits moves live; snapshot at drag start so a canceled drag
  // (Escape, pointercancel) restores the board instead of stranding the item.
  const preDrag = useRef(board);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const itemById = new Map(content.items.map((it) => [it.id, it]));

  async function doSubmit() {
    setBusy(true);
    const assignments: Record<string, string> = {};
    for (const [groupId, ids] of Object.entries(board))
      for (const id of ids) assignments[id] = groupId;
    await submit({ type: "group", assignments });
    setBusy(false);
    setConfirming(false);
  }

  return (
    <div>
      <p className="hint">
        Drag each item into its correct group / ลากแต่ละชิ้นไปไว้กลุ่มที่ถูกต้อง
      </p>
      <DragDropProvider
        sensors={dragSensors}
        onDragStart={() => {
          preDrag.current = board;
        }}
        onDragOver={(event) => setBoard((cur) => move(cur, event))}
        onDragEnd={(event) => {
          if (event.canceled) {
            setBoard(preDrag.current);
            return;
          }
          setBoard((cur) => move(cur, event));
        }}
      >
        {content.groups.map((g) => (
          <GroupBox key={g.id} group={g} isEmpty={board[g.id].length === 0}>
            {board[g.id].map((id, i) => {
              const it = itemById.get(id);
              return it ? (
                <GroupItem key={id} item={it} index={i} group={g.id} />
              ) : null;
            })}
          </GroupBox>
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

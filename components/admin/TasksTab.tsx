"use client";
import { useRef, useState } from "react";
import { useTasks, useSaveTask, useUploadImage } from "@/react-query/admin.queries";
import { ApiError } from "@/services/http";
import type { AdminTask, Zone } from "@/types";

const EMPTY: Omit<AdminTask, "id"> = {
  roomNumber: 1, type: "mc", titleEn: "", hintTh: "", moneyValue: 100, isActive: true,
  content: { type: "mc", options: [] }, answerKey: { type: "mc", correctOptionIds: [] },
};

export default function TasksTab() {
  const { data: list = [] } = useTasks();
  const saveMut = useSaveTask();
  const [editing, setEditing] = useState<Partial<AdminTask> | null>(null);
  const [msg, setMsg] = useState("");

  async function save() {
    try {
      await saveMut.mutateAsync(editing!);
      setEditing(null); setMsg("Saved ✓");
    } catch (e) {
      setMsg((e as ApiError).status === 409 ? "⚠ Task is locked — students already answered it." : "Save failed");
    }
  }

  return (
    <div className="row">
      <div className="panel" style={{ maxWidth: 420 }}>
        <h2>Tasks <button className="tab" onClick={() => setEditing({ ...EMPTY })}>+ New</button></h2>
        {msg && <p className="hint">{msg}</p>}
        <table className="t">
          <tbody>
            {list.map((t) => (
              <tr key={t.id}>
                <td>R{t.roomNumber}</td><td>{t.type}</td>
                <td>{t.titleEn.slice(0, 28)}</td><td>฿{t.moneyValue}</td>
                <td><button className="tab" onClick={() => setEditing(t)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <TaskEditor task={editing} setTask={setEditing} onSave={save} />}
    </div>
  );
}

function TaskEditor({ task, setTask, onSave }: {
  task: Partial<AdminTask>;
  setTask: (t: Partial<AdminTask>) => void;
  onSave: () => void;
}) {
  const set = (patch: Partial<AdminTask>) => setTask({ ...task, ...patch });
  const setType = (type: AdminTask["type"]) => {
    const fresh: Record<AdminTask["type"], { content: unknown; answerKey: unknown }> = {
      mc: { content: { type: "mc", options: [] }, answerKey: { type: "mc", correctOptionIds: [] } },
      reorder: { content: { type: "reorder", items: [] }, answerKey: { type: "reorder", correctOrder: [] } },
      circle: { content: { type: "circle", imageUrl: "" }, answerKey: { type: "circle", zone: { x: 0.4, y: 0.4, w: 0.2, h: 0.2 } } },
      photo: { content: { type: "photo", referenceImageUrl: "" }, answerKey: { type: "photo", poseDescription: "" } },
      swap: { content: { type: "swap", slotLabels: [], items: [] }, answerKey: { type: "swap", correctArrangement: [] } },
    };
    set({ type, content: fresh[type].content as AdminTask["content"], answerKey: fresh[type].answerKey as AdminTask["answerKey"] });
  };

  return (
    <div className="panel">
      <h2>{task.id ? "Edit task" : "New task"}</h2>
      <div style={{ display: "grid", gap: 8 }}>
        <label>Room (1–9) <input className="input" type="number" min={1} max={9} value={task.roomNumber ?? 1}
          onChange={(e) => set({ roomNumber: Number(e.target.value) })} /></label>
        <label>Type <select className="input" value={task.type} disabled={!!task.id}
          onChange={(e) => setType(e.target.value as AdminTask["type"])}>
          {["mc", "reorder", "circle", "photo", "swap"].map((t) => <option key={t}>{t}</option>)}
        </select></label>
        <label>Title (English) <input className="input" value={task.titleEn ?? ""} onChange={(e) => set({ titleEn: e.target.value })} /></label>
        <label>Hint (Thai) <input className="input" value={task.hintTh ?? ""} onChange={(e) => set({ hintTh: e.target.value })} /></label>
        <label>Money ฿ <input className="input" type="number" value={task.moneyValue ?? 100} onChange={(e) => set({ moneyValue: Number(e.target.value) })} /></label>
        {task.type === "mc" && <McEditor task={task} set={set} />}
        {(task.type === "reorder" || task.type === "swap") && <ListEditor task={task} set={set} />}
        {task.type === "circle" && <CircleEditor task={task} set={set} />}
        {task.type === "photo" && <PhotoEditor task={task} set={set} />}
        <button className="btn" onClick={onSave}>Save task</button>
      </div>
    </div>
  );
}

/* mc: editable option rows + checkbox marks correct ones */
function McEditor({ task, set }: { task: Partial<AdminTask>; set: (p: Partial<AdminTask>) => void }) {
  const content = task.content as { type: "mc"; options: { id: string; text: string }[] };
  const key = task.answerKey as { type: "mc"; correctOptionIds: string[] };
  const update = (options: typeof content.options, correct: string[]) =>
    set({ content: { type: "mc", options }, answerKey: { type: "mc", correctOptionIds: correct } });
  return (
    <div>
      <b>Options (check the correct ones)</b>
      {content.options.map((o, i) => (
        <div key={o.id} style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <input type="checkbox" checked={key.correctOptionIds.includes(o.id)}
            onChange={(e) => update(content.options,
              e.target.checked ? [...key.correctOptionIds, o.id] : key.correctOptionIds.filter((x) => x !== o.id))} />
          <input className="input" value={o.text}
            onChange={(e) => { const opts = [...content.options]; opts[i] = { ...o, text: e.target.value }; update(opts, key.correctOptionIds); }} />
          <button className="tab" onClick={() => update(content.options.filter((x) => x.id !== o.id), key.correctOptionIds.filter((x) => x !== o.id))}>✕</button>
        </div>
      ))}
      <button className="tab" style={{ marginTop: 6 }}
        onClick={() => update([...content.options, { id: crypto.randomUUID().slice(0, 8), text: "" }], key.correctOptionIds)}>
        + option
      </button>
    </div>
  );
}

/* reorder & swap: items STORED in correct order; server shuffles per response */
function ListEditor({ task, set }: { task: Partial<AdminTask>; set: (p: Partial<AdminTask>) => void }) {
  const upload = useUploadImage();
  const isSwap = task.type === "swap";
  const content = task.content as { items: { id: string; label: string; imageUrl?: string }[]; slotLabels?: string[] };
  const items = content.items;

  const commit = (newItems: typeof items, slotLabels?: string[]) => {
    const correct = newItems.map((x) => x.id);
    set({
      content: isSwap
        ? { type: "swap", slotLabels: slotLabels ?? content.slotLabels ?? [], items: newItems }
        : { type: "reorder", items: newItems },
      answerKey: isSwap
        ? { type: "swap", correctArrangement: correct }
        : { type: "reorder", correctOrder: correct },
    } as Partial<AdminTask>);
  };

  return (
    <div>
      <b>Items in CORRECT order (top = first/oldest){isSwap ? " — slot labels below" : ""}</b>
      {items.map((it, i) => (
        <div key={it.id} style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <input className="input" value={it.label}
            onChange={(e) => { const n = [...items]; n[i] = { ...it, label: e.target.value }; commit(n); }} />
          <input type="file" accept="image/*" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const url = await upload.mutateAsync(f);
            const n = [...items]; n[i] = { ...it, imageUrl: url }; commit(n);
          }} />
          <button className="tab" onClick={() => commit(items.filter((x) => x.id !== it.id))}>✕</button>
        </div>
      ))}
      <button className="tab" style={{ marginTop: 6 }}
        onClick={() => commit([...items, { id: crypto.randomUUID().slice(0, 8), label: "" }])}>+ item</button>
      {isSwap && (
        <label>Slot labels (comma-separated)
          <input className="input" value={(content.slotLabels ?? []).join(", ")}
            onChange={(e) => commit(items, e.target.value.split(",").map((s) => s.trim()))} />
        </label>
      )}
    </div>
  );
}

/* circle: upload image, then drag a rectangle to mark the answer zone */
function CircleEditor({ task, set }: { task: Partial<AdminTask>; set: (p: Partial<AdminTask>) => void }) {
  const upload = useUploadImage();
  const content = task.content as { imageUrl: string };
  const key = task.answerKey as { zone: Zone };
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const norm = (e: React.MouseEvent) => {
    const r = imgRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        set({ content: { type: "circle", imageUrl: await upload.mutateAsync(f) } as AdminTask["content"] });
      }} />
      {content.imageUrl && (
        <div style={{ position: "relative", marginTop: 8, userSelect: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={content.imageUrl} alt="" style={{ width: "100%", borderRadius: 8 }}
            draggable={false}
            onMouseDown={(e) => setDragStart(norm(e))}
            onMouseUp={(e) => {
              if (!dragStart) return;
              const end = norm(e);
              const zone: Zone = {
                x: Math.min(dragStart.x, end.x), y: Math.min(dragStart.y, end.y),
                w: Math.abs(end.x - dragStart.x), h: Math.abs(end.y - dragStart.y),
              };
              set({ answerKey: { type: "circle", zone } as AdminTask["answerKey"] });
              setDragStart(null);
            }} />
          <div style={{
            position: "absolute", border: "3px solid red", pointerEvents: "none",
            left: `${key.zone.x * 100}%`, top: `${key.zone.y * 100}%`,
            width: `${key.zone.w * 100}%`, height: `${key.zone.h * 100}%`,
          }} />
        </div>
      )}
      <p className="hint">Drag a box on the image to mark the correct zone (red).</p>
    </div>
  );
}

/* photo: reference image + pose description for the AI */
function PhotoEditor({ task, set }: { task: Partial<AdminTask>; set: (p: Partial<AdminTask>) => void }) {
  const upload = useUploadImage();
  const content = task.content as { referenceImageUrl: string };
  const key = task.answerKey as { poseDescription: string };
  return (
    <div>
      <input type="file" accept="image/*" onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        set({ content: { type: "photo", referenceImageUrl: await upload.mutateAsync(f) } as AdminTask["content"] });
      }} />
      {content.referenceImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={content.referenceImageUrl} alt="" style={{ width: "100%", borderRadius: 8, marginTop: 8 }} />
      )}
      <label>What should the AI look for?
        <textarea className="input" rows={3} value={key.poseDescription}
          onChange={(e) => set({ answerKey: { type: "photo", poseDescription: e.target.value } as AdminTask["answerKey"] })} />
      </label>
    </div>
  );
}

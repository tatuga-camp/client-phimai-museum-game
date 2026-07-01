"use client";
import { useRef, useState } from "react";
import {
  useTasks,
  useSaveTask,
  useDeleteTask,
  useUploadImage,
} from "@/react-query/admin.queries";
import { ApiError } from "@/services/http";
import type { AdminTask, Zone } from "@/types";

const EMPTY: Omit<AdminTask, "id"> = {
  roomNumber: "1",
  type: "mc",
  titleEn: "",
  hintTh: "",
  moneyValue: 100,
  isActive: true,
  content: { type: "mc", options: [] },
  answerKey: { type: "mc", correctOptionIds: [] },
};

/** reorder/group items must each have a visible face: a label or an image. */
function hasBlankItems(t: Partial<AdminTask>): boolean {
  if (t.type !== "reorder" && t.type !== "group") return false;
  const items =
    (t.content as { items?: { label: string; imageUrl?: string }[] })?.items ??
    [];
  return items.some((i) => !(i.label ?? "").trim() && !i.imageUrl);
}

/** group: ≥2 labelled groups and every item assigned to an existing group. */
function groupProblem(t: Partial<AdminTask>): string | null {
  if (t.type !== "group") return null;
  const content = t.content as {
    groups?: { id: string; label: string }[];
    items?: { id: string }[];
  };
  const groups = content?.groups ?? [];
  const items = content?.items ?? [];
  const assignments =
    (t.answerKey as { assignments?: Record<string, string> })?.assignments ??
    {};
  if (groups.length < 2) return "⚠ Need at least 2 groups.";
  if (groups.some((g) => !g.label.trim()))
    return "⚠ Every group needs a label.";
  const groupIds = new Set(groups.map((g) => g.id));
  if (items.some((i) => !groupIds.has(assignments[i.id] ?? "")))
    return "⚠ Every item needs a group.";
  return null;
}

export default function TasksTab() {
  const { data: list = [] } = useTasks();
  const saveMut = useSaveTask();
  const delMut = useDeleteTask();
  const [editing, setEditing] = useState<Partial<AdminTask> | null>(null);
  const [msg, setMsg] = useState("");

  async function save() {
    if (hasBlankItems(editing!)) {
      setMsg("⚠ Each item needs a label or an image.");
      return;
    }
    const gp = groupProblem(editing!);
    if (gp) {
      setMsg(gp);
      return;
    }
    try {
      await saveMut.mutateAsync(editing!);
      setEditing(null);
      setMsg("Saved ✓");
    } catch (e) {
      setMsg(
        (e as ApiError).status === 409
          ? "⚠ Task is locked — students already answered it."
          : "Save failed",
      );
    }
  }

  async function del(id: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await delMut.mutateAsync(id);
      setEditing(null);
      setMsg("Deleted ✓");
    } catch (e) {
      setMsg(
        (e as ApiError).status === 409
          ? "⚠ Task is locked — students already answered it."
          : "Delete failed",
      );
    }
  }

  return (
    <div className="row">
      <div className="panel" style={{ maxWidth: 420 }}>
        <h2>
          Tasks{" "}
          <button className="tab" onClick={() => setEditing({ ...EMPTY })}>
            + New
          </button>
        </h2>
        {msg && <p className="hint">{msg}</p>}
        <table className="t">
          <tbody>
            {list.map((t) => (
              <tr key={t.id}>
                <td>R{t.roomNumber}</td>
                <td>{t.type}</td>
                <td>{t.titleEn.slice(0, 28)}</td>
                <td>฿{t.moneyValue}</td>
                <td>
                  <button className="tab" onClick={() => setEditing(t)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <TaskEditor
          task={editing}
          setTask={setEditing}
          onSave={save}
          del={del}
        />
      )}
    </div>
  );
}

function TaskEditor({
  task,
  setTask,
  onSave,
  del,
}: {
  task: Partial<AdminTask>;
  setTask: React.Dispatch<React.SetStateAction<Partial<AdminTask> | null>>;
  onSave: () => void;
  del: (id: string) => void;
}) {
  // Functional update: async upload commits merge into the LATEST state, and
  // a patch landing after the editor closed is dropped instead of reopening it.
  const set = (patch: Partial<AdminTask>) =>
    setTask((prev) => (prev ? { ...prev, ...patch } : prev));
  const setType = (type: AdminTask["type"]) => {
    const fresh: Record<
      AdminTask["type"],
      { content: unknown; answerKey: unknown }
    > = {
      mc: {
        content: { type: "mc", options: [] },
        answerKey: { type: "mc", correctOptionIds: [] },
      },
      reorder: {
        content: { type: "reorder", items: [] },
        answerKey: { type: "reorder", correctOrder: [] },
      },
      circle: {
        content: { type: "circle", imageUrl: "" },
        answerKey: { type: "circle", zone: { x: 0.4, y: 0.4, w: 0.2, h: 0.2 } },
      },
      photo: {
        content: { type: "photo", referenceImageUrl: "" },
        answerKey: { type: "photo", poseDescription: "" },
      },
      group: {
        content: { type: "group", groups: [], items: [] },
        answerKey: { type: "group", assignments: {} },
      },
    };
    set({
      type,
      content: fresh[type].content as AdminTask["content"],
      answerKey: fresh[type].answerKey as AdminTask["answerKey"],
    });
  };

  return (
    <div className="panel">
      <h2>{task.id ? "Edit task" : "New task"}</h2>
      <div style={{ display: "grid", gap: 8 }}>
        <label>
          Room Name / Number{" "}
          <input
            className="input"
            type="text"
            value={task.roomNumber ?? "1"}
            onChange={(e) => set({ roomNumber: e.target.value })}
          />
        </label>
        <label>
          Type{" "}
          <select
            className="input"
            value={task.type}
            disabled={!!task.id}
            onChange={(e) => setType(e.target.value as AdminTask["type"])}
          >
            {["mc", "reorder", "circle", "photo", "group"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Title (English){" "}
          <input
            className="input"
            value={task.titleEn ?? ""}
            onChange={(e) => set({ titleEn: e.target.value })}
          />
        </label>
        <label>
          Hint (Thai){" "}
          <input
            className="input"
            value={task.hintTh ?? ""}
            onChange={(e) => set({ hintTh: e.target.value })}
          />
        </label>
        <label>
          Money ฿{" "}
          <input
            className="input"
            type="number"
            value={task.moneyValue ?? 100}
            onChange={(e) => set({ moneyValue: Number(e.target.value) })}
          />
        </label>
        {task.type === "mc" && <McEditor task={task} set={set} />}
        {task.type === "reorder" && <ListEditor task={task} set={set} />}
        {task.type === "group" && <GroupEditor task={task} set={set} />}
        {task.type === "circle" && <CircleEditor task={task} set={set} />}
        {task.type === "photo" && <PhotoEditor task={task} set={set} />}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" style={{ flex: 1 }} onClick={onSave}>
            Save task
          </button>
          {task.id && (
            <button
              className="btn"
              style={{
                backgroundColor: "var(--color-cardinal)",
                color: "white",
              }}
              onClick={() => del(task.id!)}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* mc: optional question image + editable option rows; checkbox marks correct ones */
function McEditor({
  task,
  set,
}: {
  task: Partial<AdminTask>;
  set: (p: Partial<AdminTask>) => void;
}) {
  const upload = useUploadImage();
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const content = task.content as {
    type: "mc";
    imageUrl?: string;
    options: { id: string; text: string }[];
  };
  const key = task.answerKey as { type: "mc"; correctOptionIds: string[] };
  // pickImage commits after an await; read content via ref so option/label
  // edits made mid-upload aren't clobbered by a stale render snapshot.
  const contentRef = useRef(content);
  contentRef.current = content; // eslint-disable-line react-hooks/refs

  // Option edits are synchronous — preserve the current imageUrl inline.
  const update = (options: typeof content.options, correct: string[]) =>
    set({
      content: {
        type: "mc",
        ...(content.imageUrl ? { imageUrl: content.imageUrl } : {}),
        options,
      },
      answerKey: { type: "mc", correctOptionIds: correct },
    });

  async function pickImage(file: File) {
    setUploadErr("");
    setUploading(true);
    try {
      const url = await upload.mutateAsync(file);
      // Patch only content (preserving the latest options); leaving answerKey
      // out of the patch keeps whatever correctOptionIds are current.
      set({
        content: { type: "mc", imageUrl: url, options: contentRef.current.options },
      });
    } catch {
      setUploadErr("Upload failed — try again");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <b>Question image (optional)</b>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
        {content.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={content.imageUrl}
            alt=""
            style={{
              width: 40,
              height: 40,
              objectFit: "cover",
              borderRadius: 8,
              flex: "none",
            }}
          />
        )}
        <label className="tab" style={{ cursor: "pointer" }} title="Upload image">
          {uploading ? "⏳" : "📷"}
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) pickImage(f);
            }}
          />
        </label>
        {content.imageUrl && (
          <button
            className="tab"
            title="Remove image"
            onClick={() =>
              set({
                content: { type: "mc", options: contentRef.current.options },
              })
            }
          >
            🗑️
          </button>
        )}
      </div>
      {uploadErr && (
        <p className="hint" style={{ color: "var(--color-cardinal)" }}>
          {uploadErr}
        </p>
      )}

      <b style={{ display: "block", marginTop: 12 }}>
        Options (check the correct ones)
      </b>
      {content.options.map((o, i) => (
        <div key={o.id} style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <input
            type="checkbox"
            checked={key.correctOptionIds.includes(o.id)}
            onChange={(e) =>
              update(
                content.options,
                e.target.checked
                  ? [...key.correctOptionIds, o.id]
                  : key.correctOptionIds.filter((x) => x !== o.id),
              )
            }
          />
          <input
            className="input"
            value={o.text}
            onChange={(e) => {
              const opts = [...content.options];
              opts[i] = { ...o, text: e.target.value };
              update(opts, key.correctOptionIds);
            }}
          />
          <button
            className="tab"
            onClick={() =>
              update(
                content.options.filter((x) => x.id !== o.id),
                key.correctOptionIds.filter((x) => x !== o.id),
              )
            }
          >
            ✕
          </button>
        </div>
      ))}
      <button
        className="tab"
        style={{ marginTop: 6 }}
        onClick={() =>
          update(
            [
              ...content.options,
              { id: crypto.randomUUID().slice(0, 8), text: "" },
            ],
            key.correctOptionIds,
          )
        }
      >
        + option
      </button>
    </div>
  );
}

/* reorder: items STORED in correct order; server shuffles per response */
function ListEditor({
  task,
  set,
}: {
  task: Partial<AdminTask>;
  set: (p: Partial<AdminTask>) => void;
}) {
  const upload = useUploadImage();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);
  const content = task.content as {
    items: { id: string; label: string; imageUrl?: string }[];
  };
  const items = content.items;
  // pickImage commits after an await; read items via ref so mid-upload label
  // edits or deletions aren't clobbered by a stale render snapshot.
  const itemsRef = useRef(items);
  itemsRef.current = items; // eslint-disable-line react-hooks/refs

  const commit = (newItems: typeof items) =>
    set({
      content: { type: "reorder", items: newItems },
      answerKey: { type: "reorder", correctOrder: newItems.map((x) => x.id) },
    } as Partial<AdminTask>);

  async function pickImage(id: string, file: File) {
    setFailedId(null);
    setUploadingId(id);
    try {
      const url = await upload.mutateAsync(file);
      const current = itemsRef.current;
      if (!current.some((x) => x.id === id)) return; // item deleted mid-upload
      commit(current.map((x) => (x.id === id ? { ...x, imageUrl: url } : x)));
    } catch {
      setFailedId(id);
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div>
      <b>Items in CORRECT order (top = first/oldest)</b>
      <p className="hint">Each item needs a label, an image, or both.</p>
      {items.map((it) => {
        const blank = !it.label.trim() && !it.imageUrl;
        return (
          <div key={it.id} style={{ marginTop: 4 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {/* eslint-disable @next/next/no-img-element */}
              {it.imageUrl && (
                <img
                  src={it.imageUrl}
                  alt=""
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: "cover",
                    borderRadius: 8,
                    flex: "none",
                  }}
                />
              )}
              {/* eslint-enable @next/next/no-img-element */}
              <input
                className="input"
                placeholder="Label (optional with image)"
                value={it.label}
                style={
                  blank ? { borderColor: "var(--color-cardinal)" } : undefined
                }
                onChange={(e) =>
                  commit(
                    items.map((x) =>
                      x.id === it.id ? { ...x, label: e.target.value } : x,
                    ),
                  )
                }
              />
              <label
                className="tab"
                style={{ cursor: "pointer" }}
                title="Upload image"
              >
                {uploadingId === it.id ? "⏳" : "📷"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  disabled={uploadingId !== null}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) pickImage(it.id, f);
                  }}
                />
              </label>
              {it.imageUrl && (
                <button
                  className="tab"
                  title="Remove image"
                  onClick={() =>
                    commit(
                      items.map((x) =>
                        x.id === it.id ? { id: x.id, label: x.label } : x,
                      ),
                    )
                  }
                >
                  🗑️
                </button>
              )}
              <button
                className="tab"
                title="Delete item"
                onClick={() => commit(items.filter((x) => x.id !== it.id))}
              >
                ✕
              </button>
            </div>
            {failedId === it.id && (
              <p className="hint" style={{ color: "var(--color-cardinal)" }}>
                Upload failed — try again
              </p>
            )}
          </div>
        );
      })}
      <button
        className="tab"
        style={{ marginTop: 6 }}
        onClick={() =>
          commit([...items, { id: crypto.randomUUID().slice(0, 8), label: "" }])
        }
      >
        + item
      </button>
    </div>
  );
}

/* group: named groups + items; each item's dropdown IS the answer key */
function GroupEditor({
  task,
  set,
}: {
  task: Partial<AdminTask>;
  set: (p: Partial<AdminTask>) => void;
}) {
  const upload = useUploadImage();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);
  const content = task.content as {
    groups: { id: string; label: string }[];
    items: { id: string; label: string; imageUrl?: string }[];
  };
  const key = task.answerKey as { assignments: Record<string, string> };
  // pickImage commits after an await; read state via ref so mid-upload edits
  // to items, groups, or assignments aren't clobbered by a stale render
  // snapshot.
  const snapRef = useRef({
    groups: content.groups,
    items: content.items,
    assignments: key.assignments,
  });
  snapRef.current = {
    groups: content.groups,
    items: content.items,
    assignments: key.assignments,
  }; // eslint-disable-line react-hooks/refs

  const commit = (
    groups: typeof content.groups,
    items: typeof content.items,
    assignments: Record<string, string>,
  ) =>
    set({
      content: { type: "group", groups, items },
      answerKey: { type: "group", assignments },
    } as Partial<AdminTask>);

  async function pickImage(id: string, file: File) {
    setFailedId(null);
    setUploadingId(id);
    try {
      const url = await upload.mutateAsync(file);
      const { groups, items, assignments } = snapRef.current;
      if (!items.some((x) => x.id === id)) return; // item deleted mid-upload
      commit(
        groups,
        items.map((x) => (x.id === id ? { ...x, imageUrl: url } : x)),
        assignments,
      );
    } catch {
      setFailedId(id);
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div>
      <b>Groups</b>
      {content.groups.map((g) => (
        <div key={g.id} style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <input
            className="input"
            placeholder="Group label"
            value={g.label}
            onChange={(e) =>
              commit(
                content.groups.map((x) =>
                  x.id === g.id ? { ...x, label: e.target.value } : x,
                ),
                content.items,
                key.assignments,
              )
            }
          />
          <button
            className="tab"
            title="Delete group"
            onClick={() =>
              commit(
                content.groups.filter((x) => x.id !== g.id),
                content.items,
                Object.fromEntries(
                  Object.entries(key.assignments).filter(
                    ([, gid]) => gid !== g.id,
                  ),
                ),
              )
            }
          >
            ✕
          </button>
        </div>
      ))}
      <button
        className="tab"
        style={{ marginTop: 6 }}
        onClick={() =>
          commit(
            [
              ...content.groups,
              { id: crypto.randomUUID().slice(0, 8), label: "" },
            ],
            content.items,
            key.assignments,
          )
        }
      >
        + group
      </button>

      <b style={{ display: "block", marginTop: 12 }}>
        Items (assign each to its correct group)
      </b>
      <p className="hint">
        Each item needs a label, an image, or both — and a group.
      </p>
      {content.items.map((it) => {
        const blank = !it.label.trim() && !it.imageUrl;
        const unassigned = !key.assignments[it.id];
        return (
          <div key={it.id} style={{ marginTop: 4 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {/* eslint-disable @next/next/no-img-element */}
              {it.imageUrl && (
                <img
                  src={it.imageUrl}
                  alt=""
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: "cover",
                    borderRadius: 8,
                    flex: "none",
                  }}
                />
              )}
              {/* eslint-enable @next/next/no-img-element */}
              <input
                className="input"
                placeholder="Label (optional with image)"
                value={it.label}
                style={
                  blank ? { borderColor: "var(--color-cardinal)" } : undefined
                }
                onChange={(e) =>
                  commit(
                    content.groups,
                    content.items.map((x) =>
                      x.id === it.id ? { ...x, label: e.target.value } : x,
                    ),
                    key.assignments,
                  )
                }
              />
              <select
                className="input"
                style={{
                  maxWidth: 130,
                  ...(unassigned
                    ? { borderColor: "var(--color-cardinal)" }
                    : {}),
                }}
                value={key.assignments[it.id] ?? ""}
                onChange={(e) =>
                  commit(content.groups, content.items, {
                    ...key.assignments,
                    [it.id]: e.target.value,
                  })
                }
              >
                <option value="" disabled>
                  — group —
                </option>
                {content.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label || g.id}
                  </option>
                ))}
              </select>
              <label
                className="tab"
                style={{ cursor: "pointer" }}
                title="Upload image"
              >
                {uploadingId === it.id ? "⏳" : "📷"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  disabled={uploadingId !== null}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) pickImage(it.id, f);
                  }}
                />
              </label>
              {it.imageUrl && (
                <button
                  className="tab"
                  title="Remove image"
                  onClick={() =>
                    commit(
                      content.groups,
                      content.items.map((x) =>
                        x.id === it.id ? { id: x.id, label: x.label } : x,
                      ),
                      key.assignments,
                    )
                  }
                >
                  🗑️
                </button>
              )}
              <button
                className="tab"
                title="Delete item"
                onClick={() => {
                  const rest = { ...key.assignments };
                  delete rest[it.id];
                  commit(
                    content.groups,
                    content.items.filter((x) => x.id !== it.id),
                    rest,
                  );
                }}
              >
                ✕
              </button>
            </div>
            {failedId === it.id && (
              <p className="hint" style={{ color: "var(--color-cardinal)" }}>
                Upload failed — try again
              </p>
            )}
          </div>
        );
      })}
      <button
        className="tab"
        style={{ marginTop: 6 }}
        onClick={() =>
          commit(
            content.groups,
            [
              ...content.items,
              { id: crypto.randomUUID().slice(0, 8), label: "" },
            ],
            key.assignments,
          )
        }
      >
        + item
      </button>
    </div>
  );
}

/* circle: upload image, then drag a rectangle to mark the answer zone */
function CircleEditor({
  task,
  set,
}: {
  task: Partial<AdminTask>;
  set: (p: Partial<AdminTask>) => void;
}) {
  const upload = useUploadImage();
  const [uploadErr, setUploadErr] = useState("");
  const content = task.content as { imageUrl: string };
  const key = task.answerKey as { zone: Zone };
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );

  const norm = (e: React.MouseEvent) => {
    const r = imgRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width,
      y: (e.clientY - r.top) / r.height,
    };
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setUploadErr("");
          try {
            set({
              content: {
                type: "circle",
                imageUrl: await upload.mutateAsync(f),
              } as AdminTask["content"],
            });
          } catch {
            setUploadErr("Upload failed — try again");
          }
        }}
      />
      {uploadErr && (
        <p className="hint" style={{ color: "var(--color-cardinal)" }}>
          {uploadErr}
        </p>
      )}
      {content.imageUrl && (
        <div style={{ position: "relative", marginTop: 8, userSelect: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={content.imageUrl}
            alt=""
            style={{ width: "100%", borderRadius: 8 }}
            draggable={false}
            onMouseDown={(e) => setDragStart(norm(e))}
            onMouseUp={(e) => {
              if (!dragStart) return;
              const end = norm(e);
              const zone: Zone = {
                x: Math.min(dragStart.x, end.x),
                y: Math.min(dragStart.y, end.y),
                w: Math.abs(end.x - dragStart.x),
                h: Math.abs(end.y - dragStart.y),
              };
              set({
                answerKey: { type: "circle", zone } as AdminTask["answerKey"],
              });
              setDragStart(null);
            }}
          />
          <div
            style={{
              position: "absolute",
              border: "3px solid red",
              pointerEvents: "none",
              left: `${key.zone.x * 100}%`,
              top: `${key.zone.y * 100}%`,
              width: `${key.zone.w * 100}%`,
              height: `${key.zone.h * 100}%`,
            }}
          />
        </div>
      )}
      <p className="hint">
        Drag a box on the image to mark the correct zone (red).
      </p>
    </div>
  );
}

/* photo: reference image + pose description for the AI */
function PhotoEditor({
  task,
  set,
}: {
  task: Partial<AdminTask>;
  set: (p: Partial<AdminTask>) => void;
}) {
  const upload = useUploadImage();
  const [uploadErr, setUploadErr] = useState("");
  const content = task.content as { referenceImageUrl: string };
  const key = task.answerKey as { poseDescription: string };
  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setUploadErr("");
          try {
            set({
              content: {
                type: "photo",
                referenceImageUrl: await upload.mutateAsync(f),
              } as AdminTask["content"],
            });
          } catch {
            setUploadErr("Upload failed — try again");
          }
        }}
      />
      {uploadErr && (
        <p className="hint" style={{ color: "var(--color-cardinal)" }}>
          {uploadErr}
        </p>
      )}
      {content.referenceImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={content.referenceImageUrl}
          alt=""
          style={{ width: "100%", borderRadius: 8, marginTop: 8 }}
        />
      )}
      <label>
        What should the AI look for?
        <textarea
          className="input"
          rows={3}
          value={key.poseDescription}
          onChange={(e) =>
            set({
              answerKey: {
                type: "photo",
                poseDescription: e.target.value,
              } as AdminTask["answerKey"],
            })
          }
        />
      </label>
    </div>
  );
}

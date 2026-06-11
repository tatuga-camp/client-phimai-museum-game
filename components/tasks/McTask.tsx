"use client";
import { useState } from "react";
import type { Task } from "@/types";
import ConfirmModal from "@/components/ConfirmModal";
import { SUBMIT_CONFIRM } from "@/components/tasks/submitConfirm";

type Props = {
  task: Task;
  submit: (p: Record<string, unknown>) => Promise<void>;
  error: string;
};

export default function McTask({ task, submit }: Props) {
  const options = (task.content as { options: { id: string; text: string }[] })
    .options;
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  async function doSubmit() {
    setBusy(true);
    await submit({ type: "mc", selectedOptionIds: [...sel] });
    setBusy(false);
    setConfirming(false);
  }

  return (
    <div>
      <p className="hint">Choose ALL correct answers / เลือกทุกข้อที่ถูก</p>
      {options.map((o) => (
        <button
          key={o.id}
          className={`chip${sel.has(o.id) ? " sel" : ""}`}
          onClick={() => toggle(o.id)}
        >
          {sel.has(o.id) ? "✓ " : ""}
          {o.text}
        </button>
      ))}
      <button
        className="btn"
        disabled={busy || sel.size === 0}
        onClick={() => setConfirming(true)}
      >
        Submit — one chance only! ⚠️
      </button>
      <p className="hint center">ส่งได้ครั้งเดียวเท่านั้น</p>
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

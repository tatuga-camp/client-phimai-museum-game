"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { newSubmissionId, ApiError } from "@/services/http";
import { useMe, useSubmitAnswer } from "@/react-query/player.queries";
import type { SubmitResult } from "@/types";
import McTask from "@/components/tasks/McTask";
import ReorderTask from "@/components/tasks/ReorderTask";
import SwapTask from "@/components/tasks/SwapTask";
import CircleTask from "@/components/tasks/CircleTask";
import PhotoTask from "@/components/tasks/PhotoTask";

export default function TaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);
  const router = useRouter();
  const { data: me, error } = useMe();
  const submitMut = useSubmitAnswer();
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (error?.status === 401) router.push("/");
  }, [error, router]);

  const task = me?.tasks.find((t) => t.id === taskId) ?? null;
  const prior = me?.mySubmissions.find((s) => s.taskId === taskId) ?? null;
  const shown = result ?? prior;

  // submit once with a stable idempotency key (retry/idempotency handled in the service)
  async function submit(payload: Record<string, unknown>) {
    setSubmitError("");
    const clientSubmissionId = newSubmissionId();
    try {
      const r = await submitMut.mutateAsync({ taskId, payload, clientSubmissionId });
      setResult(r);
    } catch (e) {
      const status = (e as ApiError).status;
      if (status === 409) {
        setSubmitError("You already answered this task! / ตอบไปแล้ว");
      } else if (status >= 400 && status < 500) {
        setSubmitError("Something went wrong — ask a teacher.");
      } else {
        setSubmitError(
          "Connection problem — your answer was NOT used. Try again! / ลองอีกครั้ง",
        );
      }
    }
  }

  if (!task)
    return (
      <main className="page center">
        <p>Loading… ⏳</p>
      </main>
    );

  if (shown) {
    return (
      <main className="page center">
        <div style={{ fontSize: 56, marginTop: 40 }}>
          {shown.status === "correct"
            ? "🎉"
            : shown.status === "incorrect"
              ? "🙈"
              : "🤖"}
        </div>
        {shown.status === "correct" && (
          <h1 className="ok">
            Correct! +฿{shown.moneyAwarded} for your team!
          </h1>
        )}
        {shown.status === "incorrect" && (
          <h1 className="bad">
            Not correct — this task is locked for you.
            <br />
            <span className="hint">
              Your teammates can still try! / เพื่อนยังตอบได้
            </span>
          </h1>
        )}
        {(shown.status === "pending_ai" ||
          shown.status === "needs_manual") && (
          <h1 className="pend">
            AI judge is checking… check back soon!
            <br />
            <span className="hint">รอผลจากกรรมการ AI</span>
          </h1>
        )}
        {shown.aiComment && <p className="card">💬 {shown.aiComment}</p>}
        <button
          className="btn"
          style={{ marginTop: 20 }}
          onClick={() => router.push("/play")}
        >
          Back to rooms
        </button>
      </main>
    );
  }

  const common = { task, submit, error: submitError };
  return (
    <main className="page">
      <div className="bar">
        <span>Room {task.roomNumber}</span>
        <span>฿{task.moneyValue}</span>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <h2>{task.titleEn}</h2>
        <p className="hint">{task.hintTh}</p>
      </div>
      {task.type === "mc" && <McTask {...common} />}
      {task.type === "reorder" && <ReorderTask {...common} />}
      {task.type === "swap" && <SwapTask {...common} />}
      {task.type === "circle" && <CircleTask {...common} />}
      {task.type === "photo" && <PhotoTask task={task} onResult={setResult} />}
      {submitError && <p className="bad center">{submitError}</p>}
    </main>
  );
}

"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { newSubmissionId, ApiError } from "@/services/http";
import {
  useMe,
  useSubmitAnswer,
  useRevealHint,
} from "@/react-query/player.queries";
import type { SubmitResult } from "@/types";
import McTask from "@/components/tasks/McTask";
import ReorderTask from "@/components/tasks/ReorderTask";
import SwapTask from "@/components/tasks/SwapTask";
import CircleTask from "@/components/tasks/CircleTask";
import PhotoTask from "@/components/tasks/PhotoTask";
import ConfirmModal from "@/components/ConfirmModal";
import AiScanOverlay from "@/components/AiScanOverlay";

export default function TaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);
  const router = useRouter();
  const { data: me, error } = useMe();
  const submitMut = useSubmitAnswer();
  const revealMut = useRevealHint();
  const [revealedHint, setRevealedHint] = useState<string | null>(null);
  const [hintError, setHintError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (error?.status === 401) router.push("/");
  }, [error, router]);

  const task = me?.tasks.find((t) => t.id === taskId) ?? null;
  const prior = me?.mySubmissions.find((s) => s.taskId === taskId) ?? null;
  const shown = result ?? prior;

  // Spending shared team money is destructive, so it's gated behind an in-app
  // confirmation (a themed two-button step, not a native confirm() — those get
  // swallowed in some kiosk/tablet WebViews this game runs on).
  async function revealHint() {
    if (!task) return;
    setHintError("");
    try {
      const r = await revealMut.mutateAsync(task.id);
      setRevealedHint(r.hintTh);
      setConfirming(false); // success closes the popup; errors keep it open
    } catch (e) {
      const status = (e as ApiError).status;
      if (status === 402) {
        setHintError("Not enough team money for this hint / เงินทีมไม่พอ");
      } else {
        setHintError("Connection problem — try again / ลองอีกครั้ง");
      }
    }
  }

  function openConfirm() {
    setHintError(""); // drop any stale error from a previous attempt
    setConfirming(true);
  }

  // submit once with a stable idempotency key (retry/idempotency handled in the service)
  async function submit(payload: Record<string, unknown>) {
    setSubmitError("");
    const clientSubmissionId = newSubmissionId();
    try {
      const r = await submitMut.mutateAsync({
        taskId,
        payload,
        clientSubmissionId,
      });
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
    const pending =
      shown.status === "pending_ai" || shown.status === "needs_manual";
    return (
      <main className="page center">
        {!pending && (
          <div style={{ fontSize: 56, marginTop: 40 }}>
            {shown.status === "correct" ? "🎉" : "🙈"}
          </div>
        )}
        {shown.status === "correct" && (
          <h1 className="ok">Correct! +฿{shown.moneyAwarded} for your team!</h1>
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
        {pending && (
          <div style={{ position: "relative", width: "100%", marginTop: 24 }}>
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt="your photo"
                style={{ width: "100%", borderRadius: 12, display: "block" }}
              />
            ) : (
              <div
                style={{
                  height: 240,
                  borderRadius: 12,
                  background: "var(--color-eel)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 72,
                }}
              >
                🤖
              </div>
            )}
            <AiScanOverlay
              caption="AI judge is checking… check back soon!"
              captionTh="รอผลจากกรรมการ AI"
            />
          </div>
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
        {task.hintRevealed || revealedHint ? (
          <p className="hint">{revealedHint ?? task.hintTh}</p>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            <button className="btn" onClick={openConfirm}>
              💡 Reveal hint — ฿{task.hintCost}
            </button>
            <p className="hint center">
              เปิดคำใบ้ — ใช้เงินทีม ฿{task.hintCost}
            </p>
          </div>
        )}
      </div>
      {task.type === "mc" && <McTask {...common} />}
      {task.type === "reorder" && <ReorderTask {...common} />}
      {task.type === "swap" && <SwapTask {...common} />}
      {task.type === "circle" && <CircleTask {...common} />}
      {task.type === "photo" && (
        <PhotoTask
          task={task}
          onResult={(r, previewUrl) => {
            setPhotoPreview(previewUrl ?? "");
            setResult(r);
          }}
        />
      )}
      {submitError && <p className="bad center">{submitError}</p>}

      <ConfirmModal
        open={confirming}
        icon="💡"
        title="Reveal the hint?"
        message={
          <>
            This spends ฿{task.hintCost} of your team&apos;s money.
            <br />
            ใช้เงินทีม ฿{task.hintCost} เพื่อเปิดคำใบ้
          </>
        }
        confirmLabel={`✅ Yes, reveal — ฿${task.hintCost}`}
        busy={revealMut.isPending}
        error={hintError}
        onConfirm={revealHint}
        onCancel={() => setConfirming(false)}
      />
    </main>
  );
}

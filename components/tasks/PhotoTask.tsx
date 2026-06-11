"use client";
import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { newSubmissionId, ApiError } from "@/services/http";
import { useSubmitPhoto } from "@/react-query/player.queries";
import type { Task, SubmitResult } from "@/types";
import ConfirmModal from "@/components/ConfirmModal";
import AiScanOverlay from "@/components/AiScanOverlay";

/** Server-side upload limit (photo.service.ts) — compression fallback bound. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

type Props = {
  task: Task;
  onResult: (r: SubmitResult, previewUrl?: string) => void;
};

export default function PhotoTask({ task, onResult }: Props) {
  const ref = (task.content as { referenceImageUrl: string }).referenceImageUrl;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  // Guard against overlapping picks: only the latest pick may commit results.
  const pickGen = useRef(0);
  const submitPhoto = useSubmitPhoto();

  // Replace the preview, revoking the previous object URL. The final URL is
  // NOT revoked on unmount: the task page keeps it on the pending-AI screen.
  const swapPreview = (url: string) =>
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return url;
    });

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!f) return;
    const gen = ++pickGen.current;
    setError("");
    setFile(null);
    swapPreview(URL.createObjectURL(f)); // instant feedback — no blank gap
    setCompressing(true);
    try {
      const compressed = await imageCompression(f, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
      });
      if (gen !== pickGen.current) return; // superseded by a newer pick
      setFile(new File([compressed], "photo.jpg", { type: "image/jpeg" }));
    } catch {
      if (gen !== pickGen.current) return;
      if (f.size <= MAX_UPLOAD_BYTES) {
        setFile(f); // original is small enough — send it as-is
      } else {
        swapPreview("");
        setError("Photo too large — please retake / รูปใหญ่เกินไป ถ่ายใหม่");
      }
    } finally {
      if (gen === pickGen.current) setCompressing(false);
    }
  }

  async function upload() {
    if (!file) return;
    setError("");
    setConfirming(false); // close the modal so the scanner is visible
    const form = new FormData();
    form.append("photo", file);
    form.append("taskId", task.id);
    form.append("clientSubmissionId", newSubmissionId());
    try {
      // → pending_ai; /play polling reveals the score
      onResult(await submitPhoto.mutateAsync(form), preview);
    } catch (e) {
      const status = (e as ApiError).status;
      if (status === 409)
        setError("You already submitted a photo! / ส่งรูปไปแล้ว");
      else if (status)
        setError("Upload failed — try again / อัปโหลดไม่สำเร็จ ลองใหม่");
      else setError("Connection problem — try again / ลองอีกครั้ง");
    }
  }

  return (
    <div>
      <p className="hint">Find this spot and copy the pose! / ทำท่าตามภาพ</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ref}
        alt="reference pose"
        style={{
          width: "100%",
          borderRadius: 12,
          border: "2px solid var(--color-grass)",
        }}
      />
      <label className="btn btn-ink" style={{ marginTop: 12 }}>
        📷 {file || compressing ? "Retake photo" : "Take photo"}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={pick}
          style={{ display: "none" }}
        />
      </label>
      {preview && (
        <div style={{ position: "relative", marginTop: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="your photo"
            style={{ width: "100%", borderRadius: 12, display: "block" }}
          />
          {compressing && (
            <AiScanOverlay caption="Preparing photo… 📷" captionTh="กำลังเตรียมรูป" />
          )}
          {submitPhoto.isPending && (
            <AiScanOverlay caption="Sending to the AI judge… 🤖" captionTh="กำลังส่งรูป" />
          )}
        </div>
      )}
      <button
        className="btn"
        style={{ marginTop: 12 }}
        disabled={submitPhoto.isPending || compressing || !file}
        onClick={() => {
          setError("");
          setConfirming(true);
        }}
      >
        {submitPhoto.isPending ? "Sending… 🤖" : "Submit to the AI judge! 🤖"}
      </button>
      {error && <p className="bad center">{error}</p>}
      <p className="hint center">
        Each player can submit their own photo once / คนละ 1 รูป
      </p>
      <ConfirmModal
        open={confirming}
        icon="🤖"
        title="Send to the AI judge?"
        message="Each player can submit one photo. / ส่งรูปได้คนละ 1 รูป"
        confirmLabel="🤖 Submit photo"
        busy={false}
        error=""
        onConfirm={upload}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}

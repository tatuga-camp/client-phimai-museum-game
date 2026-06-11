"use client";
import { useState } from "react";
import imageCompression from "browser-image-compression";
import { newSubmissionId, ApiError } from "@/services/http";
import { useSubmitPhoto } from "@/react-query/player.queries";
import type { Task, SubmitResult } from "@/types";

type Props = { task: Task; onResult: (r: SubmitResult) => void };

export default function PhotoTask({ task, onResult }: Props) {
  const ref = (task.content as { referenceImageUrl: string }).referenceImageUrl;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const submitPhoto = useSubmitPhoto();

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const compressed = await imageCompression(f, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1600,
    });
    setFile(new File([compressed], "photo.jpg", { type: "image/jpeg" }));
    setPreview(URL.createObjectURL(compressed));
  }

  async function upload() {
    if (!file) return;
    setError("");
    const form = new FormData();
    form.append("photo", file);
    form.append("taskId", task.id);
    form.append("clientSubmissionId", newSubmissionId());
    try {
      onResult(await submitPhoto.mutateAsync(form)); // → pending_ai; /play polling reveals the score
    } catch (e) {
      const status = (e as ApiError).status;
      if (status === 409) setError("You already submitted a photo! / ส่งรูปไปแล้ว");
      else if (status) setError("Upload failed — try again / อัปโหลดไม่สำเร็จ ลองใหม่");
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
          border: "2px solid var(--color-mint)",
        }}
      />
      <label className="btn btn-ink" style={{ marginTop: 12 }}>
        📷 {file ? "Retake photo" : "Take photo"}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={pick}
          style={{ display: "none" }}
        />
      </label>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {preview && (
        <img
          src={preview}
          alt="your photo"
          style={{ width: "100%", borderRadius: 12, marginTop: 12 }}
        />
      )}
      {error && <p className="bad center">{error}</p>}
      <button
        className="btn"
        style={{ marginTop: 12 }}
        disabled={submitPhoto.isPending || !file}
        onClick={upload}
      >
        {submitPhoto.isPending ? "Uploading… 📤" : "Submit to the AI judge! 🤖"}
      </button>
      <p className="hint center">
        Each player can submit their own photo once / คนละ 1 รูป
      </p>
    </div>
  );
}

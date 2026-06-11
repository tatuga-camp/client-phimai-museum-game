"use client";
import { useRef, useState } from "react";
import type { Task } from "@/types";

type Props = {
  task: Task;
  submit: (p: Record<string, unknown>) => Promise<void>;
  error: string;
};

export default function CircleTask({ task, submit }: Props) {
  const imageUrl = (task.content as { imageUrl: string }).imageUrl;
  const imgRef = useRef<HTMLImageElement>(null);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null); // normalized 0..1
  const [busy, setBusy] = useState(false);

  const tap = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = imgRef.current!.getBoundingClientRect();
    setPoint({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  return (
    <div>
      <p className="hint">
        Tap where the missing piece is / แตะตำแหน่งที่หายไป
      </p>
      <div style={{ position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt="artifact"
          onClick={tap}
          style={{
            width: "100%",
            borderRadius: 12,
            border: "2px solid var(--color-grass)",
            touchAction: "manipulation",
          }}
        />
        {point && (
          <div
            style={{
              position: "absolute",
              left: `${point.x * 100}%`,
              top: `${point.y * 100}%`,
              transform: "translate(-50%, -50%)",
              width: 44,
              height: 44,
              border: "4px solid var(--color-sky)",
              borderRadius: "50%",
              pointerEvents: "none",
              background: "rgba(28, 176, 246, 0.25)",
            }}
          />
        )}
      </div>
      <button
        className="btn"
        style={{ marginTop: 12 }}
        disabled={busy || !point}
        onClick={async () => {
          setBusy(true);
          await submit({ type: "circle", ...point });
          setBusy(false);
        }}
      >
        Submit — one chance only! ⚠️
      </button>
    </div>
  );
}

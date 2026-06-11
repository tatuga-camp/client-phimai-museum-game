"use client";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  message?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: string;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Centered confirmation popup over a dimmed backdrop, themed to match the cards.
 * Used to gate irreversible actions (spending team money on a hint, the
 * one-shot answer submit). Tap-outside or Cancel dismisses — but both are
 * disabled while `busy`, so a stray tap can't cancel an in-flight request.
 * The parent keeps it open on error (passing `error`) so the user can retry.
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel / ยกเลิก",
  icon = "⚠️",
  busy = false,
  error,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={() => !busy && onCancel()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="center" style={{ fontSize: 44 }}>
          {icon}
        </div>
        <h2 className="center">{title}</h2>
        {message && <p className="hint center">{message}</p>}
        <button className="btn" disabled={busy} onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button className="btn btn-ghost" disabled={busy} onClick={onCancel}>
          {cancelLabel}
        </button>
        {error && <p className="bad center">{error}</p>}
      </div>
    </div>
  );
}

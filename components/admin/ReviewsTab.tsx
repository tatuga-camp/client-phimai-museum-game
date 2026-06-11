"use client";
import { useReviews, useOverride } from "@/react-query/admin.queries";
import type { Review } from "@/types";

export default function ReviewsTab() {
  const { data: reviews = [] } = useReviews();
  const overrideMut = useOverride();

  async function override(r: Review) {
    const input = prompt(`New score 0-100 for ${r.nickname} (current: ${r.score})`);
    if (input === null) return;
    await overrideMut.mutateAsync({ submissionId: r.id, score: Number(input), moneyValue: r.moneyValue });
  }

  return (
    <div className="row">
      {reviews.map((r) => (
        <div className="panel" key={r.id} style={{ maxWidth: 360 }}>
          <b>{r.nickname}</b> · {r.taskTitle.slice(0, 30)}
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            {r.referenceImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.referenceImageUrl} alt="ref" style={{ width: "50%", borderRadius: 8 }} />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.photoUrl} alt="submission" style={{ width: "50%", borderRadius: 8 }} />
          </div>
          <p>
            {r.status === "needs_manual"
              ? <span className="pend">⚠ NEEDS MANUAL SCORE</span>
              : r.status === "pending_ai"
              ? <span className="pend">🤖 judging…</span>
              : <>🤖 <b>{r.score}/100</b> → ฿{r.moneyAwarded}</>}
          </p>
          {r.aiComment && <p className="hint">💬 {r.aiComment}</p>}
          {r.status !== "pending_ai" && (
            <button className="tab" onClick={() => override(r)}>Override score</button>
          )}
        </div>
      ))}
      {reviews.length === 0 && <p>No photo submissions yet.</p>}
    </div>
  );
}

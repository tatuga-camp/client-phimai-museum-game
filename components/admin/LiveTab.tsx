"use client";
import { useState } from "react";
import { useLive, useAdjust } from "@/react-query/admin.queries";

export default function LiveTab() {
  const { data: live } = useLive();
  const adjustMut = useAdjust();
  const [adjust, setAdjust] = useState({ teamId: "", amount: 0, reason: "" });

  if (!live) return <p>Loading…</p>;
  return (
    <div className="row">
      <div className="panel">
        <h2>💰 Standings {live.pendingCount > 0 && <span className="pend">({live.pendingCount} awaiting AI/manual)</span>}</h2>
        {live.teams.map((t, i) => (
          <p key={t.id} style={{ fontSize: 18 }}>{i + 1}. {t.emoji} <b style={{ color: t.color }}>{t.name}</b> — ฿{t.money.toLocaleString()}</p>
        ))}
        <h2 style={{ marginTop: 14 }}>Adjust money (logged)</h2>
        <div style={{ display: "grid", gap: 6 }}>
          <select className="input" value={adjust.teamId} onChange={(e) => setAdjust({ ...adjust, teamId: e.target.value })}>
            <option value="">— team —</option>
            {live.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input className="input" type="number" placeholder="± amount" value={adjust.amount || ""} onChange={(e) => setAdjust({ ...adjust, amount: Number(e.target.value) })} />
          <input className="input" placeholder="Reason (required)" value={adjust.reason} onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })} />
          <button className="btn" disabled={!adjust.teamId || !adjust.amount || !adjust.reason.trim()}
            onClick={async () => { await adjustMut.mutateAsync(adjust); setAdjust({ teamId: "", amount: 0, reason: "" }); }}>
            Apply
          </button>
        </div>
      </div>
      <div className="panel">
        <h2>📜 Recent submissions</h2>
        <table className="t">
          <tbody>
            {live.feed.map((f) => (
              <tr key={f.id}>
                <td>{new Date(f.createdAt).toLocaleTimeString()}</td>
                <td><b>{f.nickname}</b></td>
                <td>{f.taskTitle.slice(0, 30)}</td>
                <td>{f.status === "correct" ? <span className="ok">✓ +฿{f.moneyAwarded}</span>
                  : f.status === "incorrect" ? <span className="bad">✗</span>
                  : <span className="pend">{f.status}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

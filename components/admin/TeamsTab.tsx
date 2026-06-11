"use client";
import { useState } from "react";
import Link from "next/link";
import {
  useTeams,
  usePlayers,
  useCreateTeam,
  useBulkPlayers,
  useResetPlayer,
} from "@/react-query/admin.queries";

export default function TeamsTab() {
  const { data: teams = [] } = useTeams();
  const { data: players = [] } = usePlayers();
  const createTeam = useCreateTeam();
  const bulkPlayers = useBulkPlayers();
  const resetPlayer = useResetPlayer();
  const [form, setForm] = useState({ name: "", emoji: "🐘", color: "#428475" });
  const [bulk, setBulk] = useState({ teamId: "", count: 9 });

  return (
    <div className="row">
      <div className="panel">
        <h2>Teams</h2>
        {teams.map((t) => <p key={t.id}>{t.emoji} <b style={{ color: t.color }}>{t.name}</b> — ฿{t.money}</p>)}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" style={{ width: 60 }} value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
          <input className="input" type="color" style={{ width: 60 }} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          <button className="tab" onClick={async () => { await createTeam.mutateAsync(form); }}>Add</button>
        </div>
        <h2 style={{ marginTop: 16 }}>Create player slots</h2>
        <div style={{ display: "flex", gap: 6 }}>
          <select className="input" value={bulk.teamId} onChange={(e) => setBulk({ ...bulk, teamId: e.target.value })}>
            <option value="">— team —</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input className="input" type="number" style={{ width: 80 }} value={bulk.count} onChange={(e) => setBulk({ ...bulk, count: Number(e.target.value) })} />
          <button className="tab" disabled={!bulk.teamId}
            onClick={async () => { await bulkPlayers.mutateAsync(bulk); }}>Create</button>
        </div>
        <Link className="btn" style={{ marginTop: 14 }} href="/admin/qr-sheet" target="_blank">🖨️ Print QR sheet</Link>
      </div>
      <div className="panel">
        <h2>Player slots ({players.length})</h2>
        <table className="t">
          <thead><tr><th>Slot</th><th>Team</th><th>Nickname</th><th></th></tr></thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id}>
                <td>{p.slotNumber}</td>
                <td>{teams.find((t) => t.id === p.teamId)?.emoji}</td>
                <td>{p.nickname ?? <span className="hint">not joined</span>}</td>
                <td><button className="tab" onClick={async () => {
                  if (!confirm(`Reset slot ${p.slotNumber}? The old printed QR card stops working.`)) return;
                  await resetPlayer.mutateAsync(p.id);
                }}>Reset</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

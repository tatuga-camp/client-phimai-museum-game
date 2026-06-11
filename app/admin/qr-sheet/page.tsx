"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useTeams, usePlayers } from "@/react-query/admin.queries";
import type { Team } from "@/types";

export default function QrSheetPage() {
  const { data: teams } = useTeams();
  const { data: players } = usePlayers();
  const [cards, setCards] = useState<{ id: string; slot: number; team: Team; dataUrl: string }[]>([]);

  useEffect(() => {
    if (!teams || !players) return;
    (async () => {
      const teamById = new Map(teams.map((t) => [t.id, t]));
      const base = window.location.origin;
      const out: { id: string; slot: number; team: Team; dataUrl: string }[] = [];
      for (const p of players) {
        // Guard: skip players whose team was deleted so the page doesn't crash.
        const team = teamById.get(p.teamId);
        if (!team) continue;
        out.push({
          id: p.id,
          slot: p.slotNumber,
          team,
          dataUrl: await QRCode.toDataURL(`${base}/j/${p.qrToken}`, { width: 280, margin: 1 }),
        });
      }
      setCards(out);
    })();
  }, [teams, players]);

  return (
    <main style={{ background: "#fff", color: "#000" }}>
      <style>{`
        @media print { .noprint { display: none; } }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; padding: 6mm; }
        .qcard { border: 1.5px dashed #888; border-radius: 8px; padding: 6px; text-align: center; break-inside: avoid; }
      `}</style>
      <button className="noprint" style={{ margin: 16, padding: 10 }} onClick={() => window.print()}>🖨️ Print</button>
      <div className="grid">
        {cards.map((c) => (
          <div className="qcard" key={c.id} style={{ borderColor: c.team.color }}>
            <div style={{ background: c.team.color, color: "#fff", borderRadius: 6, fontWeight: "bold", padding: 3 }}>
              {c.team.emoji} {c.team.name} · #{c.slot}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.dataUrl} alt={`QR ${c.slot}`} style={{ width: "100%" }} />
            <small>Scan to join! สแกนเพื่อเข้าร่วม</small>
          </div>
        ))}
      </div>
    </main>
  );
}

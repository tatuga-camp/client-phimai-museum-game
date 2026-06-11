"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MoneyBar from "@/components/MoneyBar";
import { useMe, useGameState } from "@/react-query/player.queries";
import type { Submission } from "@/types";

const ROOM_NAMES: Record<number, string> = {
  1: "Prehistoric Life", 2: "Beliefs & Rituals", 3: "Dvaravati Culture",
  4: "Early Khmer Culture", 5: "Khmer Flourishing", 6: "Prosperous Phimai",
  7: "Religion in Phimai", 8: "Phimai 12th–18th C.", 9: "Center of Greatness",
};

export default function PlayPage() {
  const router = useRouter();
  const { data: me, error } = useMe();
  const { data: state } = useGameState();

  useEffect(() => {
    if (error?.status === 401) router.push("/");
  }, [error, router]);

  if (!me) return <main className="page center"><p>Loading… ⏳</p></main>;

  const teams = state?.teams ?? me.teams;
  const mySubmissions = state?.mySubmissions ?? me.mySubmissions;
  const team = teams.find((x) => x.id === me.team.id) ?? me.team;

  const subByTask = new Map(mySubmissions.map((s) => [s.taskId, s]));
  const rooms = [...new Set(me.tasks.map((t) => t.roomNumber))].sort((a, b) => a - b);

  const statusBadge = (s?: Submission) =>
    !s ? null
    : s.status === "correct" ? <span className="ok">✓ +฿{s.moneyAwarded}</span>
    : s.status === "incorrect" ? <span className="bad">✗ locked</span>
    : s.status === "pending_ai" ? <span className="pend">🤖 AI checking…</span>
    : <span className="pend">⏳ waiting for judge</span>;

  return (
    <main className="page">
      <MoneyBar team={team} />
      <div className="card" style={{ marginTop: 12 }}>
        <h2>Team standings <span className="hint">อันดับทีม</span></h2>
        {[...teams].sort((a, b) => b.money - a.money).map((t) => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
            <span>{t.emoji} {t.name}</span><b>฿{t.money.toLocaleString()}</b>
          </div>
        ))}
      </div>
      {rooms.map((room) => (
        <div className="card" key={room}>
          <h2>📍 Room {room} · {ROOM_NAMES[room] ?? ""}</h2>
          {me.tasks.filter((t) => t.roomNumber === room).map((t) => {
            const sub = subByTask.get(t.id);
            const locked = sub && sub.status !== "pending_ai" && sub.status !== "needs_manual";
            return (
              <Link key={t.id} href={locked ? "#" : `/play/task/${t.id}`}
                className="chip" style={{ display: "flex", justifyContent: "space-between", textDecoration: "none", opacity: locked ? 0.7 : 1 }}>
                <span>{t.titleEn.slice(0, 40)}{t.titleEn.length > 40 ? "…" : ""}</span>
                <span>{statusBadge(sub) ?? <b>฿{t.moneyValue}</b>}</span>
              </Link>
            );
          })}
        </div>
      ))}
      <p className="hint center">Free roam — go to any room, any order! 🚶</p>
    </main>
  );
}

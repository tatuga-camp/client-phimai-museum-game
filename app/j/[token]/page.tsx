"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { setToken, ApiError } from "@/services/http";
import { useJoin } from "@/react-query/player.queries";
import type { JoinResponse } from "@/types";

export default function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [team, setTeam] = useState<JoinResponse["team"] | null>(null);
  const [joinedAs, setJoinedAs] = useState("");
  const [error, setError] = useState("");
  const joinMut = useJoin();

  useEffect(() => {
    setToken(token);
  }, [token]);

  async function join(nick: string) {
    setError("");
    try {
      const r = await joinMut.mutateAsync({ qrToken: token, nickname: nick });
      setTeam(r.team);
      setJoinedAs(r.player.nickname);
    } catch (e) {
      const status = (e as ApiError).status;
      if (status === 400 && !nick) return; // silent reconnect probe on a fresh QR — expected, show the form
      setError(
        status === 404
          ? "This QR code is not valid. Ask a teacher! / คิวอาร์โค้ดไม่ถูกต้อง"
          : "Connection problem — try again / ลองอีกครั้ง",
      );
    }
  }

  // Reconnect: if this slot already joined, skip the nickname form.
  useEffect(() => {
    join(""); /* empty nickname: succeeds only if already joined */
  }, []); // eslint-disable-line

  if (team) {
    return (
      <main className="page center">
        <div
          style={{ fontSize: 64, marginTop: 60 }}
          className="flex items-center justify-center"
        >
          <Image
            src="/full-logo.svg"
            alt="Phimai Treasure Hunt"
            width={100}
            height={178}
            style={{ height: "auto" }}
            priority
          />
        </div>
        <h1>Welcome, {joinedAs}!</h1>
        <div
          className="card"
          style={{ borderColor: team.color, marginTop: 16 }}
        >
          <div style={{ fontSize: 40 }}>{team.emoji}</div>
          <h2>
            You are on <span style={{ color: team.color }}>{team.name}</span>
          </h2>
          <p className="hint">Find your teammates! / ไปหาเพื่อนร่วมทีม</p>
        </div>
        <button className="btn" onClick={() => router.push("/play")}>
          Start hunting! →
        </button>
      </main>
    );
  }

  return (
    <main className="page center">
      <div
        style={{ fontSize: 64, marginTop: 60 }}
        className="flex items-center justify-center"
      >
        <Image
          src="/full-logo.svg"
          alt="Phimai Treasure Hunt"
          width={100}
          height={178}
          style={{ height: "auto" }}
          priority
        />
      </div>
      <h1>Phimai Treasure Hunt</h1>
      <p className="hint">ล่าสมบัติพิมาย</p>
      <div className="card" style={{ marginTop: 24, textAlign: "left" }}>
        <label>
          Your nickname <span className="hint">ชื่อเล่นของคุณ</span>
        </label>
        <input
          className="input"
          value={nickname}
          maxLength={24}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="e.g. Beam"
          style={{ marginTop: 8 }}
        />
      </div>
      {error && <p className="bad">{error}</p>}
      <button
        className="btn"
        disabled={joinMut.isPending || !nickname.trim()}
        onClick={() => join(nickname)}
      >
        Let&apos;s go! →
      </button>
    </main>
  );
}

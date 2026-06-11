"use client";
import { useEffect, useState } from "react";
import { useAdminLogin } from "@/react-query/admin.queries";
import TasksTab from "@/components/admin/TasksTab";
import TeamsTab from "@/components/admin/TeamsTab";
import LiveTab from "@/components/admin/LiveTab";
import ReviewsTab from "@/components/admin/ReviewsTab";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"tasks" | "teams" | "live" | "reviews">("tasks");
  const loginMut = useAdminLogin();

  useEffect(() => { setAuthed(!!localStorage.getItem("adminToken")); }, []); // eslint-disable-line

  async function login() {
    try {
      const { token } = await loginMut.mutateAsync(password);
      localStorage.setItem("adminToken", token);
      setAuthed(true);
    } catch {
      setError("Wrong password");
    }
  }

  if (!authed) {
    return (
      <main className="admin" style={{ maxWidth: 420 }}>
        <h1>🏛️ Phimai Hunt — Admin</h1>
        <div className="panel" style={{ marginTop: 16 }}>
          <input className="input" type="password" placeholder="Admin password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()} />
          {error && <p className="bad">{error}</p>}
          <button className="btn" style={{ marginTop: 12 }} onClick={login}>Login</button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin">
      <h1>🏛️ Phimai Hunt — Admin</h1>
      <div className="tabs" style={{ marginTop: 12 }}>
        {(["tasks", "teams", "live", "reviews"] as const).map((t) => (
          <button key={t} className={`tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
            {{ tasks: "📋 Tasks", teams: "👥 Teams & QR", live: "📺 Live", reviews: "🤖 AI Reviews" }[t]}
          </button>
        ))}
      </div>
      {tab === "tasks" && <TasksTab />}
      {tab === "teams" && <TeamsTab />}
      {tab === "live" && <LiveTab />}
      {tab === "reviews" && <ReviewsTab />}
    </main>
  );
}

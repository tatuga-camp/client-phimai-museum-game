const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Error carrying the HTTP status so callers can branch on it. */
export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function getToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem("qrToken");
}
export function setToken(t: string) {
  localStorage.setItem("qrToken", t);
}

/** Player Authorization header (Bearer), or empty if no token. */
export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Admin header read from localStorage. */
export function adminHeaders(): Record<string, string> {
  return {
    "x-admin-token":
      (typeof window !== "undefined" ? localStorage.getItem("adminToken") : null) ?? "",
  };
}

/** Player/public JSON request against the API root. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && typeof init.body === "string") headers.set("Content-Type", "application/json");
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (!res.ok) throw new ApiError("api error", res.status, await res.json().catch(() => ({})));
  return res.json();
}

/** Admin JSON request; paths are relative to /api/admin. */
export async function adminApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("x-admin-token", localStorage.getItem("adminToken") ?? "");
  if (init.body && typeof init.body === "string") headers.set("Content-Type", "application/json");
  const res = await fetch(`${API}/api/admin${path}`, { ...init, headers });
  if (!res.ok) throw new ApiError("admin api error", res.status);
  return res.json();
}

/** Multipart POST. Caller supplies auth headers; Content-Type is set by the browser. */
export async function postForm<T>(
  path: string,
  form: FormData,
  headers: Record<string, string> = {},
): Promise<T> {
  const res = await fetch(`${API}${path}`, { method: "POST", headers, body: form });
  if (!res.ok) throw new ApiError("upload error", res.status, await res.json().catch(() => ({})));
  return res.json();
}

/** Fresh unique id per submission attempt — the idempotency key. */
export const newSubmissionId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

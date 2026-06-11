import { adminApi, postForm, adminHeaders } from "@/services/http";
import type {
  AdminTask,
  Team,
  PlayerRow,
  Live,
  Review,
  TeamInput,
  BulkPlayersInput,
  AdjustInput,
  OverrideInput,
  LoginResponse,
} from "@/types";

export const adminLogin = (password: string) =>
  adminApi<LoginResponse>("/login", { method: "POST", body: JSON.stringify({ password }) });

// The API wraps its list responses ({ tasks } / { teams } / { players } / { reviews });
// unwrap to the bare arrays the UI consumes.
export const getTasks = () =>
  adminApi<{ tasks: AdminTask[] }>("/tasks").then((r) => r.tasks);
export const saveTask = (task: Partial<AdminTask>) =>
  task.id
    ? adminApi<unknown>(`/tasks/${task.id}`, { method: "PUT", body: JSON.stringify(task) })
    : adminApi<unknown>("/tasks", { method: "POST", body: JSON.stringify(task) });

export const getTeams = () =>
  adminApi<{ teams: Team[] }>("/teams").then((r) => r.teams);
export const createTeam = (input: TeamInput) =>
  adminApi<unknown>("/teams", { method: "POST", body: JSON.stringify(input) });

export const getPlayers = () =>
  adminApi<{ players: PlayerRow[] }>("/players").then((r) => r.players);
export const bulkPlayers = (input: BulkPlayersInput) =>
  adminApi<unknown>("/players/bulk", { method: "POST", body: JSON.stringify(input) });
export const resetPlayer = (id: string) =>
  adminApi<unknown>(`/players/${id}/reset`, { method: "POST" });

export const getLive = () => adminApi<Live>("/live");
export const getReviews = () =>
  adminApi<{ reviews: Review[] }>("/reviews").then((r) => r.reviews);

// RESTful routes: the id lives in the path; the body carries only the changed fields.
export const override = (input: OverrideInput) =>
  adminApi<unknown>(`/submissions/${input.submissionId}/override`, {
    method: "POST",
    body: JSON.stringify({ score: input.score, moneyValue: input.moneyValue }),
  });
export const adjust = (input: AdjustInput) =>
  adminApi<unknown>(`/teams/${input.teamId}/adjust`, {
    method: "POST",
    body: JSON.stringify({ amount: input.amount, reason: input.reason }),
  });

// Image upload lives at /api/admin/tasks/upload and expects the form field "image".
export const uploadImage = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append("image", file);
  const { url } = await postForm<{ url: string }>(
    "/api/admin/tasks/upload",
    form,
    adminHeaders(),
  );
  return url;
};

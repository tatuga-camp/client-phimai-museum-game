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

export const getTasks = () => adminApi<AdminTask[]>("/tasks");
export const saveTask = (task: Partial<AdminTask>) =>
  task.id
    ? adminApi<unknown>(`/tasks/${task.id}`, { method: "PUT", body: JSON.stringify(task) })
    : adminApi<unknown>("/tasks", { method: "POST", body: JSON.stringify(task) });

export const getTeams = () => adminApi<Team[]>("/teams");
export const createTeam = (input: TeamInput) =>
  adminApi<unknown>("/teams", { method: "POST", body: JSON.stringify(input) });

export const getPlayers = () => adminApi<PlayerRow[]>("/players");
export const bulkPlayers = (input: BulkPlayersInput) =>
  adminApi<unknown>("/players/bulk", { method: "POST", body: JSON.stringify(input) });
export const resetPlayer = (id: string) =>
  adminApi<unknown>(`/players/${id}/reset`, { method: "POST" });

export const getLive = () => adminApi<Live>("/live");
export const getReviews = () => adminApi<Review[]>("/reviews");
export const override = (input: OverrideInput) =>
  adminApi<unknown>("/override", { method: "POST", body: JSON.stringify(input) });
export const adjust = (input: AdjustInput) =>
  adminApi<unknown>("/adjust", { method: "POST", body: JSON.stringify(input) });

export const uploadImage = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append("file", file);
  const { url } = await postForm<{ url: string }>("/api/admin/upload", form, adminHeaders());
  return url;
};

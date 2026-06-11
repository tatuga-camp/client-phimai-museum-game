import { api, postForm, authHeaders, ApiError } from "@/services/http";
import type { Me, GameState, JoinResponse, SubmitResult } from "@/types";

export const getMe = () => api<Me>("/api/me");
export const getGameState = () => api<GameState>("/api/state");

export type JoinInput = { qrToken: string; nickname: string };
export const join = (input: JoinInput) =>
  api<JoinResponse>("/api/join", { method: "POST", body: JSON.stringify(input) });

export type SubmitAnswerInput = {
  taskId: string;
  payload: Record<string, unknown>;
  clientSubmissionId: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Submit a non-photo answer. The clientSubmissionId is the stable idempotency key,
 * so retrying after a network/5xx blip with the SAME id is safe. Terminal client
 * errors (409 already-answered, other 4xx) throw immediately; exhausted retries
 * throw ApiError with status 0.
 */
export async function submitAnswer(input: SubmitAnswerInput): Promise<SubmitResult> {
  const body = JSON.stringify(input);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await api<SubmitResult>("/api/submissions", { method: "POST", body });
    } catch (e) {
      const status = (e as ApiError).status;
      if (status === 409 || (status && status < 500)) throw e;
      await sleep(800); // 5xx / network → same-id retry is safe
    }
  }
  throw new ApiError("network", 0);
}

export const submitPhoto = (form: FormData) =>
  postForm<SubmitResult>("/api/submissions/photo", form, authHeaders());

export type RevealHintResult = { hintTh: string; cost: number };
export const revealHint = (taskId: string) =>
  api<RevealHintResult>("/api/hints", {
    method: "POST",
    body: JSON.stringify({ taskId }),
  });

import type { Team, TaskType } from "./player";

export type Zone = { x: number; y: number; w: number; h: number };

export type AdminTask = {
  id: string;
  roomNumber: string;
  type: TaskType;
  titleEn: string;
  hintTh: string;
  moneyValue: number;
  isActive: boolean;
  content: Record<string, unknown>;
  answerKey: Record<string, unknown>;
};

export type PlayerRow = {
  id: string;
  slotNumber: number;
  nickname: string | null;
  teamId: string;
  qrToken: string;
};

export type Review = {
  id: string;
  status: string;
  score: number;
  moneyAwarded: number;
  aiComment: string | null;
  photoUrl: string;
  referenceImageUrl: string | null;
  taskTitle: string | null;
  moneyValue: number;
  nickname: string | null;
};

export type LiveFeedItem = {
  id: string;
  nickname: string | null;
  taskTitle: string | null;
  status: string;
  moneyAwarded: number;
  createdAt: string;
};

export type Live = {
  teams: Team[];
  feed: LiveFeedItem[];
  pendingCount: number;
};

export type TeamInput = { name: string; emoji: string; color: string };
export type BulkPlayersInput = { teamId: string; count: number };
export type AdjustInput = { teamId: string; amount: number; reason: string };
export type OverrideInput = {
  submissionId: string;
  score: number;
  moneyValue: number;
};
export type LoginResponse = { token: string };

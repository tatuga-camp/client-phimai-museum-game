export type TaskType = "mc" | "reorder" | "circle" | "photo" | "group";

export type Team = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  money: number;
};

export type Task = {
  id: string;
  roomNumber: string;
  type: TaskType;
  titleEn: string;
  hintTh: string | null; // null until the team reveals the hint
  hintImageUrl: string | null; // gated like hintTh; also null when the task has no image
  hintCost: number; // money it costs to reveal
  hintRevealed: boolean;
  moneyValue: number;
  content: Record<string, unknown>;
};

export type Submission = {
  taskId: string;
  status: string;
  score: number;
  moneyAwarded: number;
  aiComment: string | null;
};

export type SubmitResult = {
  status: string;
  score: number;
  moneyAwarded: number;
  aiComment: string | null;
};

export type Me = {
  player: { nickname: string };
  team: Team;
  teams: Team[];
  tasks: Task[];
  mySubmissions: Submission[];
};

export type GameState = {
  teams: Team[];
  mySubmissions: Submission[];
};

export type JoinResponse = {
  player: { nickname: string };
  team: { name: string; emoji: string; color: string };
};

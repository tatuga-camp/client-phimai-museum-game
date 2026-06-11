export type TaskType = "mc" | "reorder" | "circle" | "photo" | "swap";

export type Team = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  money: number;
};

export type Task = {
  id: string;
  roomNumber: number;
  type: TaskType;
  titleEn: string;
  hintTh: string;
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

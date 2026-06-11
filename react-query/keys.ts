export const qk = {
  me: ["me"] as const,
  gameState: ["gameState"] as const,
  admin: {
    tasks: ["admin", "tasks"] as const,
    teams: ["admin", "teams"] as const,
    players: ["admin", "players"] as const,
    live: ["admin", "live"] as const,
    reviews: ["admin", "reviews"] as const,
  },
} as const;

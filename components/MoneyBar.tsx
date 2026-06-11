export default function MoneyBar({ team }: { team: { name: string; emoji: string; money: number } | null }) {
  if (!team) return null;
  return (
    <div className="bar">
      <span>{team.emoji} {team.name}</span>
      <span>฿{team.money.toLocaleString()}</span>
    </div>
  );
}

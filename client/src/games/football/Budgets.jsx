export default function Budgets({ ordered, playerId, teams, initialBudget }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2">
      {ordered.map((player) => (
        <div
          key={player.id}
          className={`min-w-0 rounded-xl border p-3 ${player.id === playerId ? 'border-primary/40 bg-primary/10' : 'border-border bg-background/50'}`}
        >
          <p className="truncate text-xs text-muted-foreground">
            {player.id === playerId ? 'Ton budget' : player.nickname}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {teams[player.id].budget} <span className="text-sm">€</span>
          </p>
          <progress
            aria-label={`Budget restant de ${player.nickname}`}
            className="mt-2 h-2 w-full accent-primary"
            max={initialBudget}
            value={teams[player.id].budget}
          />
        </div>
      ))}
    </div>
  );
}

export default function TeamPlacement({ team, disabled, onPlace }) {
  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-muted-foreground">
        Place tes recrues librement. Une place occupée échange les deux recrues.
      </p>
      {Object.entries(team.slots).map(([slot, card]) => (
        <label
          key={card.id}
          className="flex items-center justify-between gap-2 text-xs"
        >
          <span className="min-w-0 break-words">{card.name}</span>
          <select
            aria-label={`Placement de ${card.name}`}
            className="rounded-lg border bg-background p-2 text-foreground"
            value={slot}
            disabled={disabled}
            onChange={(e) => onPlace(card.id, e.target.value)}
          >
            {['GB', 'DC', 'MC', 'ATT', 'Joker', 'Coach'].map((target) => (
              <option key={target} value={target}>
                {target === 'Coach' ? 'Touche' : target}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

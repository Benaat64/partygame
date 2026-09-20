const selectClass =
  'min-h-12 rounded-lg bg-background p-3 focus-visible:outline-2 focus-visible:outline-ring';
export default function Timing({ value, onChange, disabled = false }) {
  return (
    <fieldset
      disabled={disabled}
      className="my-5 grid gap-4 rounded-2xl border border-border bg-background/30 p-4 text-sm disabled:opacity-65"
    >
      <legend className="px-2 text-muted-foreground">
        Durée, manches et tours
      </legend>
      <label className="grid gap-2">
        Temps par indice / vote
        <select
          className={selectClass}
          value={value.phaseSeconds ?? 'unlimited'}
          onChange={(e) =>
            onChange({
              ...value,
              phaseSeconds:
                e.target.value === 'unlimited' ? null : Number(e.target.value),
            })
          }
        >
          <option value="unlimited">Illimité</option>
          {[10, 20, 30, 40, 60].map((seconds) => (
            <option key={seconds} value={seconds}>
              {seconds} secondes
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2">
        Nombre de manches dans la partie
        <select
          className={selectClass}
          value={value.matchCount}
          onChange={(e) =>
            onChange({ ...value, matchCount: Number(e.target.value) })
          }
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2">
        Tours maximum par manche
        <select
          className={selectClass}
          value={value.maxTurns}
          onChange={(e) =>
            onChange({ ...value, maxTurns: Number(e.target.value) })
          }
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-muted-foreground">
        Une manche = de nouveaux rôles et mots, avec tous les joueurs. Un tour =
        indices puis vote. Les Undercover gagnent s’ils survivent au dernier
        tour. Les points se cumulent entre les manches. En temps illimité,
        chaque joueur doit envoyer son indice à son tour, puis tous les joueurs
        encore en jeu votent.
      </p>
    </fieldset>
  );
}

import { seconds, difference } from './format';
export default function AttemptHistory({ room }) {
  const g = room.game;
  const rounds = [...new Set(g.results.map((r) => r.round))].reverse();
  const name = (id) =>
    room.players.find((p) => p.id === id)?.nickname ?? 'Joueur';
  return (
    <div className="my-6">
      <h2 className="text-xl font-bold">Les chronos par manche</h2>
      <p className="mt-2 mb-4 text-sm text-muted-foreground">
        − : arrêté trop tôt · + : arrêté trop tard.
      </p>
      {rounds.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
          Les temps apparaîtront après le premier essai.
        </p>
      ) : (
        rounds.map((round) => {
          const results = g.results.filter((r) => r.round === round);
          return (
            <details
              key={round}
              open
              className="mb-3 rounded-2xl border bg-card p-4"
            >
              <summary className="cursor-pointer font-semibold">
                Manche {round}
                <span className="ml-3 text-sm font-normal text-muted-foreground">
                  Cible {seconds(results[0].targetMs)}
                </span>
              </summary>
              <ul className="mt-3 divide-y divide-border">
                {results.map((r) => (
                  <li
                    key={r.playerId}
                    className="grid grid-cols-2 items-center gap-3 py-3 sm:grid-cols-3"
                  >
                    <p className="col-span-2 break-words font-medium sm:col-span-1">
                      {name(r.playerId)}
                    </p>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Temps réalisé
                      </p>
                      <p
                        className={`mt-1 text-xl font-bold tabular-nums ${r.errorMs === 0 ? 'text-emerald-300' : 'text-primary'}`}
                      >
                        {r.elapsedMs === null
                          ? 'Non réalisé'
                          : seconds(r.elapsedMs)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Différence
                      </p>
                      <p
                        className={`mt-1 font-semibold tabular-nums ${r.errorMs === 0 ? 'text-emerald-300' : ''}`}
                      >
                        {difference(r)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          );
        })
      )}
    </div>
  );
}

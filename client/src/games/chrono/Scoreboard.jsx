import { seconds, difference } from './format';
export default function Scoreboard({ room, playerId }) {
  const g = room.game;
  const done = g.phase === 'finished';
  return (
    <>
      {' '}
      <h2 className="mt-8 mb-2 text-xl font-bold">
        {done ? 'Classement final' : 'Tableau des joueurs'}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Le plus petit écart total gagne. Les différences s’additionnent en
        valeur absolue.
      </p>
      <ol className="space-y-3">
        {[...room.players]
          .sort((a, b) => g.scores[a.id] - g.scores[b.id])
          .map((p) => {
            const attempts = g.results.filter((r) => r.playerId === p.id);
            const last = attempts.at(-1);
            return (
              <li
                key={p.id}
                className={`score-row p-4 sm:p-5 ${p.id === playerId ? 'border-primary/40' : ''}`}
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 break-words font-bold">
                    {p.nickname}
                    {p.id === playerId && (
                      <span className="ml-2 text-xs font-normal text-primary">
                        Toi
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {attempts.length}/{room.settings.rounds} essais joués
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Dernier chrono{last ? ` · M${last.round}` : ''}
                    </p>
                    <p
                      className={`mt-1 text-xl font-black tabular-nums ${last?.errorMs === 0 ? 'text-emerald-300' : 'text-primary'}`}
                    >
                      {!last
                        ? 'À venir'
                        : last.elapsedMs === null
                          ? 'Non réalisé'
                          : seconds(last.elapsedMs)}
                    </p>
                    {last && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Cible {seconds(last.targetMs)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Différence</p>
                    <p
                      className={`mt-1 text-lg font-semibold tabular-nums ${last?.errorMs === 0 ? 'text-emerald-300' : ''}`}
                    >
                      {last ? difference(last) : '—'}
                    </p>
                  </div>
                  <div className="col-span-2 rounded-xl bg-background/50 p-3 sm:col-span-1">
                    <p className="text-xs text-muted-foreground">
                      Écart total · classement
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums">
                      {last ? seconds(g.scores[p.id]) : '—'}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
      </ol>
    </>
  );
}

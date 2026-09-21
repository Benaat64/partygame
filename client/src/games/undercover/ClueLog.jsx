export default function ClueLog({
  messages,
  players,
  playerId,
  game,
  paused,
  children,
}) {
  const columns = players;
  const clues = new Map(
    messages.map((m) => [`${m.turn}-${m.playerId}`, m.text]),
  );
  return (
    <section className="min-w-0 rounded-2xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="font-bold">Le tableau des indices</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Un joueur par colonne, un tour par ligne. Compare les indices.
        </p>
      </div>
      <div
        className="max-h-[28rem] overflow-auto rounded-b-2xl focus-visible:outline-2 focus-visible:outline-ring"
        tabIndex={0}
        role="region"
        aria-label="Tableau des indices, défilement horizontal"
      >
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Indices de chaque joueur par tour
          </caption>
          <thead className="sticky top-0 z-10 bg-card">
            <tr>
              <th scope="col" className="p-4">
                Tour
              </th>
              {columns.map((p) => (
                <th
                  scope="col"
                  key={p.id}
                  className={`min-w-36 max-w-56 border-l border-border p-4 ${game.currentPlayerId === p.id ? 'bg-primary/20' : ''}`}
                >
                  <span className="block break-words">
                    {p.nickname}
                    {p.id === playerId ? ' (toi)' : ''}
                  </span>
                  <span
                    className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${game.currentPlayerId === p.id ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
                  >
                    {!p.connected
                      ? 'Reconnexion…'
                      : !game.alive.includes(p.id)
                        ? 'Éliminé'
                        : game.currentPlayerId === p.id
                          ? paused
                            ? 'En pause'
                            : p.id === playerId
                              ? '● À toi'
                              : '● À son tour'
                          : 'En jeu'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: game.turn }, (_, i) => i + 1).map((turn) => (
              <tr key={turn} className="border-t border-border">
                <th scope="row" className="p-4 tabular-nums">
                  {turn}
                </th>
                {columns.map((p) => {
                  const clue = clues.get(`${turn}-${p.id}`);
                  const eliminatedBefore = game.results.some(
                    (r) => r.eliminated === p.id && r.turn < turn,
                  );
                  const active =
                    turn === game.turn && game.currentPlayerId === p.id;
                  const passed =
                    turn < game.turn ||
                    game.phase !== 'clues' ||
                    game.clueOrder.indexOf(p.id) <
                      game.clueOrder.indexOf(game.currentPlayerId);
                  return (
                    <td
                      key={p.id}
                      className={`border-l border-border p-4 align-top [overflow-wrap:anywhere] ${active ? 'bg-primary/10' : ''}`}
                    >
                      {clue ?? (
                        <span
                          className={
                            active
                              ? 'font-semibold text-foreground'
                              : 'text-muted-foreground'
                          }
                        >
                          {eliminatedBefore
                            ? '—'
                            : active
                              ? p.id === playerId
                                ? 'À toi de jouer'
                                : 'Donne son indice…'
                              : passed
                                ? 'Temps écoulé'
                                : 'En attente'}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {children}
    </section>
  );
}

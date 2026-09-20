import { Trophy } from 'lucide-react';
const roles = { civil: 'Civil', undercover: 'Undercover' };
export default function Results({ game, players }) {
  const name = (id) => players.find((p) => p.id === id)?.nickname ?? 'Joueur';
  return (
    <>
      {' '}
      <div className="victory my-5">
        <Trophy aria-hidden="true" className="mb-4 size-10 text-amber-200" />
        <h3 className="text-2xl font-extrabold">
          {game.winner === 'civil'
            ? 'Les Civils gagnent !'
            : 'Les Undercover gagnent !'}
        </h3>
        <ul className="mt-3 space-y-2">
          {game.revelations.map((card) => (
            <li key={card.playerId} className="break-words">
              {name(card.playerId)} : {roles[card.role]} · {card.word}
            </li>
          ))}
        </ul>
      </div>
      <div className="my-5 rounded-3xl border border-border bg-card p-6">
        <h3 className="font-bold">
          {game.seriesFinished ? 'Classement final' : 'Classement provisoire'}
        </h3>
        <p className="my-2 text-sm text-muted-foreground">
          Victoire Civil : +2 pts · Undercover : +3 pts, même éliminé.
        </p>
        {game.seriesFinished && (
          <p className="my-3 font-semibold text-primary">
            Gagnant(s) :{' '}
            {players
              .filter(
                (player) =>
                  game.scores[player.id] ===
                  Math.max(...Object.values(game.scores)),
              )
              .map((player) => player.nickname)
              .join(', ')}
          </p>
        )}
        <ol className="space-y-2">
          {[...players]
            .sort((a, b) => game.scores[b.id] - game.scores[a.id])
            .map((player) => (
              <li
                key={player.id}
                className="score-row flex justify-between gap-3 p-3"
              >
                <span>{player.nickname}</span>
                <span>
                  {game.scores[player.id]} pts (+
                  {game.history.at(-1)?.gains[player.id] ?? 0})
                </span>
              </li>
            ))}
        </ol>
      </div>
    </>
  );
}

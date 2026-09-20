import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Pitch from './Pitch';
import Bidding from './Bidding';
export default function FootballGame({
  session,
  disabled,
  onAction,
  onReset,
  onLeave,
}) {
  const { room, playerId } = session;
  const g = room.game;
  const finished = g.phase === 'finished';
  const [showOpponent, setShowOpponent] = useState(false);
  const ordered = [...room.players].sort(
    (a, b) => Number(b.id === playerId) - Number(a.id === playerId),
  );
  const visible = ordered[showOpponent ? 1 : 0];
  const placement = (player) => ({
    editable: player.id === playerId,
    disabled: disabled || room.paused,
    onPlace: (recruitId, slot) =>
      onAction('place', {
        playerId: recruitId,
        slot,
        gameSessionId: room.gameSessionId,
      }),
  });
  return (
    <div className="game-stage py-6">
      <h1 className={finished ? 'victory' : 'text-3xl font-black'}>
        {finished
          ? 'Deux équipes. À vous de comparer !'
          : 'Le mercato est ouvert.'}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {room.settings.budget} € de départ · GB, DC, MC, ATT, Joker et Coach ·
        Ouverture alternée A / B
      </p>
      {finished ? (
        <div className="my-6 grid gap-5 lg:grid-cols-2">
          {ordered.map((player) => (
            <Pitch
              {...placement(player)}
              key={player.id}
              player={player}
              team={g.teams[player.id]}
            />
          ))}
        </div>
      ) : (
        <div className="my-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <Pitch
              {...placement(ordered[0])}
              player={ordered[0]}
              team={g.teams[ordered[0].id]}
            />
          </div>
          <Bidding
            key={`${g.auction}-${g.price}`}
            room={room}
            playerId={playerId}
            disabled={disabled || room.paused}
            onAction={(action, payload) =>
              onAction(action, {
                ...payload,
                gameSessionId: room.gameSessionId,
              })
            }
          />
          <div className="hidden lg:block">
            <Pitch
              {...placement(ordered[1])}
              player={ordered[1]}
              team={g.teams[ordered[1].id]}
            />
          </div>
          <div className="lg:hidden">
            <div className="mb-3 flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                className="size-12 shrink-0"
                onClick={() => setShowOpponent((value) => !value)}
                aria-label={
                  showOpponent
                    ? 'Afficher mon équipe'
                    : 'Afficher l’équipe adverse'
                }
                aria-controls="mobile-pitch"
              >
                <ArrowLeftRight className="size-5" />
              </Button>
              <p className="font-semibold" role="status">
                {showOpponent ? `Équipe de ${visible.nickname}` : 'Mon équipe'}
              </p>
            </div>
            <div id="mobile-pitch">
              <Pitch
                {...placement(visible)}
                player={visible}
                team={g.teams[visible.id]}
              />
            </div>
          </div>
        </div>
      )}
      <details className="my-5 rounded-2xl border border-border bg-card p-4">
        <summary className="cursor-pointer">
          Historique des recrutements ({g.history.length})
        </summary>
        <ul className="mt-3 space-y-2 text-sm">
          {g.history.map((item) => (
            <li key={item.auction}>
              {item.player.name} →{' '}
              {room.players.find((p) => p.id === item.buyerId)?.nickname} ·{' '}
              {item.price} € · {item.slot}
            </li>
          ))}
        </ul>
      </details>
      <p className="my-4 text-xs text-muted-foreground">
        Six recrues, placement libre : cinq sur le terrain, une sur la touche.
        Le poste indiqué est informatif. Réorganise ton équipe pendant les
        enchères ou à la fin. Tant que les deux équipes sont incomplètes, chaque
        recrutement est confirmé. Dès qu’une équipe est complète, l’autre est
        complétée automatiquement à 1 € par recrue. Une coupure réserve la place
        60 secondes.
      </p>
      <p className="mb-4 text-xs text-muted-foreground">
        Photos et données :{' '}
        <a
          className="underline hover:text-foreground"
          href="https://www.thesportsdb.com"
          target="_blank"
          rel="noreferrer"
        >
          TheSportsDB
        </a>
        .
      </p>
      <div className="flex flex-wrap gap-3">
        {room.hostId === playerId && (
          <Button disabled={disabled} onClick={onReset}>
            {finished ? 'Rejouer' : 'Retour au lobby'}
          </Button>
        )}
        <Button variant="ghost" disabled={disabled} onClick={onLeave}>
          Quitter
        </Button>
      </div>
    </div>
  );
}

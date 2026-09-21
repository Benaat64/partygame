import SecretCard from './SecretCard';
import Results from './Results';
import ClueLog from './ClueLog';
import VotePanel from './VotePanel';
import TurnNotice from '@/components/TurnNotice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { useEffect, useState } from 'react';

const button = 'min-h-12 rounded-xl px-4 py-3 font-semibold';

export default function Game({
  session,
  disabled,
  onReset,
  onLeave,
  onAction,
  onNext,
}) {
  const [revealed, setRevealed] = useState(false);
  const [text, setText] = useState('');
  const [now, setNow] = useState(Date.now());
  const { room, secret, playerId } = session;
  const game = room.game;
  disabled = disabled || room.paused;
  const name = (id) =>
    room.players.find((player) => player.id === id)?.nickname ?? 'Joueur';
  const alive = game.alive.includes(playerId);
  const finished = game.phase === 'finished';
  const sent = game.messages.some(
    (message) => message.playerId === playerId && message.turn === game.turn,
  );
  const myClue = game.currentPlayerId === playerId;
  const voted = game.voted.includes(playerId);
  const seconds = Math.max(0, Math.ceil((game.deadline - now) / 1000));

  useEffect(() => {
    const hide = () => setRevealed(false);
    const timer = setInterval(() => setNow(Date.now()), 250);
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('blur', hide);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('blur', hide);
    };
  }, []);
  useEffect(() => setText(''), [game.turn]);

  async function action(type, data) {
    return onAction(type, {
      ...data,
      turn: game.turn,
      gameSessionId: room.gameSessionId,
    });
  }

  return (
    <section className="game-stage mt-6 space-y-6">
      <p className="text-sm tracking-widest text-primary uppercase">
        Room {room.code}
      </p>
      <h2 className="my-3 text-2xl font-bold">
        Undercover · Manche {game.match}/{room.settings.matchCount} · Tour{' '}
        {game.turn}
      </h2>
      {!finished && (room.paused || !alive || game.phase === 'vote') && (
        <TurnNotice
          active={alive && (game.phase === 'clues' ? myClue : !voted)}
          paused={room.paused}
          done={voted && game.phase === 'vote'}
          title={
            room.paused
              ? 'Partie en pause'
              : !alive
                ? 'Tu es spectateur'
                : game.phase === 'vote'
                  ? voted
                    ? 'Ton vote est enregistré'
                    : 'À toi de voter !'
                  : myClue
                    ? 'À toi de donner un indice !'
                    : `Au tour de ${name(game.currentPlayerId)}`
          }
          description={
            room.paused
              ? 'Un joueur se reconnecte. Le chrono est suspendu.'
              : !alive
                ? 'Suis les indices et les votes des joueurs encore en jeu.'
                : game.phase === 'vote'
                  ? voted
                    ? 'Attends les autres votes ou la fin du chrono.'
                    : 'Tous les joueurs encore en jeu votent. Choisis qui tu soupçonnes.'
                  : myClue
                    ? 'Écris ton indice sous le tableau, puis appuie sur Envoyer mon indice.'
                    : sent
                      ? 'Ton indice est envoyé. Les autres joueurs prennent la parole.'
                      : 'Patiente : tu pourras envoyer ton indice quand ton tour arrivera.'
          }
        />
      )}
      <p className="my-3 text-sm font-semibold tabular-nums text-muted-foreground">
        {finished
          ? game.seriesFinished
            ? 'Partie terminée'
            : 'Manche terminée'
          : room.paused
            ? 'Chrono en pause'
            : game.deadline === null
              ? 'Temps illimité'
              : `Temps restant : ${seconds} s`}
      </p>
      {finished && <Results game={game} players={room.players} />}
      {!finished && (
        <p className="text-sm text-muted-foreground">
          {game.turn <= 2 && !game.results.length
            ? 'Deux tours d’indices avant le premier vote.'
            : 'Un tour d’indices, puis un nouveau vote.'}
        </p>
      )}
      {!!game.results.length && !finished && (
        <p
          role="status"
          className="rounded-xl border border-border bg-primary/10 p-4 font-medium"
        >
          {game.results.at(-1).eliminated
            ? `${name(game.results.at(-1).eliminated)} est éliminé. Les autres continuent.`
            : 'Aucune élimination : donnez un nouvel indice pour départager les soupçons.'}
        </p>
      )}
      <ClueLog
        game={game}
        messages={game.messages}
        players={room.players}
        playerId={playerId}
        paused={room.paused}
      >
        {!finished && alive && game.phase === 'clues' && (
          <form
            className={`border-t border-border p-4 sm:p-5 ${myClue ? 'bg-primary/10' : 'bg-background/40'}`}
            onSubmit={async (event) => {
              event.preventDefault();
              if (await action('clue', { text })) setText('');
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-3 text-sm">
              <label htmlFor="clue" className="font-bold">
                {sent
                  ? 'Ton indice est posé ✓'
                  : myClue
                    ? 'À toi. Brouille les pistes.'
                    : 'Ton prochain indice'}
              </label>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {text.length}/120
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border-2 border-border bg-background p-2 transition-colors focus-within:border-foreground">
              <Input
                id="clue"
                className="min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                placeholder={
                  sent
                    ? 'Bien joué, écoute les autres…'
                    : myClue
                      ? 'Un indice, sans trop en dire…'
                      : 'En attendant ton tour…'
                }
                value={text}
                maxLength={120}
                disabled={disabled || sent || !myClue}
                onChange={(event) => setText(event.target.value)}
                required
                autoComplete="off"
                aria-describedby="clue-hint"
              />
              <Button
                className="size-11 shrink-0 rounded-xl p-0"
                aria-label="Envoyer mon indice"
                disabled={disabled || sent || !myClue || !text.trim()}
              >
                <Send className="size-5" />
              </Button>
            </div>
            <p id="clue-hint" className="mt-2 text-xs text-muted-foreground">
              {room.paused
                ? 'La partie est en pause.'
                : sent
                  ? 'Les autres joueurs prennent la parole.'
                  : myClue
                    ? 'Entrée ou la flèche pour poser ton indice.'
                    : `C’est au tour de ${name(game.currentPlayerId)}.`}
            </p>
          </form>
        )}
      </ClueLog>
      {!finished && game.phase === 'vote' && (
        <VotePanel
          game={game}
          players={room.players}
          playerId={playerId}
          disabled={disabled}
          alive={alive}
          voted={voted}
          onVote={(targetId) => action('vote', { targetId })}
        />
      )}
      {!finished && (
        <SecretCard
          revealed={revealed}
          secret={secret}
          onToggle={() => setRevealed((value) => !value)}
        />
      )}
      {!!game.results.length && (
        <div className="my-4" aria-live="polite">
          <h3 className="font-bold">Résultats des votes</h3>
          {game.results.map((result) => (
            <p key={result.turn} className="mt-2 text-sm text-muted-foreground">
              Tour {result.turn} :{' '}
              {result.eliminated
                ? `${name(result.eliminated)} est éliminé`
                : 'Aucune élimination (égalité ou aucun vote)'}
              .
            </p>
          ))}
        </div>
      )}
      <p className="my-4 text-sm text-muted-foreground">
        Deux tours avant le premier vote, puis un tour entre chaque vote. Une
        égalité n’élimine personne. Une coupure réserve la place 60 secondes et
        met la partie en pause. Un départ volontaire ou un délai expiré ramène
        le groupe au lobby.
      </p>
      <div className="mt-4 grid gap-3">
        {room.hostId === playerId && finished && !game.seriesFinished && (
          <Button className={button} disabled={disabled} onClick={onNext}>
            Lancer la manche {game.match + 1}
          </Button>
        )}
        {room.hostId === playerId && (
          <Button
            variant="secondary"
            className={button}
            disabled={disabled}
            onClick={onReset}
          >
            {game.seriesFinished
              ? 'Rejouer · retour au lobby'
              : 'Arrêter et revenir au lobby'}
          </Button>
        )}
        <Button
          variant="ghost"
          className={`${button} text-muted-foreground`}
          disabled={disabled && !room.paused}
          onClick={onLeave}
        >
          Quitter la room
        </Button>
      </div>
    </section>
  );
}

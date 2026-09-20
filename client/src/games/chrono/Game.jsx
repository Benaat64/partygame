import Scoreboard from './Scoreboard';
import AttemptHistory from './AttemptHistory';
import { seconds, difference } from './format';
import { useEffect, useRef, useState } from 'react';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClockDisplay, { Buzzer } from './ClockDisplay';
import TurnNotice from '@/components/TurnNotice';
export default function ChronoGame({
  session,
  disabled,
  onAction,
  onReset,
  onLeave,
}) {
  const { room, playerId } = session;
  const g = room.game;
  const mine = g.activeId === playerId;
  const done = g.phase === 'finished';
  const start = useRef(null);
  const [elapsed, setElapsed] = useState(0);
  const [sending, setSending] = useState(false);
  useEffect(() => {
    start.current = null;
    setElapsed(0);
  }, [g.round, g.activeId]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (start.current !== null) setElapsed(performance.now() - start.current);
    }, 20);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (room.paused) start.current = null;
  }, [room.paused]);
  const name = (id) =>
    room.players.find((p) => p.id === id)?.nickname ?? 'Joueur';
  const latest = g.results.at(-1);
  const showingResult = Boolean(latest) && g.phase !== 'running';
  async function command(action, payload = {}) {
    return onAction(action, {
      ...payload,
      round: g.round,
      gameSessionId: room.gameSessionId,
    });
  }
  async function buzz() {
    if (sending || disabled || room.paused || !mine) return;
    const measured =
      start.current === null
        ? null
        : Math.round(performance.now() - start.current);
    setSending(true);
    try {
      if (g.phase === 'ready') {
        if (await command('begin')) {
          start.current = performance.now();
          setElapsed(0);
        }
      } else if (measured !== null) {
        start.current = null;
        setElapsed(measured);
        await command('stop', { elapsedMs: Math.min(30000, measured) });
      }
    } finally {
      setSending(false);
    }
  }
  return (
    <section className="game-stage mx-auto max-w-3xl py-6">
      <h1 className="text-3xl font-black">Défi Chrono</h1>
      <p className="mt-2 text-muted-foreground">
        Manche {g.round}/{room.settings.rounds} ·{' '}
        {room.settings.hidden ? 'Chrono caché' : 'Chrono visible'}
      </p>
      {!done && (
        <TurnNotice
          active={mine}
          paused={room.paused}
          title={
            room.paused
              ? 'En pause'
              : mine
                ? 'À toi de buzzer !'
                : `Au tour de ${name(g.activeId)}`
          }
          description={
            room.paused
              ? 'Une coupure interrompt la mesure locale. Au retour, passe ton essai si nécessaire.'
              : 'Démarre, puis arrête au plus près de la cible.'
          }
        />
      )}
      <div className="chrono-console my-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {showingResult
            ? `Cible · Manche ${latest.round}`
            : 'Temps à atteindre'}
        </p>
        <p className="mt-1 mb-6 text-3xl font-black tabular-nums">
          {seconds(showingResult ? latest.targetMs : g.targetMs)}
        </p>
        <div
          key={
            showingResult ? `result-${latest.round}-${latest.playerId}` : 'live'
          }
          className={
            showingResult && latest.elapsedMs !== null
              ? 'animate-pulse [animation-duration:600ms] [animation-iteration-count:3] motion-reduce:animate-none'
              : ''
          }
        >
          <ClockDisplay
            milliseconds={
              showingResult ? (latest.elapsedMs ?? 0) : mine ? elapsed : 0
            }
            hidden={
              showingResult
                ? latest.elapsedMs === null
                : g.phase === 'running' && (!mine || room.settings.hidden)
            }
            perfect={showingResult && latest.errorMs === 0}
            label={
              showingResult
                ? `Temps de ${name(latest.playerId)}`
                : 'Chronomètre'
            }
          />
        </div>
        <div
          className="mt-4 min-h-12"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {showingResult ? (
            <>
              <p className="break-words font-semibold">
                {name(latest.playerId)} ·{' '}
                {latest.elapsedMs === null
                  ? 'Essai passé ou expiré'
                  : 'Chrono arrêté'}
              </p>
              <p
                className={`mt-1 text-sm ${latest.errorMs === 0 ? 'font-bold text-emerald-300' : 'text-muted-foreground'}`}
              >
                {latest.errorMs === 0
                  ? 'Parfait !'
                  : `Différence : ${difference(latest)}`}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {!mine
                ? `Au tour de ${name(g.activeId)}`
                : g.phase === 'running'
                  ? 'Buzze quand tu penses avoir atteint la cible.'
                  : 'Appuie sur le buzzer pour démarrer.'}
            </p>
          )}
        </div>
        {!done && (
          <>
            {showingResult && (
              <p className="mt-3 text-sm text-muted-foreground">
                {mine
                  ? 'À toi de démarrer'
                  : `En attente de ${name(g.activeId)}`}{' '}
                · Prochaine cible : {seconds(g.targetMs)}
              </p>
            )}
            <Buzzer
              disabled={
                disabled ||
                room.paused ||
                !mine ||
                sending ||
                (g.phase === 'running' && start.current === null)
              }
              running={g.phase === 'running'}
              onClick={buzz}
            />
            {mine && (
              <Button
                variant="ghost"
                className="mt-4"
                disabled={disabled || room.paused || sending}
                onClick={() => command('forfeit')}
              >
                Passer cet essai (+30 s)
              </Button>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              30 secondes maximum par essai. Un essai passé ou expiré ajoute 30
              secondes d’écart.
            </p>
          </>
        )}
      </div>
      {done && (
        <div className="victory my-6">
          <Trophy className="mb-3 size-10 text-primary" />
          <h2 className="text-2xl font-bold">
            Gagnant(s) :{' '}
            {room.players
              .filter(
                (p) => g.scores[p.id] === Math.min(...Object.values(g.scores)),
              )
              .map((p) => p.nickname)
              .join(', ')}
          </h2>
        </div>
      )}
      <Scoreboard room={room} playerId={playerId} />
      <AttemptHistory room={room} />
      <div className="flex gap-3">
        {room.hostId === playerId && (
          <Button disabled={disabled} onClick={onReset}>
            {done ? 'Rejouer' : 'Retour au lobby'}
          </Button>
        )}
        <Button variant="ghost" disabled={disabled} onClick={onLeave}>
          Quitter
        </Button>
      </div>
    </section>
  );
}

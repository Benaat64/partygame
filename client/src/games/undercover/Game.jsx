import TurnNotice from '@/components/TurnNotice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, MessageCircle, Trophy, Send, Users, Vote } from 'lucide-react';
import { useEffect, useState } from 'react';

const roles = { civil: 'Civil', undercover: 'Undercover' };
const button = 'min-h-12 rounded-xl px-4 py-3 font-semibold';

export default function Game({ session, disabled, onReset, onLeave, onAction, onNext }) {
  const [revealed, setRevealed] = useState(false);
  const [text, setText] = useState('');
  const [now, setNow] = useState(Date.now());
  const { room, secret, playerId } = session;
  const game = room.game;
  disabled = disabled || room.paused;
  const name = id => room.players.find(player => player.id === id)?.nickname ?? 'Joueur';
  const alive = game.alive.includes(playerId);
  const finished = game.phase === 'finished';
  const sent = game.messages.some(message => message.playerId === playerId && message.turn === game.turn);
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
    return onAction(type, { ...data, turn: game.turn, gameSessionId: room.gameSessionId });
  }

  return (
    <section className="mt-6 space-y-6">
      <p className="text-sm tracking-widest text-primary uppercase">Room {room.code}</p>
      <h2 className="my-3 text-2xl font-bold">Undercover · Manche {game.match}/{room.settings.matchCount} · Tour {game.turn}/{room.settings.maxTurns}</h2>
      {!finished && <TurnNotice active={alive && (game.phase === 'clues' ? myClue : !voted)} paused={room.paused} done={voted && game.phase === 'vote'}
        title={room.paused ? 'Partie en pause' : !alive ? 'Tu es spectateur' : game.phase === 'vote' ? (voted ? 'Ton vote est enregistré' : 'À toi de voter !') : myClue ? 'À toi de donner un indice !' : `Au tour de ${name(game.currentPlayerId)}`}
        description={room.paused ? 'Un joueur se reconnecte. Le chrono est suspendu.' : !alive ? 'Suis les indices et les votes des joueurs encore en jeu.' : game.phase === 'vote' ? (voted ? 'Attends les autres votes ou la fin du chrono.' : 'Tous les joueurs encore en jeu votent. Choisis qui tu soupçonnes.') : myClue ? 'Écris ton indice dans le tchat, puis appuie sur Envoyer mon indice.' : sent ? 'Ton indice est envoyé. Les autres joueurs prennent la parole.' : 'Patiente : tu pourras envoyer ton indice quand ton tour arrivera.'} />}
      <p className="my-3 text-sm font-semibold tabular-nums text-muted-foreground">{finished ? (game.seriesFinished ? 'Partie terminée' : 'Manche terminée') : room.paused ? 'Chrono en pause' : game.deadline === null ? 'Temps illimité' : `Temps restant : ${seconds} s`}</p>
      {!finished && <>
        {!alive && <p className="my-4 text-amber-200">Vous êtes éliminé. Vous pouvez suivre le tchat et les résultats.</p>}
        <div className="my-5 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-card p-6 text-center">
          {revealed && secret && <div className="mb-4"><p>{roles[secret.role]}</p><p className="text-3xl font-bold">{secret.word}</p></div>}
          <Button className={button} disabled={!secret} onClick={() => setRevealed(value => !value)} aria-pressed={revealed}>
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{revealed ? 'Masquer ma carte' : 'Révéler ma carte'}
          </Button>
        </div>
      </>}
      {finished && <div className="my-5 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 to-card p-6">
        <Trophy aria-hidden="true" className="mb-4 size-10 text-amber-200" /><h3 className="text-2xl font-extrabold">{game.winner === 'civil' ? 'Les Civils gagnent !' : 'Les Undercover gagnent !'}</h3>
        <ul className="mt-3 space-y-2">{game.revelations.map(card => <li key={card.playerId} className="break-words">
          {name(card.playerId)} : {roles[card.role]} · {card.word}
        </li>)}</ul>
      </div>}
      {finished && <div className="my-5 rounded-3xl border border-border bg-card p-6">
        <h3 className="font-bold">{game.seriesFinished ? 'Classement final' : 'Classement provisoire'}</h3>
        <p className="my-2 text-sm text-muted-foreground">Victoire Civil : +2 pts · Undercover : +3 pts, même éliminé.</p>
        {game.seriesFinished && <p className="my-3 font-semibold text-primary">Gagnant(s) : {room.players.filter(player => game.scores[player.id] === Math.max(...Object.values(game.scores))).map(player => player.nickname).join(', ')}</p>}
        <ol className="space-y-2">{[...room.players].sort((a, b) => game.scores[b.id] - game.scores[a.id]).map(player => <li key={player.id} className="flex justify-between gap-3 rounded-xl bg-background/60 p-3">
          <span>{player.nickname}</span><span>{game.scores[player.id]} pts (+{game.history.at(-1)?.gains[player.id] ?? 0})</span>
        </li>)}</ol>
      </div>}
      {!finished && <p className="my-3 text-sm text-muted-foreground">Ordre des indices : {game.clueOrder.map(name).join(' → ')}</p>}
      <h3 className="my-3 flex items-center gap-2 text-lg font-bold"><MessageCircle className="size-5 text-primary" />Les indices</h3>
      <ol role="log" aria-label="Indices des joueurs" aria-live="polite" className="max-h-96 space-y-3 overflow-y-auto rounded-3xl border border-border bg-card p-4 sm:p-6">
        {!game.messages.length && <li className="text-muted-foreground">Donnez un indice sans écrire votre mot secret.</li>}
        {game.messages.map(message => <li key={`${message.turn}-${message.playerId}`} className={`rounded-2xl p-4 break-words ${message.playerId === playerId ? 'ml-5 bg-primary/15' : 'mr-5 bg-background/60'}`}>
          <span className="text-sm text-primary">Tour {message.turn} · {name(message.playerId)}</span>
          <p className="mt-1 [overflow-wrap:anywhere]">{message.text}</p>
        </li>)}
      </ol>
      {!finished && alive && game.phase === 'clues' && <form className="my-4 grid gap-3" onSubmit={async event => {
        event.preventDefault();
        if (await action('clue', { text })) setText('');
      }}>
        <label htmlFor="clue" className="text-sm">{sent ? 'Indice envoyé. Attendez le vote.' : !myClue ? `Attendez votre tour : ${name(game.currentPlayerId)} donne son indice.` : 'Votre indice (120 caractères maximum)'}</label>
        <Input id="clue" className="min-h-12 rounded-xl border border-input bg-background/60 p-3 focus-visible:outline-2 focus-visible:outline-ring" value={text} maxLength={120}
          disabled={disabled || sent || !myClue} onChange={event => setText(event.target.value)} required autoComplete="off" />
        <Button className={button} disabled={disabled || sent || !myClue || !text.trim()}><Send className="size-4" />Envoyer mon indice</Button>
      </form>}
      {!finished && game.phase === 'vote' && <div className="my-5 rounded-3xl border border-primary/25 bg-card p-5">
        <h3 className="mb-3 flex items-center gap-2 font-bold"><Vote className="size-5 text-primary" />{voted ? 'Vote enregistré' : 'Qui est Undercover ?'} · {game.voted.length}/{game.alive.length} votes</h3>
        <div className="grid gap-3 sm:grid-cols-2">{room.players.filter(player => game.alive.includes(player.id)).map(player => (
          <Button key={player.id} className={button} disabled={disabled || !alive || voted || player.id === playerId}
            onClick={() => action('vote', { targetId: player.id })}>{player.nickname}{player.id === playerId ? ' (vous)' : ''}</Button>
        ))}</div>
      </div>}
      <h3 className="my-3 flex items-center gap-2 font-bold"><Users className="size-5 text-primary" />La bande</h3>
      <ul className="grid gap-2 sm:grid-cols-2">{room.players.map(player => <li className="rounded-xl border border-border bg-card p-3 text-sm" key={player.id}>{player.nickname} · {!player.connected ? 'Reconnexion…' : game.alive.includes(player.id) ? 'En jeu' : 'Éliminé'}</li>)}</ul>
      {!!game.results.length && <div className="my-4" aria-live="polite"><h3 className="font-bold">Résultats des votes</h3>
        {game.results.map(result => <p key={result.turn} className="mt-2 text-sm text-muted-foreground">Tour {result.turn} : {result.eliminated ? `${name(result.eliminated)} est éliminé` : 'Aucune élimination (égalité ou aucun vote)'}.</p>)}
      </div>}
      <p className="my-4 text-sm text-muted-foreground">Un indice et un vote par joueur et par tour. Une égalité n’élimine personne. Une coupure réserve la place 60 secondes et met la partie en pause. Un départ volontaire ou un délai expiré ramène le groupe au lobby.</p>
      <div className="mt-4 grid gap-3">
        {room.hostId === playerId && finished && !game.seriesFinished && <Button className={button} disabled={disabled} onClick={onNext}>Lancer la manche {game.match + 1}</Button>}
        {room.hostId === playerId && <Button variant="secondary" className={button} disabled={disabled} onClick={onReset}>{game.seriesFinished ? 'Rejouer · retour au lobby' : 'Arrêter et revenir au lobby'}</Button>}
        <Button variant="ghost" className={`${button} text-muted-foreground`} disabled={disabled && !room.paused} onClick={onLeave}>Quitter la room</Button>
      </div>
    </section>
  );
}

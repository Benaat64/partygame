import ChronoSettings from '../games/chrono/Settings.jsx';
import { useEffect, useState } from 'react';
import { Check, Copy, Crown, Gamepad2, LogOut, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Settings from '../games/undercover/Settings.jsx';

export default function Lobby({ session, disabled, onLeave, onSettings, onStart }) {
  const { room, playerId } = session;
  const football = room.gameId === 'football';
  const isHost = room.hostId === playerId;
  const [copyStatus, setCopyStatus] = useState('');
  useEffect(() => {
    if (!copyStatus) return;
    const timer = setTimeout(() => setCopyStatus(''), 3000);
    return () => clearTimeout(timer);
  }, [copyStatus]);
  async function copyCode() {
    try { await navigator.clipboard.writeText(room.code); setCopyStatus('Copié !'); }
    catch { setCopyStatus('Sélectionne le code pour le copier manuellement.'); }
  }
  return (
    <section className="py-8" aria-labelledby="lobby-title">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div><Badge variant="secondary" className="mb-3 gap-2 rounded-full text-primary"><Gamepad2 className="size-3.5" />{football ? 'Duel de foot' : room.gameId === 'chrono' ? 'Défi Chrono' : 'Undercover'}</Badge><h1 id="lobby-title" className="text-3xl font-black tracking-tight sm:text-4xl">La bande se réunit.</h1><p className="mt-2 text-muted-foreground">Invite tes amis, ajuste les règles et lance la partie.</p></div>
        <Button variant="ghost" className="min-h-11 text-muted-foreground" disabled={disabled} onClick={onLeave}><LogOut className="size-4" />Quitter</Button>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5">
          <Card className="rounded-3xl border-primary/25 bg-gradient-to-br from-primary/15 to-card shadow-none">
            <CardContent className="p-6 text-center"><p className="text-sm text-muted-foreground">Le code à partager</p><div className="mt-3 flex flex-wrap items-center justify-center gap-3"><strong className="select-all font-mono text-[clamp(1.8rem,7vw,3rem)] tracking-[0.18em] text-primary">{room.code}</strong><Button type="button" variant="secondary" size="icon" className="size-11 rounded-xl" onClick={copyCode} aria-label="Copier le code de la room" title="Copier le code">{copyStatus === 'Copié !' ? <Check className="size-5 text-emerald-300" /> : <Copy className="size-5" />}</Button></div><p className="mt-2 min-h-5 text-xs text-muted-foreground" role="status">{copyStatus || 'Un seul code pour toute la bande.'}</p></CardContent>
          </Card>
          <Card className="rounded-3xl shadow-none">
            <CardHeader><CardTitle className="flex items-center justify-between text-lg"><span className="flex items-center gap-2"><Users className="size-5 text-primary" />Les joueurs</span><Badge variant="secondary" className="rounded-full">{room.players.length}</Badge></CardTitle><CardDescription>{football ? 'Exactement 2 joueurs pour ce duel.' : room.gameId === 'chrono' ? 'Au moins 2 joueurs pour le défi.' : 'Il faut au moins 3 joueurs pour commencer.'}</CardDescription></CardHeader>
            <CardContent><ul className="space-y-2" aria-live="polite">{room.players.map((player, index) => <li key={player.id} className="flex items-center gap-3 rounded-2xl bg-background/40 p-3">
              <div aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-xl font-bold ${['bg-violet-400/20 text-violet-200','bg-emerald-400/20 text-emerald-200','bg-amber-400/20 text-amber-200'][index % 3]}`}>{player.nickname.slice(0, 1).toUpperCase()}</div>
              <div className="min-w-0 flex-1"><p className="truncate font-medium">{player.nickname} {player.id === playerId && <span className="text-xs text-muted-foreground">(toi)</span>}</p><p className={`text-xs ${player.connected ? 'text-emerald-300' : 'text-amber-300'}`}>{player.connected ? 'Prêt à jouer' : 'Reconnexion…'}</p></div>
              {player.id === room.hostId && <Badge variant="secondary" className="gap-1 rounded-full text-amber-200"><Crown className="size-3" />Hôte</Badge>}
            </li>)}</ul></CardContent>
          </Card>
          {room.paused && <p className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-200" role="status">Un joueur se reconnecte. Sa place est réservée 60 secondes.</p>}
        </div>
        <Card className="rounded-3xl shadow-none"><CardHeader><CardTitle className="text-xl">À votre façon</CardTitle><CardDescription>{isHost ? 'Tu es l’hôte : choisis le rythme de la partie.' : 'L’hôte prépare la partie. Encore un petit instant !'}</CardDescription></CardHeader><CardContent>{football ? <div className="space-y-5"><p className="text-muted-foreground">250 € chacun. Compose ton équipe : GB, DC, MC, ATT et Joker. Les enchères s’ouvrent à tour de rôle.</p>{isHost ? <Button className="h-12 w-full" disabled={disabled || room.paused || room.players.length !== 2} onClick={onStart}>Lancer le mercato</Button> : <p>En attente de l’hôte…</p>}</div> : room.gameId === 'chrono' ? <ChronoSettings room={room} isHost={isHost} disabled={disabled || room.paused} onSettings={onSettings} onStart={onStart} /> : <Settings room={room} isHost={isHost} disabled={disabled || room.paused} onSettings={onSettings} onStart={onStart} />}</CardContent></Card>
      </div>
    </section>
  );
}

import ChronoGame from './games/chrono/Game.jsx';
import FootballGame from './games/football/Game.jsx';
import { Gamepad2 } from 'lucide-react';
import Home from './components/Home.jsx';
import Lobby from './components/Lobby.jsx';
import Game from './games/undercover/Game.jsx';
import { useRoom } from './hooks/useRoom.js';

export default function App() {
  const { connected, session, pending, error, request } = useRoom();
  const disabled = !connected || pending;
  return (
    <main className={`mx-auto min-h-screen px-4 py-5 sm:px-7 ${session?.room.status === 'playing' && session.room.gameId === 'undercover' ? 'max-w-2xl' : 'max-w-6xl'}`}>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <a href="/" aria-label="PartyRoom — revenir à l’accueil" className="flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" onClick={async event => {
          event.preventDefault();
          if (disabled) return;
          if (session) await request('room:leave');
        }}><div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Gamepad2 className="size-6" /></div><span className="text-xl font-extrabold tracking-tight">PartyRoom<span className="text-primary">.</span></span></a>
        <p className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground" role="status">
          <span aria-hidden="true" className={`size-2 rounded-full ${connected ? 'bg-emerald-300' : 'bg-amber-300'}`} />
          {connected ? 'En ligne' : 'Connexion…'}{pending && ' · Un instant…'}
        </p>
      </header>
      {error && <p className="my-4 rounded-[10px] bg-destructive/10 p-3.5 leading-[1.6] text-destructive" role="alert">{error}</p>}
      {session
        ? session.room.status === 'playing'
          ? roomGame(session, disabled, request)
          : <Lobby session={session} disabled={disabled} onLeave={() => request('room:leave')}
              onSettings={settings => request('room:settings', settings)} onStart={() => request('room:start')} />
        : <Home disabled={disabled} onCreate={payload => request('room:create', payload)}
            onJoin={payload => request('room:join', payload)} />}
    </main>
  );
}

function roomGame(session, disabled, request) {
  const Component = session.room.gameId === 'football' ? FootballGame : session.room.gameId === 'chrono' ? ChronoGame : Game;
  return <Component key={session.room.gameSessionId} session={session} disabled={disabled}
    onAction={(action,payload)=>request(`game:${action}`,payload)}
    onNext={()=>request('room:next')} onReset={()=>request('room:reset')} onLeave={()=>request('room:leave')} />;
}

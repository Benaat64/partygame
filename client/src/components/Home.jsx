import { ChronoOptions } from '../games/chrono/Settings.jsx';
import { Timer, Trophy, Check } from 'lucide-react';
import { useState } from 'react';
import { ArrowRight, Gamepad2, KeyRound, SlidersHorizontal, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Timing from '../games/undercover/Timing.jsx';

export default function Home({ disabled, onCreate, onJoin }) {
  const [gameId,setGameId]=useState('undercover');
  const [chronoSettings,setChronoSettings]=useState({rounds:3,hidden:false});
  const modes=[{id:'undercover',name:'Undercover',description:'Dès 3 joueurs · Indices & bluff',icon:Gamepad2},{id:'football',name:'Mercato',description:'1 contre 1 · Enchères de foot',icon:Trophy},{id:'chrono',name:'Défi Chrono',description:'Dès 2 joueurs · Précision & buzzer',icon:Timer}];
  const selected=modes.find(mode=>mode.id===gameId);
  const [nickname, setNickname] = useState('');
  const [timing, setTiming] = useState({ phaseSeconds: 30, matchCount: 3, maxTurns: 3 });
  const [code, setCode] = useState('');
  return (
    <div className="grid items-center gap-8 py-8 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:py-14">
      <section>
        <Badge variant="secondary" className="gap-2 rounded-full px-3 py-1.5 text-primary"><Sparkles className="size-3.5" />La soirée commence ici</Badge>
        <h1 className="mt-6 text-5xl leading-[1.08] font-black tracking-tight sm:text-6xl">Vos amis.<br />Un peu de bluff.<br /><span className="text-primary">Beaucoup de fun.</span></h1>
        <p className="mt-5 max-w-sm text-lg leading-relaxed text-muted-foreground">Une room, un code à partager et c’est parti. Qui saura garder son secret ?</p>
        <div className="mt-8 space-y-3" aria-label="Choix du jeu"><h2 className="text-xs font-semibold tracking-widest text-primary uppercase">À l’affiche</h2>{modes.map(mode=>{const Icon=mode.icon;return <button key={mode.id} type="button" disabled={disabled} aria-pressed={gameId===mode.id} aria-controls="room-options" onClick={()=>setGameId(mode.id)} className={`flex w-full items-center gap-4 rounded-3xl border p-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60 ${gameId===mode.id?'border-primary bg-primary/15':'border-border bg-card hover:border-primary/50'}`}>
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Icon className="size-7" /></span><span className="flex-1"><span className="block text-xl font-bold">{mode.name}</span><span className="mt-1 block text-sm text-muted-foreground">{mode.description}</span></span>{gameId===mode.id&&<Check className="size-5 shrink-0 text-primary" />}
        </button>})}</div>
      </section>
      <Card id="room-options" className="rounded-3xl border-white/10 shadow-2xl shadow-black/20">
        <CardHeader className="px-6 pt-7 sm:px-8"><CardTitle className="text-2xl">{selected.name} · On joue ?</CardTitle><CardDescription>Choisis un pseudo et retrouve ta bande.</CardDescription></CardHeader>
        <CardContent className="px-6 pb-7 sm:px-8">
          <Tabs defaultValue="create">
            <TabsList className="mb-6 grid h-12 w-full grid-cols-2 rounded-xl bg-background/70 p-1">
              <TabsTrigger className="h-full rounded-lg" value="create">Créer une room</TabsTrigger>
              <TabsTrigger className="h-full rounded-lg" value="join">Rejoindre</TabsTrigger>
            </TabsList>
            <div className="mb-5 space-y-2"><Label htmlFor="nickname">Ton pseudo</Label><Input className="h-12 rounded-xl bg-background/50" id="nickname" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Ex. Camille" maxLength={24} autoComplete="nickname" /></div>
            <TabsContent value="create">
              <form onSubmit={e => { e.preventDefault(); onCreate({ nickname, gameId, timing: gameId === 'football' ? {budget:250} : gameId === 'chrono' ? chronoSettings : timing }); }}>
                {gameId === 'undercover' && <><details className="mb-5 rounded-xl border border-border bg-background/30 p-4">
                  <summary className="cursor-pointer text-sm font-medium marker:text-primary"><span className="ml-1 inline-flex items-center gap-2"><SlidersHorizontal className="size-4 text-primary" />Personnaliser la partie</span></summary>
                  <Timing value={timing} onChange={setTiming} disabled={disabled} />
                </details>
                <p className="mb-5 text-sm text-muted-foreground">{timing.matchCount} manches · {timing.maxTurns} tours max. · {timing.phaseSeconds === null ? 'Temps illimité' : `${timing.phaseSeconds} s par indice`}</p>
                </>}
                {gameId === 'chrono' && <ChronoOptions value={chronoSettings} onChange={setChronoSettings} disabled={disabled} />}
                {gameId === 'football' && <p className="mb-5 text-sm text-muted-foreground">250 € chacun · 5 recrues · GB, DC, MC, ATT et Joker</p>}
                <Button className="h-12 w-full rounded-xl text-base font-bold" disabled={disabled || nickname.trim().length < 2}>Créer ma room<ArrowRight className="ml-2 size-4" /></Button>
              </form>
            </TabsContent>
            <TabsContent value="join">
              <p className="mb-4 text-sm text-muted-foreground">Le code retrouve automatiquement le bon jeu, quelle que soit la carte sélectionnée.</p>
              <form className="space-y-5" onSubmit={e => { e.preventDefault(); onJoin({ nickname, code }); }}>
                <div className="space-y-2"><Label htmlFor="code"><KeyRound className="size-4 text-primary" />Code de la room</Label><Input id="code" className="h-14 rounded-xl bg-background/50 text-center text-xl tracking-[0.3em] uppercase" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="ABC234" maxLength={6} required autoCapitalize="characters" spellCheck={false} autoComplete="off" /></div>
                <Button className="h-12 w-full rounded-xl text-base font-bold" disabled={disabled || nickname.trim().length < 2 || code.trim().length !== 6}>Rejoindre mes amis<ArrowRight className="ml-2 size-4" /></Button>
              </form>
            </TabsContent>
          </Tabs>
          <p className="mt-5 text-center text-xs text-muted-foreground">Pas de compte. Juste un pseudo et tes amis.</p>
        </CardContent>
      </Card>
    </div>
  );
}

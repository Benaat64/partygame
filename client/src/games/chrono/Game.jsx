import { useEffect,useRef,useState } from 'react';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClockDisplay, { Buzzer } from './ClockDisplay';
import TurnNotice from '@/components/TurnNotice';
export default function ChronoGame({session,disabled,onAction,onReset,onLeave}) {
 const {room,playerId}=session;const g=room.game;const mine=g.activeId===playerId;const done=g.phase==='finished';
 const start=useRef(null);const [elapsed,setElapsed]=useState(0);const [sending,setSending]=useState(false);
 useEffect(()=>{start.current=null;setElapsed(0);},[g.round,g.activeId]);
 useEffect(()=>{const timer=setInterval(()=>{if(start.current!==null)setElapsed(performance.now()-start.current);},20);return()=>clearInterval(timer);},[]);
 useEffect(()=>{if(room.paused)start.current=null;},[room.paused]);
 const name=id=>room.players.find(p=>p.id===id)?.nickname??'Joueur';
 const latest=g.results.at(-1);
 const showingResult=Boolean(latest)&&g.phase!=='running';
 const seconds=ms=>`${(ms/1000).toFixed(3)} s`;
 const difference=r=>r.elapsedMs===null?'Pénalité +30 s':r.errorMs===0?'Parfait !':`${r.elapsedMs<r.targetMs?'−':'+'}${seconds(r.errorMs)}`;
 const rounds=[...new Set(g.results.map(r=>r.round))].reverse();
 async function command(action,payload={}){return onAction(action,{...payload,round:g.round,gameSessionId:room.gameSessionId});}
 async function buzz(){
   if(sending||disabled||room.paused||!mine)return;
   const measured=start.current===null?null:Math.round(performance.now()-start.current);
   setSending(true);
   try{if(g.phase==='ready'){if(await command('begin')){start.current=performance.now();setElapsed(0);}}
   else if(measured!==null){start.current=null;setElapsed(measured);await command('stop',{elapsedMs:Math.min(30000,measured)});}}
   finally{setSending(false);}
 }
 return <section className="py-6"><h1 className="text-3xl font-black">Défi Chrono</h1><p className="mt-2 text-muted-foreground">Manche {g.round}/{room.settings.rounds} · {room.settings.hidden?'Chrono caché':'Chrono visible'}</p>
 {!done&&<TurnNotice active={mine} paused={room.paused} title={room.paused?'En pause':mine?'À toi de buzzer !':`Au tour de ${name(g.activeId)}`} description={room.paused?'Une coupure interrompt la mesure locale. Au retour, passe ton essai si nécessaire.':'Démarre, puis arrête au plus près de la cible.'} />}
 <div className="my-6 rounded-3xl border bg-card px-4 py-6 text-center sm:p-8">
 <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{showingResult?`Cible · Manche ${latest.round}`:'Temps à atteindre'}</p><p className="mt-1 mb-6 text-3xl font-black tabular-nums">{seconds(showingResult?latest.targetMs:g.targetMs)}</p>
 <div key={showingResult?`result-${latest.round}-${latest.playerId}`:'live'} className={showingResult&&latest.elapsedMs!==null?'animate-pulse [animation-duration:600ms] [animation-iteration-count:3] motion-reduce:animate-none':''}>
 <ClockDisplay milliseconds={showingResult?(latest.elapsedMs??0):(mine?elapsed:0)} hidden={showingResult?latest.elapsedMs===null:g.phase==='running'&&(!mine||room.settings.hidden)} perfect={showingResult&&latest.errorMs===0} label={showingResult?`Temps de ${name(latest.playerId)}`:'Chronomètre'} />
 </div>
 <div className="mt-4 min-h-12" role="status" aria-live="polite" aria-atomic="true">
 {showingResult?<><p className="break-words font-semibold">{name(latest.playerId)} · {latest.elapsedMs===null?'Essai passé ou expiré':'Chrono arrêté'}</p><p className={`mt-1 text-sm ${latest.errorMs===0?'font-bold text-emerald-300':'text-muted-foreground'}`}>{latest.errorMs===0?'Parfait !':`Différence : ${difference(latest)}`}</p></>:<p className="text-sm text-muted-foreground">{!mine?`Au tour de ${name(g.activeId)}`:g.phase==='running'?'Buzze quand tu penses avoir atteint la cible.':'Appuie sur le buzzer pour démarrer.'}</p>}
 </div>
 {!done&&<>
 {showingResult&&<p className="mt-3 text-sm text-muted-foreground">{mine?'À toi de démarrer':`En attente de ${name(g.activeId)}`} · Prochaine cible : {seconds(g.targetMs)}</p>}
 <Buzzer disabled={disabled||room.paused||!mine||sending||(g.phase==='running'&&start.current===null)} running={g.phase==='running'} onClick={buzz} />
 {mine&&<Button variant="ghost" className="mt-4" disabled={disabled||room.paused||sending} onClick={()=>command('forfeit')}>Passer cet essai (+30 s)</Button>}
 <p className="mt-4 text-xs text-muted-foreground">30 secondes maximum par essai. Un essai passé ou expiré ajoute 30 secondes d’écart.</p>
 </>}
 </div>
 {done&&<div className="my-6 rounded-3xl bg-primary/15 p-6"><Trophy className="mb-3 size-10 text-primary" /><h2 className="text-2xl font-bold">Gagnant(s) : {room.players.filter(p=>g.scores[p.id]===Math.min(...Object.values(g.scores))).map(p=>p.nickname).join(', ')}</h2></div>}
 <h2 className="mt-8 mb-2 text-xl font-bold">{done?'Classement final':'Tableau des joueurs'}</h2>
 <p className="mb-4 text-sm text-muted-foreground">Le plus petit écart total gagne. Les différences s’additionnent en valeur absolue.</p>
 <ol className="space-y-3">{[...room.players].sort((a,b)=>g.scores[a.id]-g.scores[b.id]).map(p=>{
 const attempts=g.results.filter(r=>r.playerId===p.id);const last=attempts.at(-1);
 return <li key={p.id} className={`rounded-2xl border bg-card p-4 sm:p-5 ${p.id===playerId?'border-primary/40':''}`}>
 <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><span className="min-w-0 break-words font-bold">{p.nickname}{p.id===playerId&&<span className="ml-2 text-xs font-normal text-primary">Toi</span>}</span><span className="text-xs text-muted-foreground">{attempts.length}/{room.settings.rounds} essais joués</span></div>
 <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
 <div><p className="text-xs text-muted-foreground">Dernier chrono{last?` · M${last.round}`:''}</p><p className={`mt-1 text-xl font-black tabular-nums ${last?.errorMs===0?'text-emerald-300':'text-primary'}`}>{!last?'À venir':last.elapsedMs===null?'Non réalisé':seconds(last.elapsedMs)}</p>{last&&<p className="mt-1 text-xs text-muted-foreground">Cible {seconds(last.targetMs)}</p>}</div>
 <div><p className="text-xs text-muted-foreground">Différence</p><p className={`mt-1 text-lg font-semibold tabular-nums ${last?.errorMs===0?'text-emerald-300':''}`}>{last?difference(last):'—'}</p></div>
 <div className="col-span-2 rounded-xl bg-background/50 p-3 sm:col-span-1"><p className="text-xs text-muted-foreground">Écart total · classement</p><p className="mt-1 text-xl font-bold tabular-nums">{last?seconds(g.scores[p.id]):'—'}</p></div>
 </div></li>;
 })}</ol>
 <div className="my-6"><h2 className="text-xl font-bold">Les chronos par manche</h2><p className="mt-2 mb-4 text-sm text-muted-foreground">− : arrêté trop tôt · + : arrêté trop tard.</p>
 {rounds.length===0?<p className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">Les temps apparaîtront après le premier essai.</p>:rounds.map(round=>{
 const results=g.results.filter(r=>r.round===round);
 return <details key={round} open className="mb-3 rounded-2xl border bg-card p-4"><summary className="cursor-pointer font-semibold">Manche {round}<span className="ml-3 text-sm font-normal text-muted-foreground">Cible {seconds(results[0].targetMs)}</span></summary>
 <ul className="mt-3 divide-y divide-border">{results.map(r=><li key={r.playerId} className="grid grid-cols-2 items-center gap-3 py-3 sm:grid-cols-3"><p className="col-span-2 break-words font-medium sm:col-span-1">{name(r.playerId)}</p><div><p className="text-xs text-muted-foreground">Temps réalisé</p><p className={`mt-1 text-xl font-bold tabular-nums ${r.errorMs===0?'text-emerald-300':'text-primary'}`}>{r.elapsedMs===null?'Non réalisé':seconds(r.elapsedMs)}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Différence</p><p className={`mt-1 font-semibold tabular-nums ${r.errorMs===0?'text-emerald-300':''}`}>{difference(r)}</p></div></li>)}</ul></details>;
 })}</div>
 <div className="flex gap-3">{room.hostId===playerId&&<Button disabled={disabled} onClick={onReset}>{done?'Rejouer':'Retour au lobby'}</Button>}<Button variant="ghost" disabled={disabled} onClick={onLeave}>Quitter</Button></div></section>;
}

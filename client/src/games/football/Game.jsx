import TurnNotice from '@/components/TurnNotice';
import { useState } from 'react';
import { UserRound, Gavel, Wallet, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
const positions=[['ATT','left-[28%] top-[18%]'],['Joker','left-[72%] top-[18%]'],['MC','left-1/2 top-[43%]'],['DC','left-1/2 top-[65%]'],['GB','left-1/2 top-[86%]']];
function Pitch({player,team}) {
  return <section className="min-w-0 rounded-3xl border border-border bg-card p-4">
    <header className="mb-4 flex flex-wrap justify-between gap-2"><h2 className="font-bold">{player.nickname}</h2><span className="flex items-center gap-2 text-emerald-300"><Wallet className="size-4" />{team.budget} € restants</span></header>
    <div className="relative h-[480px] overflow-hidden rounded-2xl border border-emerald-200/30 bg-gradient-to-b from-emerald-900 to-emerald-950">
      <div aria-hidden="true" className="pointer-events-none absolute inset-3 border border-white/25"><div className="absolute top-1/2 w-full border-t border-white/25" /><div className="absolute top-1/2 left-1/2 size-24 -translate-1/2 rounded-full border border-white/25" /><div className="absolute bottom-0 left-1/2 h-20 w-40 -translate-x-1/2 border border-white/25" /><div className="absolute top-0 left-1/2 h-20 w-40 -translate-x-1/2 border border-white/25" /></div>
      {positions.map(([slot,position])=>{const card=team.slots[slot];return <div key={slot} className={`absolute ${position} flex w-[42%] max-w-40 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-xl border p-2 text-center shadow-lg ${card?'border-primary/50 bg-background/95':'border-white/20 bg-black/20'}`}>
        <span className="text-[10px] font-bold tracking-widest text-emerald-200">{slot}</span><UserRound aria-hidden="true" className="my-1 size-5 text-primary" /><span className="text-xs font-semibold [overflow-wrap:anywhere]">{card?.name ?? 'À recruter'}</span>{card&&<span className="mt-1 text-[10px] text-muted-foreground">{card.position} · {card.price} €</span>}
      </div>})}
    </div>
  </section>;
}
function Bidding({room,playerId,disabled,onAction}) {
  const g=room.game;const [amount,setAmount]=useState('');const mine=g.activeId===playerId;
  const bid = Number(amount);
  const valid = amount !== '' && Number.isSafeInteger(bid) && bid > g.price && bid <= g.limits[playerId];
  const ordered = [...room.players].sort((a,b) => Number(b.id === playerId) - Number(a.id === playerId));
  return <section className="rounded-3xl border border-primary/30 bg-card p-4 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-primary"><Gavel className="size-5" />Enchère {g.auction}</p></div>
    <TurnNotice active={mine} paused={room.paused}
      title={room.paused ? 'Partie en pause' : mine ? 'À toi de jouer !' : `Au tour de ${room.players.find(p=>p.id===g.activeId)?.nickname}`}
      description={room.paused ? 'Un joueur se reconnecte. Les enchères reprendront à son retour.' : g.solo ? (mine ? 'Seule ton équipe a une place compatible. Recrute pour 1 € ou passe.' : 'Ton équipe n’a pas de place compatible. Ton adversaire choisit de recruter ou de passer.') : mine ? (g.leaderId ? 'Surenchéris ou abandonne pour laisser cette recrue à ton adversaire.' : 'Ouvre l’enchère : choisis ton montant, puis appuie sur Ouvrir.') : 'Ton adversaire choisit sa mise. Tu pourras jouer juste après.'} />
    <div className="my-5 text-center"><UserRound aria-hidden="true" className="mx-auto mb-3 size-12 text-primary" /><p className="text-sm text-muted-foreground">{g.current.position}</p><h2 className="text-3xl font-black">{g.current.name}</h2><p className="mt-3 text-xl text-primary">{g.price ? `${g.price} € · ${room.players.find(p=>p.id===g.leaderId)?.nickname}`:'Mise de départ : 1 €'}</p></div>
    <div className="mb-4 grid grid-cols-2 gap-2">{ordered.map(player => <div key={player.id} className={`min-w-0 rounded-xl border p-3 ${player.id === playerId ? 'border-primary/40 bg-primary/10' : 'border-border bg-background/50'}`}>
      <p className="truncate text-xs text-muted-foreground">{player.id === playerId ? 'Ton budget' : player.nickname}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{g.teams[player.id].budget} <span className="text-sm">€</span></p>
      <progress aria-label={`Budget restant de ${player.nickname}`} className="mt-2 h-2 w-full accent-primary" max={room.settings.budget} value={g.teams[player.id].budget} />
    </div>)}</div>
    {g.solo ? <div className="grid grid-cols-2 gap-3"><Button className="h-12" disabled={disabled||!mine} onClick={()=>onAction('recruit',{auction:g.auction})}>Recruter · 1 €</Button><Button className="h-12" variant="secondary" disabled={disabled||!mine} onClick={()=>onAction('pass',{auction:g.auction})}>Passer</Button></div> : <form className="mx-auto grid max-w-lg grid-cols-2 gap-3" onSubmit={e=>{e.preventDefault();if (!disabled && mine && valid) onAction('bid',{auction:g.auction,amount:bid});}}>
      <label className="sr-only" htmlFor="bid">Montant de l’enchère</label><Input id="bid" className="col-span-2 h-12 text-lg tabular-nums" type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" placeholder={`Minimum ${g.price+1} €`} value={amount} onChange={e=>{const raw=e.target.value;if (/^\d*$/.test(raw)) setAmount(raw.replace(/^0+/, ''));}} disabled={disabled||!mine} />
      <div className="col-span-2 grid grid-cols-4 gap-2">{[['¼',0.25],['½',0.5],['¾',0.75],['Max',1]].map(([label,fraction])=>{const value=Math.floor(g.limits[playerId]*fraction);return <Button key={label} type="button" variant="secondary" className="min-h-11 px-2" title={`${value} €`} aria-label={`${label} : remplir avec ${value} euros`} disabled={disabled||!mine||value<=g.price} onClick={()=>setAmount(String(value))}>{label}</Button>})}</div>
      <Button className="h-12" disabled={disabled||!mine||!valid}>{g.price?'Surenchérir':'Ouvrir'}</Button>
      <Button className="h-12" type="button" variant="secondary" disabled={disabled||!mine||!g.leaderId} onClick={()=>onAction('pass',{auction:g.auction})}>Abandonner</Button>
    </form>}<p className="mt-3 text-center text-xs text-muted-foreground">Mise maximale : {g.limits[playerId]} €. 1 € réservé par poste restant après l’achat. Les raccourcis remplissent le montant : confirme ensuite ta mise.</p>
  </section>;
}
export default function FootballGame({session,disabled,onAction,onReset,onLeave}) {
  const {room,playerId}=session;const g=room.game;const finished=g.phase==='finished';
  const [showOpponent,setShowOpponent]=useState(false);
  const ordered=[...room.players].sort((a,b)=>Number(b.id===playerId)-Number(a.id===playerId));
  const visible=ordered[showOpponent?1:0];
  return <div className="py-6"><h1 className="text-3xl font-black">{finished?'Deux équipes. À vous de comparer !':'Le mercato est ouvert.'}</h1><p className="mt-2 text-muted-foreground">{room.settings.budget} € de départ · GB, DC, MC, ATT et Joker · Ouverture alternée A / B</p>
    {finished ? <div className="my-6 grid gap-5 lg:grid-cols-2">{ordered.map(player=><Pitch key={player.id} player={player} team={g.teams[player.id]} />)}</div> : <div className="my-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="hidden lg:block"><Pitch player={ordered[0]} team={g.teams[ordered[0].id]} /></div>
      <Bidding key={`${g.auction}-${g.price}`} room={room} playerId={playerId} disabled={disabled||room.paused} onAction={(action,payload)=>onAction(action,{...payload,gameSessionId:room.gameSessionId})} />
      <div className="hidden lg:block"><Pitch player={ordered[1]} team={g.teams[ordered[1].id]} /></div>
      <div className="lg:hidden">
        <div className="mb-3 flex items-center gap-3"><Button type="button" variant="secondary" className="size-12 shrink-0" onClick={()=>setShowOpponent(value=>!value)} aria-label={showOpponent?'Afficher mon équipe':'Afficher l’équipe adverse'} aria-controls="mobile-pitch"><ArrowLeftRight className="size-5" /></Button><p className="font-semibold" role="status">{showOpponent?`Équipe de ${visible.nickname}`:'Mon équipe'}</p></div>
        <div id="mobile-pitch"><Pitch player={visible} team={g.teams[visible.id]} /></div>
      </div>
    </div>}
    <details className="my-5 rounded-2xl border border-border bg-card p-4"><summary className="cursor-pointer">Historique des recrutements ({g.history.length})</summary><ul className="mt-3 space-y-2 text-sm">{g.history.map(item=><li key={item.auction}>{item.player.name} → {room.players.find(p=>p.id===item.buyerId)?.nickname} · {item.price} € · {item.slot}</li>)}</ul></details>
    <p className="my-4 text-xs text-muted-foreground">Le poste naturel est rempli en priorité, puis le Joker. Tant que les deux équipes sont incomplètes, chaque recrutement est confirmé. Dès qu’une équipe est complète, l’autre est complétée automatiquement à 1 € par recrue. Une coupure réserve la place 60 secondes.</p>
    <div className="flex flex-wrap gap-3">{room.hostId===playerId&&<Button disabled={disabled} onClick={onReset}>{finished?'Rejouer':'Retour au lobby'}</Button>}<Button variant="ghost" disabled={disabled} onClick={onLeave}>Quitter</Button></div>
  </div>;
}

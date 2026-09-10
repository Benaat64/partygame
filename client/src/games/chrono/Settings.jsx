import { Button } from '@/components/ui/button';
export function ChronoOptions({value,onChange,disabled}) {
 return <fieldset disabled={disabled} className="my-4 grid gap-4 rounded-xl border border-border p-4"><legend>Défi Chrono</legend>
 <label className="grid gap-2">Manches<select className="h-12 rounded-xl bg-background p-3" value={value.rounds} onChange={e=>onChange({...value,rounds:Number(e.target.value)})}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label>
 <label className="flex min-h-11 items-center gap-2"><input type="checkbox" className="size-5 accent-primary" checked={value.hidden} onChange={e=>onChange({...value,hidden:e.target.checked})} />Difficile : cacher le chrono</label></fieldset>;
}
export default function Settings({room,isHost,disabled,onSettings,onStart}) {
 return <><ChronoOptions value={room.settings} onChange={onSettings} disabled={disabled||!isHost} /><p className="my-4 text-sm text-muted-foreground">Même cible pour tous, tirée entre 3 et 10 secondes. L’écart total le plus faible gagne.</p>{isHost?<Button className="h-12 w-full" disabled={disabled||room.players.length<2} onClick={onStart}>Lancer le défi</Button>:<p>En attente de l’hôte…</p>}</>;
}

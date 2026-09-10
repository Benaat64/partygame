import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Timing from './Timing.jsx';
const categoryLabels = { animals: 'Animaux', food: 'Nourriture' };
const difficultyLabels = { easy: 'Facile', medium: 'Moyenne', hard: 'Difficile' };
export default function Settings({ room, isHost, disabled, onSettings, onStart }) {
  const { settings, gameOptions, players } = room;
  const canStart = players.length >= 3 && players.length - settings.undercoverCount > settings.undercoverCount;
  const update = patch => onSettings({ ...settings, ...patch });
  return (
    <div>
      <fieldset className="min-w-0 space-y-4 disabled:opacity-65" disabled={disabled || !isHost}>
        <legend className="sr-only">Composition et mots</legend>
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-2 text-sm font-medium"><span>Undercover</span><Input className="mt-2 h-12 rounded-xl bg-background/50" type="number" min="1" max="50" value={settings.undercoverCount} onChange={e => update({ undercoverCount: Number(e.target.value) })} /></label>
          <label className="space-y-2 text-sm font-medium"><span>Difficulté</span><select className="mt-2 h-12 w-full rounded-xl border border-input bg-background p-3 focus-visible:outline-2 focus-visible:outline-ring" value={settings.difficulty} onChange={e => update({ difficulty: e.target.value })}>{gameOptions.difficulties.map(value => <option key={value} value={value}>{difficultyLabels[value]}</option>)}</select></label>
        </div>
        <div><p className="mb-2 text-sm font-medium">Catégories</p><div className="flex flex-wrap gap-2">{gameOptions.categories.map(category => <label key={category} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm ${settings.categories.includes(category) ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}><input className="size-4 accent-primary" type="checkbox" checked={settings.categories.includes(category)} onChange={e => update({ categories: e.target.checked ? [...settings.categories, category] : settings.categories.filter(value => value !== category) })} />{categoryLabels[category] ?? category}</label>)}</div></div>
      </fieldset>
      <Timing value={settings} onChange={onSettings} disabled={disabled || !isHost} />
      <p className="my-4 text-xs leading-relaxed text-muted-foreground">Les Civils doivent être plus nombreux que les Undercover. {players.length < 3 && `Encore ${3 - players.length} joueur(s) pour commencer.`}</p>
      {isHost ? <Button className="h-13 w-full rounded-xl text-base font-bold" disabled={disabled || !canStart} onClick={onStart}><Play className="size-4" />Lancer Undercover</Button> : <p className="rounded-xl bg-muted p-3 text-center text-sm text-muted-foreground">En attente du lancement par l’hôte…</p>}
    </div>
  );
}

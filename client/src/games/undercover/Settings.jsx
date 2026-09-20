import { useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Timing from './Timing.jsx';
const categoryLabels = {
  animals: 'Animaux',
  food: 'Nourriture',
  anime: 'Anime',
  'pop-culture': 'Comics & Jeux vidéo',
};

export default function Settings({
  room,
  isHost,
  disabled,
  onSettings,
  onStart,
}) {
  const [search, setSearch] = useState('');
  const { settings, gameOptions, players } = room;
  const canStart =
    gameOptions.pairCount > 0 &&
    players.length >= 3 &&
    players.length - settings.undercoverCount > settings.undercoverCount;
  const update = (patch) => onSettings({ ...settings, ...patch });
  return (
    <div>
      <fieldset
        className="min-w-0 space-y-4 disabled:opacity-65"
        disabled={disabled || !isHost}
      >
        <legend className="sr-only">Composition et mots</legend>
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-2 text-sm font-medium">
            <span>Undercover</span>
            <Input
              className="mt-2 h-12 rounded-xl bg-background/50"
              type="number"
              min="1"
              max="50"
              value={settings.undercoverCount}
              onChange={(e) =>
                update({ undercoverCount: Number(e.target.value) })
              }
            />
          </label>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Catégories</p>
          <div className="flex flex-wrap gap-2">
            {gameOptions.categories.map((category) => (
              <label
                key={category}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm ${settings.categories.includes(category) ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
              >
                <input
                  className="size-4 accent-primary"
                  type="checkbox"
                  checked={settings.categories.includes(category)}
                  onChange={(e) =>
                    update({
                      categories: e.target.checked
                        ? [...settings.categories, category]
                        : settings.categories.filter(
                            (value) => value !== category,
                          ),
                    })
                  }
                />
                {categoryLabels[category] ?? category}
              </label>
            ))}
          </div>
        </div>
        {(settings.categories.includes('anime') ||
          settings.categories.includes('pop-culture')) && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Univers connus des joueurs</p>
            <Input
              aria-label="Rechercher un univers"
              placeholder="Rechercher un univers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => update({ universes: gameOptions.universes })}
              >
                Tout sélectionner
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => update({ universes: [] })}
              >
                Tout retirer
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {gameOptions.universes
                .filter((u) =>
                  u.includes(search.toLowerCase().replaceAll(' ', '-')),
                )
                .map((u) => (
                  <label
                    key={u}
                    className="flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={settings.universes.includes(u)}
                      onChange={(e) =>
                        update({
                          universes: e.target.checked
                            ? [...settings.universes, u]
                            : settings.universes.filter((v) => v !== u),
                        })
                      }
                    />
                    <span className="capitalize">{u.replaceAll('-', ' ')}</span>
                  </label>
                ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.crossovers}
                onChange={(e) => update({ crossovers: e.target.checked })}
              />
              Autoriser les crossovers entre univers sélectionnés
            </label>
            <p className="text-xs text-muted-foreground">
              Les objets et métiers courants restent possibles avec Anime seul.
              Toutes les références spécialisées d’une paire doivent être
              autorisées.
            </p>
          </div>
        )}
        <p role="status" className="text-sm font-semibold text-primary">
          {gameOptions.pairCount} paires disponibles
        </p>
      </fieldset>
      <Timing
        value={settings}
        onChange={onSettings}
        disabled={disabled || !isHost}
      />
      <p className="my-4 text-xs leading-relaxed text-muted-foreground">
        Les Civils doivent être plus nombreux que les Undercover.{' '}
        {players.length < 3 &&
          `Encore ${3 - players.length} joueur(s) pour commencer.`}
      </p>
      {isHost ? (
        <Button
          className="h-13 w-full rounded-xl text-base font-bold"
          disabled={disabled || !canStart}
          onClick={onStart}
        >
          <Play className="size-4" />
          Lancer Undercover
        </Button>
      ) : (
        <p className="rounded-xl bg-muted p-3 text-center text-sm text-muted-foreground">
          En attente du lancement par l’hôte…
        </p>
      )}
    </div>
  );
}

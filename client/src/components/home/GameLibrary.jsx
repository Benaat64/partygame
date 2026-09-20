import { GameArt } from '../Brand';
import { Button } from '@/components/ui/button';
import { KeyRound } from 'lucide-react';
export default function GameLibrary({
  heading,
  disabled,
  modes,
  onJoin,
  onSelect,
}) {
  return (
    <div className="sofa-home">
      <section>
        <p className="eyebrow mb-4 text-muted-foreground">
          Le salon est ouvert.
        </p>
        <h1 ref={heading} tabIndex={-1} className="home-title">
          Sit. Play.
          <br />
          <em>Laugh.</em>
        </h1>
        <p className="mt-5 max-w-lg text-lg text-muted-foreground">
          Tes amis. Un canapé. Et de très mauvaises excuses pour perdre.
        </p>
        <Button
          variant="secondary"
          className="mt-6"
          disabled={disabled}
          onClick={onJoin}
        >
          <KeyRound className="size-4" />
          Rejoindre avec un code
        </Button>
      </section>
      <section aria-label="Choix du jeu">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="eyebrow">Choisis votre prochain défi</h2>
          <span className="text-xs text-muted-foreground">
            Sans inscription. Un pseudo suffit.
          </span>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {modes.map((mode, index) => (
            <button
              key={mode.id}
              type="button"
              disabled={disabled}
              data-game={mode.id}
              onClick={() => onSelect(mode.id)}
              className="game-choice"
            >
              <div>
                <span className="eyebrow">0{index + 1} / À vous de jouer</span>
                <h3>{mode.name}</h3>
                <p>{mode.description}</p>
              </div>
              <GameArt game={mode.id} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

import { Button } from '@/components/ui/button';
import { ArrowRight, SlidersHorizontal } from 'lucide-react';
import { ChronoOptions } from '../../games/chrono/Settings';
import Timing from '../../games/undercover/Timing';
export default function CreateRoomForm({
  nickname,
  gameId,
  timing,
  setTiming,
  chronoSettings,
  setChronoSettings,
  disabled,
  onCreate,
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCreate({
          nickname,
          gameId,
          timing:
            gameId === 'football'
              ? { budget: 250 }
              : gameId === 'chrono'
                ? chronoSettings
                : timing,
        });
      }}
    >
      {gameId === 'undercover' && (
        <>
          <details className="mb-5 rounded-xl border border-border bg-background/30 p-4">
            <summary className="cursor-pointer text-sm font-medium marker:text-primary">
              <span className="ml-1 inline-flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-primary" />
                Personnaliser la partie
              </span>
            </summary>
            <Timing value={timing} onChange={setTiming} disabled={disabled} />
          </details>
          <p className="mb-5 text-sm text-muted-foreground">
            {timing.matchCount} manches · {timing.maxTurns} tours max. ·{' '}
            {timing.phaseSeconds === null
              ? 'Temps illimité'
              : `${timing.phaseSeconds} s par indice`}
          </p>
        </>
      )}
      {gameId === 'chrono' && (
        <ChronoOptions
          value={chronoSettings}
          onChange={setChronoSettings}
          disabled={disabled}
        />
      )}
      {gameId === 'football' && (
        <p className="mb-5 text-sm text-muted-foreground">
          250 € chacun · 6 recrues · 5 sur le terrain + 1 sur la touche,
          placement libre
        </p>
      )}
      <Button
        className="h-12 w-full rounded-xl text-base font-bold"
        disabled={disabled || nickname.trim().length < 2}
      >
        On s’installe
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </form>
  );
}

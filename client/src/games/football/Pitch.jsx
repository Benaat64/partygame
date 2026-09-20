import TeamPlacement from './TeamPlacement';
import PlayerPhoto from './PlayerPhoto';
import { Wallet } from 'lucide-react';
const positions = [
  ['ATT', 'left-[28%] top-[18%]'],
  ['Joker', 'left-[72%] top-[18%]'],
  ['MC', 'left-1/2 top-[43%]'],
  ['DC', 'left-1/2 top-[65%]'],
  ['GB', 'left-1/2 top-[86%]'],
];
export default function Pitch({
  player,
  team,
  editable = false,
  disabled,
  onPlace,
}) {
  return (
    <section className="pitch-panel min-w-0">
      <header className="mb-4 flex flex-wrap justify-between gap-2">
        <h2 className="font-bold">{player.nickname}</h2>
        <span className="flex items-center gap-2 text-emerald-300">
          <Wallet className="size-4" />
          {team.budget} € restants
        </span>
      </header>
      <div className="mb-2 flex justify-end rounded-t-2xl border border-white/10 bg-zinc-900/60 p-3">
        <div
          className="flex max-w-full items-center gap-3 rounded-xl border border-primary/30 bg-background/80 px-3 py-2"
          aria-label="Entraîneur sur la ligne de touche"
        >
          <PlayerPhoto
            key={team.slots.Coach?.id ?? 'empty-coach'}
            player={team.slots.Coach ?? { position: 'Coach' }}
            className="h-14 w-12"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Coach · Ligne de touche
            </p>
            <p className="break-words text-xs font-semibold">
              {team.slots.Coach?.name ?? 'À recruter'}
            </p>
            {team.slots.Coach && (
              <p className="text-[10px] text-muted-foreground">
                {team.slots.Coach.price} €
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="relative h-[480px] overflow-hidden rounded-2xl border border-emerald-200/30 bg-[repeating-linear-gradient(0deg,#174d3b_0_60px,#1c5742_60px_120px)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-3 border border-white/25"
        >
          <div className="absolute top-1/2 w-full border-t border-white/25" />
          <div className="absolute top-1/2 left-1/2 size-24 -translate-1/2 rounded-full border border-white/25" />
          <div className="absolute bottom-0 left-1/2 h-20 w-40 -translate-x-1/2 border border-white/25" />
          <div className="absolute top-0 left-1/2 h-20 w-40 -translate-x-1/2 border border-white/25" />
        </div>
        {positions.map(([slot, position]) => {
          const card = team.slots[slot];
          return (
            <div
              key={slot}
              className={`absolute ${position} flex w-[42%] max-w-40 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-xl border p-2 text-center ${card ? 'border-primary/50 bg-background/95' : 'border-white/20 bg-black/20'}`}
            >
              <span className="text-[10px] font-bold tracking-widest text-emerald-200">
                {slot}
              </span>
              <PlayerPhoto
                key={card?.id ?? slot}
                player={card}
                className="my-1 h-10 w-12"
              />
              <span className="text-xs font-semibold [overflow-wrap:anywhere]">
                {card?.name ?? 'À recruter'}
              </span>
              {card && (
                <span className="mt-1 text-[10px] text-muted-foreground">
                  {card.position} · {card.price} €
                </span>
              )}
            </div>
          );
        })}
      </div>
      {editable && (
        <TeamPlacement team={team} disabled={disabled} onPlace={onPlace} />
      )}
    </section>
  );
}

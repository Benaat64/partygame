import { Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';
const button = 'min-h-12 rounded-xl px-4 py-3 font-semibold';
export default function VotePanel({
  game,
  players,
  playerId,
  disabled,
  alive,
  voted,
  onVote,
}) {
  return (
    <div className="my-5 rounded-3xl border border-primary/25 bg-card p-5">
      <h3 className="mb-3 flex items-center gap-2 font-bold">
        <Vote className="size-5 text-primary" />
        {voted ? 'Vote enregistré' : 'Qui est Undercover ?'} ·{' '}
        {game.voted.length}/{game.alive.length} votes
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {players
          .filter((player) => game.alive.includes(player.id))
          .map((player) => (
            <Button
              key={player.id}
              className={button}
              disabled={disabled || !alive || voted || player.id === playerId}
              onClick={() => onVote(player.id)}
            >
              {player.nickname}
              {player.id === playerId ? ' (vous)' : ''}
            </Button>
          ))}
      </div>
    </div>
  );
}

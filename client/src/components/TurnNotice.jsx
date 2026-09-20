import { CirclePause, CheckCircle2, Hourglass, Hand } from 'lucide-react';

export default function TurnNotice({
  active,
  paused,
  done,
  title,
  description,
}) {
  const Icon = paused
    ? CirclePause
    : done
      ? CheckCircle2
      : active
        ? Hand
        : Hourglass;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`my-4 flex items-start gap-3 rounded-2xl border-l-4 p-4 ${paused ? 'border-amber-300/40 bg-amber-300/10 text-amber-100' : active ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-background/50 text-muted-foreground'}`}
    >
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${active && !paused ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
      >
        <Icon aria-hidden="true" className="size-6" />
      </div>
      <div className="min-w-0">
        <p
          className={`text-xl font-extrabold [overflow-wrap:anywhere] ${active && !paused ? 'text-primary' : ''}`}
        >
          {title}
        </p>
        <p className="mt-1 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, KeyRound } from 'lucide-react';
export default function JoinRoomForm({
  nickname,
  code,
  setCode,
  disabled,
  onJoin,
}) {
  return (
    <>
      {' '}
      <p className="mb-4 text-sm text-muted-foreground">
        Le code de tes amis suffit pour retrouver leur partie.
      </p>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          onJoin({ nickname, code });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="code">
            <KeyRound className="size-4 text-primary" />
            Code de la room
          </Label>
          <Input
            id="code"
            className="h-14 rounded-xl bg-background/50 text-center text-xl tracking-[0.3em] uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC234"
            maxLength={6}
            required
            autoCapitalize="characters"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <Button
          className="h-12 w-full rounded-xl text-base font-bold"
          disabled={
            disabled || nickname.trim().length < 2 || code.trim().length !== 6
          }
        >
          Rejoindre mes amis
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </form>
    </>
  );
}

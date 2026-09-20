import GameLibrary from './home/GameLibrary';
import CreateRoomForm from './home/CreateRoomForm';
import JoinRoomForm from './home/JoinRoomForm';
import { Timer, Trophy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Home({
  screen,
  setScreen,
  disabled,
  onCreate,
  onJoin,
}) {
  const [tab, setTab] = useState('create');
  const heading = useRef(null);
  const previousScreen = useRef(screen);
  useEffect(() => {
    if (previousScreen.current !== screen) {
      heading.current?.focus();
      window.scrollTo({ top: 0, behavior: 'instant' });
      previousScreen.current = screen;
    }
  }, [screen]);
  const [gameId, setGameId] = useState('undercover');
  const [chronoSettings, setChronoSettings] = useState({
    rounds: 3,
    hidden: false,
  });
  const modes = [
    {
      id: 'undercover',
      name: 'Undercover',
      description: 'Dès 3 joueurs · Indices & bluff',
      icon: Gamepad2,
    },
    {
      id: 'football',
      name: 'Mercato',
      description: '1 contre 1 · Enchères de foot',
      icon: Trophy,
    },
    {
      id: 'chrono',
      name: 'Défi Chrono',
      description: 'Dès 2 joueurs · Précision & buzzer',
      icon: Timer,
    },
  ];
  const selected = modes.find((mode) => mode.id === gameId);
  const [nickname, setNickname] = useState('');
  const [timing, setTiming] = useState({
    phaseSeconds: 30,
    matchCount: 3,
    maxTurns: 3,
  });
  const [code, setCode] = useState('');
  if (screen === 'library')
    return (
      <GameLibrary
        heading={heading}
        disabled={disabled}
        modes={modes}
        onJoin={() => {
          setTab('join');
          setScreen('join');
        }}
        onSelect={(id) => {
          setGameId(id);
          setTab('create');
          setScreen('game');
        }}
      />
    );
  return (
    <div
      className="game-stage mx-auto max-w-xl py-6 sm:py-10"
      style={{
        '--sofa-accent':
          screen === 'join'
            ? '#e4f077'
            : gameId === 'football'
              ? '#99d6c4'
              : gameId === 'chrono'
                ? '#ffa38b'
                : '#e4f077',
      }}
    >
      <Button
        variant="ghost"
        className="mb-5"
        disabled={disabled}
        onClick={() => setScreen('library')}
      >
        <ArrowLeft className="size-4" />
        Retour aux jeux
      </Button>
      <h1 ref={heading} tabIndex={-1} className="mb-6 text-4xl font-black">
        {screen === 'join' ? 'Retrouve ta bande.' : selected.name}
      </h1>
      <Card id="room-options" className="join-panel !static">
        <CardHeader className="px-6 pt-7 sm:px-8">
          <CardTitle className="text-2xl">Prends ta place.</CardTitle>
          <CardDescription>
            {screen === 'join'
              ? 'Tous les jeux, un seul code.'
              : `${selected.description}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-7 sm:px-8">
          <Tabs value={tab} onValueChange={setTab}>
            {screen === 'game' && (
              <TabsList className="mb-6 grid h-12 w-full grid-cols-2 rounded-xl bg-background/70 p-1">
                <TabsTrigger className="h-full rounded-lg" value="create">
                  Créer une room
                </TabsTrigger>
                <TabsTrigger className="h-full rounded-lg" value="join">
                  Rejoindre
                </TabsTrigger>
              </TabsList>
            )}
            <div className="mb-5 space-y-2">
              <Label htmlFor="nickname">Ton pseudo</Label>
              <Input
                className="h-12 rounded-xl bg-background/50"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ex. Camille"
                maxLength={24}
                autoComplete="nickname"
              />
            </div>
            <TabsContent value="create">
              <CreateRoomForm
                nickname={nickname}
                gameId={gameId}
                timing={timing}
                setTiming={setTiming}
                chronoSettings={chronoSettings}
                setChronoSettings={setChronoSettings}
                disabled={disabled}
                onCreate={onCreate}
              />
            </TabsContent>
            <TabsContent value="join">
              <JoinRoomForm
                nickname={nickname}
                code={code}
                setCode={setCode}
                disabled={disabled}
                onJoin={onJoin}
              />
            </TabsContent>
          </Tabs>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Pas de compte. Juste un pseudo et tes amis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

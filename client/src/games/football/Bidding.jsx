import Budgets from './Budgets';
import { useState } from 'react';
import PlayerPhoto from './PlayerPhoto';
import TurnNotice from '@/components/TurnNotice';
import { Gavel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export default function Bidding({ room, playerId, disabled, onAction }) {
  const g = room.game;
  const [amount, setAmount] = useState('');
  const mine = g.activeId === playerId;
  const bid = Number(amount);
  const valid =
    amount !== '' &&
    Number.isSafeInteger(bid) &&
    bid > g.price &&
    bid <= g.limits[playerId];
  const ordered = [...room.players].sort(
    (a, b) => Number(b.id === playerId) - Number(a.id === playerId),
  );
  return (
    <section className="auction-stage">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-primary">
          <Gavel className="size-5" />
          Enchère {g.auction}
        </p>
      </div>
      <TurnNotice
        active={mine}
        paused={room.paused}
        title={
          room.paused
            ? 'Partie en pause'
            : mine
              ? 'À toi de jouer !'
              : `Au tour de ${room.players.find((p) => p.id === g.activeId)?.nickname}`
        }
        description={
          room.paused
            ? 'Un joueur se reconnecte. Les enchères reprendront à son retour.'
            : g.solo
              ? mine
                ? 'Seule ton équipe a une place compatible. Recrute pour 1 € ou passe.'
                : 'Ton équipe n’a pas de place compatible. Ton adversaire choisit de recruter ou de passer.'
              : mine
                ? g.leaderId
                  ? 'Surenchéris ou abandonne pour laisser cette recrue à ton adversaire.'
                  : 'Ouvre l’enchère : choisis ton montant, puis appuie sur Ouvrir.'
                : 'Ton adversaire choisit sa mise. Tu pourras jouer juste après.'
        }
      />
      <div className="my-5 text-center">
        <PlayerPhoto
          key={g.current.id}
          player={g.current}
          className="auction-portrait mx-auto mb-3 h-40 w-40 sm:h-48 sm:w-48"
        />
        <p className="text-sm text-muted-foreground">{g.current.position}</p>
        <h2 className="text-3xl font-black">{g.current.name}</h2>
        <p className="mt-3 text-xl text-primary">
          {g.price
            ? `${g.price} € · ${room.players.find((p) => p.id === g.leaderId)?.nickname}`
            : 'Mise de départ : 1 €'}
        </p>
      </div>
      <Budgets
        ordered={ordered}
        playerId={playerId}
        teams={g.teams}
        initialBudget={room.settings.budget}
      />
      {g.solo ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="h-12"
            disabled={disabled || !mine}
            onClick={() => onAction('recruit', { auction: g.auction })}
          >
            Recruter · 1 €
          </Button>
          <Button
            className="h-12"
            variant="secondary"
            disabled={disabled || !mine}
            onClick={() => onAction('pass', { auction: g.auction })}
          >
            Passer
          </Button>
        </div>
      ) : (
        <form
          className="mx-auto grid max-w-lg grid-cols-2 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!disabled && mine && valid)
              onAction('bid', { auction: g.auction, amount: bid });
          }}
        >
          <label className="sr-only" htmlFor="bid">
            Montant de l’enchère
          </label>
          <Input
            id="bid"
            className="col-span-2 h-12 text-lg tabular-nums"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            placeholder={`Minimum ${g.price + 1} €`}
            value={amount}
            onChange={(e) => {
              const raw = e.target.value;
              if (/^\d*$/.test(raw)) setAmount(raw.replace(/^0+/, ''));
            }}
            disabled={disabled || !mine}
          />
          <div className="col-span-2 grid grid-cols-4 gap-2">
            {[
              ['¼', 0.25],
              ['½', 0.5],
              ['¾', 0.75],
              ['Max', 1],
            ].map(([label, fraction]) => {
              const value = Math.floor(g.limits[playerId] * fraction);
              return (
                <Button
                  key={label}
                  type="button"
                  variant="secondary"
                  className="min-h-11 px-2"
                  title={`${value} €`}
                  aria-label={`${label} : remplir avec ${value} euros`}
                  disabled={disabled || !mine || value <= g.price}
                  onClick={() => setAmount(String(value))}
                >
                  {label}
                </Button>
              );
            })}
          </div>
          <Button className="h-12" disabled={disabled || !mine || !valid}>
            {g.price ? 'Surenchérir' : 'Ouvrir'}
          </Button>
          <Button
            className="h-12"
            type="button"
            variant="secondary"
            disabled={disabled || !mine || !g.leaderId}
            onClick={() => onAction('pass', { auction: g.auction })}
          >
            Abandonner
          </Button>
        </form>
      )}
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Mise maximale : {g.limits[playerId]} €. 1 € réservé par poste restant
        après l’achat. Les raccourcis remplissent le montant : confirme ensuite
        ta mise.
      </p>
    </section>
  );
}

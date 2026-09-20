import { MessageCircle } from 'lucide-react';
export default function ClueLog({ messages, players, playerId }) {
  const name = (id) => players.find((p) => p.id === id)?.nickname ?? 'Joueur';
  return (
    <>
      {' '}
      <h3 className="my-3 flex items-center gap-2 text-lg font-bold">
        <MessageCircle className="size-5 text-primary" />
        Les indices
      </h3>
      <ol
        role="log"
        aria-label="Indices des joueurs"
        aria-live="polite"
        className="max-h-96 space-y-3 overflow-y-auto border-y border-border py-5"
      >
        {!messages.length && (
          <li className="text-muted-foreground">
            Donnez un indice sans écrire votre mot secret.
          </li>
        )}
        {messages.map((message) => (
          <li
            key={`${message.turn}-${message.playerId}`}
            className={`secret-reveal rounded-2xl p-4 break-words ${message.playerId === playerId ? 'ml-5 bg-primary/15' : 'mr-5 bg-background/60'}`}
          >
            <span className="text-sm text-primary">
              Tour {message.turn} · {name(message.playerId)}
            </span>
            <p className="mt-1 [overflow-wrap:anywhere]">{message.text}</p>
          </li>
        ))}
      </ol>
    </>
  );
}

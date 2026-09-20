export function SofaMark() {
  return (
    <svg viewBox="0 0 48 38" fill="none" aria-hidden="true">
      <rect x="8" y="3" width="32" height="24" rx="9" fill="currentColor" />
      <path
        d="M4 16v9q0 6 6 6h28q6 0 6-6v-9M10 31v4m28-4v4"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M24 8v13M12 24h24"
        stroke="var(--color-background)"
        strokeWidth="2"
      />
    </svg>
  );
}
export function GameArt({ game }) {
  return (
    <div aria-hidden="true" className={`game-art art-${game}`}>
      {game === 'undercover' ? (
        <>
          <span className="secret-tile tile-back">?</span>
          <span className="secret-tile tile-front">
            <i />
            <i />
          </span>
        </>
      ) : game === 'football' ? (
        <>
          <span className="art-pitch" />
          <span className="art-ball">✳</span>
          <span className="art-price">250 €</span>
        </>
      ) : (
        <>
          <span className="art-time">05.00</span>
          <span className="art-buzz" />
        </>
      )}
    </div>
  );
}

const digits = [
  'abcdef',
  'bc',
  'abdeg',
  'abcdg',
  'bcfg',
  'acdfg',
  'acdefg',
  'abc',
  'abcdefg',
  'abcdfg',
];
const segments = {
  a: '8,2 32,2 37,7 32,12 8,12 3,7',
  b: '34,14 39,9 39,35 34,40 29,35 29,19',
  c: '34,44 39,49 39,75 34,80 29,75 29,49',
  d: '8,78 32,78 37,83 32,88 8,88 3,83',
  e: '6,44 11,49 11,75 6,80 1,75 1,49',
  f: '6,10 11,15 11,35 6,40 1,35 1,15',
  g: '8,40 32,40 37,45 32,50 8,50 3,45',
};

export default function ClockDisplay({
  milliseconds = 0,
  hidden = false,
  perfect = false,
  label = 'Chronomètre',
}) {
  // Minutes, seconds, milliseconds: keep the precision used by the ranking.
  const ms = Math.max(0, Math.min(5999999, Math.floor(milliseconds)));
  const value = `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
  let x = 0;
  return (
    <div
      role="img"
      aria-label={`${label} : ${hidden ? 'masqué' : `${(ms / 1000).toFixed(3)} secondes`}`}
      className="mx-auto w-full max-w-xl rounded-xl border-4 border-zinc-700 bg-gradient-to-b from-zinc-800 to-black p-3 shadow-[0_12px_25px_#0008,inset_0_1px_0_#ffffff30] sm:p-5"
    >
      <div
        className={`rounded border border-white/5 bg-[#100908] px-2 py-4 ${perfect ? 'text-emerald-400' : 'text-red-500'}`}
      >
        <svg viewBox="0 0 350 92" className="w-full" aria-hidden="true">
          {[...value].map((char, index) => {
            const offset = x;
            x += char === ':' || char === '.' ? 17 : 45;
            return (
              <g key={index} transform={`translate(${offset}, 0)`}>
                {char === ':' || char === '.' ? (
                  <g fill="currentColor">
                    <circle cx="7" cy="82" r="4" />
                    {char === ':' && <circle cx="7" cy="30" r="4" />}
                  </g>
                ) : (
                  Object.entries(segments).map(([segment, points]) => {
                    const active = hidden
                      ? segment === 'g'
                      : digits[Number(char)].includes(segment);
                    return (
                      <polygon
                        key={segment}
                        points={points}
                        fill="currentColor"
                        opacity={active ? 1 : 0.08}
                        className={
                          active ? 'drop-shadow-[0_0_3px_currentColor]' : ''
                        }
                      />
                    );
                  })
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex justify-between text-[9px] font-semibold uppercase tracking-widest text-zinc-400">
        <span>SOFA · Chrono</span>
        <span>Min : Sec . Ms</span>
      </div>
    </div>
  );
}

export function Buzzer({ disabled, running, onClick }) {
  return (
    <div className="buzzer-base">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-label={
          running ? 'Arrêter le chronomètre' : 'Démarrer le chronomètre'
        }
        className="sofa-buzzer"
      >
        <span className="sr-only">{running ? 'STOP' : 'START'}</span>
      </button>
    </div>
  );
}

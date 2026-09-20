export const seconds = (ms) => `${(ms / 1000).toFixed(3)} s`;
export const difference = (r) =>
  r.elapsedMs === null
    ? 'Pénalité +30 s'
    : r.errorMs === 0
      ? 'Parfait !'
      : `${r.elapsedMs < r.targetMs ? '−' : '+'}${seconds(r.errorMs)}`;

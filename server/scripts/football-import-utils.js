export const normalize = value => String(value ?? '').replace(/&#0*39;|&apos;/g, "'").normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
export function matchPlayer(entry, candidates) {
  const football = (candidates ?? []).filter(p => p.strSport === 'Soccer');
  if (entry.source?.id) return football.find(p => String(p.idPlayer) === entry.source.id) ?? null;
  // A first name alone (notably Ronaldo) is not sufficient to establish identity.
  if (normalize(entry.name) === 'ronaldo') return null;
  const exact = football.filter(p => normalize(p.strPlayer) === normalize(entry.name));
  return exact.length === 1 ? exact[0] : null;
}
export function imageUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
}
export function enrich(entry, player, importedAt) {
  return {
    ...entry,
    nationality: player.strNationality || entry.nationality || null,
    dateBorn: player.dateBorn || entry.dateBorn || null,
    photoUrl: imageUrl(player.strCutout) || imageUrl(player.strThumb) || entry.photoUrl || null,
    portraitUrl: imageUrl(player.strThumb),
    cutoutUrl: imageUrl(player.strCutout),
    source: { provider: 'TheSportsDB', id: String(player.idPlayer), url: `https://www.thesportsdb.com/player/${player.idPlayer}`, position: player.strPosition || null, importedAt },
  };
}

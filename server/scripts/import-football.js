import { readFile, writeFile, rename } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { matchPlayer, enrich } from './football-import-utils.js';
const file = new URL('../src/games/football/data/players.json', import.meta.url);
const reportFile = new URL('../src/games/football/data/import-report.json', import.meta.url);
const entries = JSON.parse(await readFile(file, 'utf8'));
const key = process.env.THESPORTSDB_API_KEY || '123';
const apply = process.argv.includes('--write');
const report = { importedAt: new Date().toISOString(), applied: apply, imported: [], review: [], errors: [] };
const only = process.argv.find(arg => arg.startsWith('--only='))?.slice(7);
if (only && !entries.some(entry => entry.id === only)) throw new Error('Identifiant de profil inconnu');
const output = [];
for (const [index, entry] of entries.entries()) {
  if (only && entry.id !== only) { output.push(entry); continue; }
  if (index) await delay(2200); // Free tier: at most 30 requests/minute.
  try {
    const endpoint = entry.source?.id ? `lookupplayer.php?id=${encodeURIComponent(entry.source.id)}` : `searchplayers.php?p=${encodeURIComponent(entry.name.normalize('NFD').replace(/\p{M}/gu, '').replaceAll('’', "'"))}`;
    const response = await fetch(`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key)}/${endpoint}`, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const candidates = data.player ?? data.players ?? [];
    const match = matchPlayer(entry, candidates);
    if (match) {
      const enriched = enrich(entry, match, report.importedAt);
      output.push(enriched);
      report.imported.push({ id: entry.id, name: entry.name, sourceId: enriched.source.id, hasPhoto: Boolean(enriched.photoUrl) });
    } else {
      output.push(entry);
      report.review.push({ id: entry.id, name: entry.name, reason: 'Identité non confirmée : aucun résultat exact unique ou nom ambigu.', candidates: candidates.map(p => ({ id: p.idPlayer, name: p.strPlayer, nationality: p.strNationality, dateBorn: p.dateBorn, position: p.strPosition })) });
    }
  } catch (error) {
    output.push(entry);
    report.errors.push({ id: entry.id, name: entry.name, error: error.name === 'TimeoutError' ? 'Délai dépassé' : /^HTTP \d+$/.test(error.message) ? error.message : 'Échec de la requête ou réponse invalide' });
  }
  console.log(`${index + 1}/${entries.length} ${entry.name}`);
}
// Keep a complete catalogue even when some calls fail. Replace atomically.
if (apply) {
  const temporary = new URL('./players.import.tmp', file);
  await writeFile(temporary, JSON.stringify(output, null, 2) + '\n');
  await rename(temporary, file);
}
if (only) {
  const previous = JSON.parse(await readFile(reportFile, 'utf8').catch(() => '{}'));
  for (const group of ['imported', 'review', 'errors']) report[group] = [...(previous[group] ?? []).filter(entry => entry.id !== only), ...report[group]];
}
await writeFile(reportFile, JSON.stringify(report, null, 2) + '\n');
console.log(`${report.imported.length} profils importables, ${report.review.length} à vérifier, ${report.errors.length} erreurs. ${apply ? 'Catalogue mis à jour.' : 'Simulation : catalogue inchangé.'}`);
if (report.errors.length) process.exitCode = 1;

import { readFileSync } from 'node:fs';
export const pairs = ['words','anime'].flatMap(file => JSON.parse(readFileSync(new URL(`./data/${file}.json`, import.meta.url), 'utf8')));
export const categories = [...new Set(pairs.flatMap(p=>p.themes))];
export const universes = [...new Set(pairs.flatMap(p=>p.requiredUniverses))];
export function matchingPairs(settings) {
 return pairs.filter(p=>p.themes.some(t=>settings.categories.includes(t))
   && p.requiredThemes.every(t=>settings.categories.includes(t))
   && p.requiredUniverses.every(u=>settings.universes.includes(u))
   && (!p.crossover||settings.crossovers));
}

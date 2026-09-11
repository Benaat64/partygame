import { initializeRoundState, publicState, act, advance } from './rounds.js';
import { categories, universes, matchingPairs } from './catalog.js';
import { randomInt } from 'node:crypto';

function validateSettings(input) {
  if (!input || !Number.isInteger(input.undercoverCount) || input.undercoverCount < 1
    || input.undercoverCount > 50) {
    throw new Error('Choisissez entre 1 et 50 Undercover (nombre entier).');
  }
  if (!Array.isArray(input.categories) || !input.categories.length
    || input.categories.some(category => !categories.includes(category))
    || (input.universes !== undefined && (!Array.isArray(input.universes) || input.universes.some(u=>!universes.includes(u))))
    || (input.crossovers !== undefined && typeof input.crossovers !== 'boolean')) {
    throw new Error('Sélectionnez des thèmes et univers valides.');
  }
  const phaseSeconds = input.phaseSeconds === undefined ? 30 : input.phaseSeconds;
  const maxTurns = input.maxTurns ?? 3;
  const matchCount = input.matchCount ?? 3;
  if (![null, 10, 20, 30, 40, 60].includes(phaseSeconds)
    || !Number.isInteger(maxTurns) || maxTurns < 1 || maxTurns > 5
    || !Number.isInteger(matchCount) || matchCount < 1 || matchCount > 5) {
    throw new Error('Choisissez 10, 20, 30, 40 ou 60 secondes ou Illimité, 1 à 5 manches et 1 à 5 tours.');
  }
  const settings = {
    phaseSeconds, maxTurns, matchCount,
    undercoverCount: input.undercoverCount,
    categories: [...new Set(input.categories)],
    universes: [...new Set(input.universes ?? universes)],
    crossovers: input.crossovers ?? true,
  };
  return settings;
}

export const undercover = {
  publicState, act, advance,
  defaultSettings: () => ({ undercoverCount: 1, phaseSeconds: 30, matchCount: 3, maxTurns: 3, categories: ['animals','food'], universes: [...universes], crossovers: true }),
  options: settings => ({ categories: [...categories], universes: [...universes], pairCount: settings ? matchingPairs(settings).length : 0 }),
  validateSettings,
  next(state, players) {
    if (state.phase !== 'finished' || state.match >= state.settings.matchCount) {
      throw new Error('La manche suivante n’est pas disponible.');
    }
    const next = undercover.start(players, state.settings);
    next.match = state.match + 1;
    next.scores = { ...state.scores };
    next.history = structuredClone(state.history);
    return next;
  },
  start(players, input) {
    const settings = validateSettings(input);
    if (players.length < 3) throw new Error('Il faut au moins 3 joueurs pour lancer Undercover.');
    const intruders = settings.undercoverCount;
    if (players.length - intruders <= intruders) {
      throw new Error('Les Civils doivent être plus nombreux que les Undercover.');
    }
    const pairs = matchingPairs(settings);
    if (!pairs.length) throw new Error('Aucune paire disponible : ajoutez un thème ou un univers.');
    const pair = pairs[randomInt(pairs.length)];
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const assignments = new Map(shuffled.map((player, index) => {
      if (index < intruders) return [player.id, { role: 'undercover', word: pair.word2 }];
      return [player.id, { role: 'civil', word: pair.word1 }];
    }));
    return initializeRoundState(assignments, settings);
  },
};

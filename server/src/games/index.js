import { chrono } from './chrono/index.js';
import { football } from './football/index.js';
import { undercover } from './undercover/index.js';

const games = new Map([['undercover', undercover], ['football', football], ['chrono', chrono]]);

export function getGame(id) {
  const game = games.get(id);
  if (!game) throw new Error('Jeu inconnu.');
  return game;
}

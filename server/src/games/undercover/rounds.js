import { randomInt } from 'node:crypto';

function nextClue(state, now) {
  state.clueIndex++;
  if (state.clueIndex >= state.clueOrder.length) {
    if (state.turn === 1) {
      state.turn = 2;
      state.clueIndex = 0;
    } else state.phase = 'vote';
  }
  state.deadline =
    state.settings.phaseSeconds === null
      ? null
      : now + state.settings.phaseSeconds * 1000;
}

export function initializeRoundState(assignments, settings, now = Date.now()) {
  const order = [...assignments.keys()];
  for (let i = order.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    order,
    clueOrder: [...order],
    clueIndex: 0,
    assignments,
    settings,
    alive: [...assignments.keys()],
    turn: 1,
    phase: 'clues',
    deadline:
      settings.phaseSeconds === null
        ? null
        : now + settings.phaseSeconds * 1000,
    messages: [],
    votes: new Map(),
    results: [],
    winner: null,
    match: 1,
    scores: Object.fromEntries([...assignments.keys()].map((id) => [id, 0])),
    history: [],
  };
}

export function publicState(state) {
  return {
    clueOrder: [...state.clueOrder],
    currentPlayerId:
      state.phase === 'clues' ? state.clueOrder[state.clueIndex] : null,
    match: state.match,
    scores: { ...state.scores },
    history: structuredClone(state.history),
    seriesFinished:
      state.phase === 'finished' && state.match === state.settings.matchCount,
    alive: [...state.alive],
    turn: state.turn,
    phase: state.phase,
    deadline: state.deadline,
    messages: state.messages.map((message) => ({ ...message })),
    voted: [...state.votes.keys()],
    results: structuredClone(state.results),
    winner: state.winner,
    revelations: state.winner
      ? [...state.assignments].map(([playerId, card]) => ({
          playerId,
          ...card,
        }))
      : [],
  };
}

function finishVote(state, now) {
  const counts = new Map();
  for (const target of state.votes.values())
    counts.set(target, (counts.get(target) ?? 0) + 1);
  const highest = Math.max(0, ...counts.values());
  const leaders = [...counts]
    .filter(([, count]) => count === highest)
    .map(([id]) => id);
  const eliminated = leaders.length === 1 ? leaders[0] : null;
  if (eliminated) state.alive = state.alive.filter((id) => id !== eliminated);
  state.results.push({
    turn: state.turn,
    eliminated,
    counts: Object.fromEntries(counts),
  });
  const spies = state.alive.filter(
    (id) => state.assignments.get(id).role === 'undercover',
  ).length;
  if (!spies) state.winner = 'civil';
  else if (spies >= state.alive.length - spies) state.winner = 'undercover';
  if (state.winner) {
    const points = state.winner === 'civil' ? 2 : 3;
    const gains = {};
    for (const [id, card] of state.assignments) {
      gains[id] = card.role === state.winner ? points : 0;
      state.scores[id] += gains[id];
    }
    state.history.push({ match: state.match, winner: state.winner, gains });
    state.phase = 'finished';
    state.deadline = null;
  } else {
    state.turn++;
    state.phase = 'clues';
    state.clueOrder = state.order.filter((id) => state.alive.includes(id));
    state.clueIndex = 0;
    state.votes.clear();
    state.deadline =
      state.settings.phaseSeconds === null
        ? null
        : now + state.settings.phaseSeconds * 1000;
  }
}

export function advance(state, now = Date.now()) {
  if (
    state.phase === 'finished' ||
    state.deadline === null ||
    now < state.deadline
  )
    return false;
  if (state.phase === 'clues') {
    nextClue(state, now);
  } else finishVote(state, now);
  return true;
}

export function act(state, playerId, action, payload, now = Date.now()) {
  if (!state.alive.includes(playerId))
    throw new Error('Vous êtes éliminé : vous pouvez suivre la partie.');
  if (
    state.phase === 'finished' ||
    (state.deadline !== null && now >= state.deadline)
  )
    throw new Error('Cette phase est terminée.');
  if (payload?.turn !== state.turn) throw new Error('Ce tour est terminé.');
  if (action === 'clue') {
    if (state.phase !== 'clues')
      throw new Error('Les indices sont fermés pendant le vote.');
    if (state.clueOrder[state.clueIndex] !== playerId)
      throw new Error('Ce n’est pas à vous de donner un indice.');
    if (
      state.messages.some(
        (message) =>
          message.turn === state.turn && message.playerId === playerId,
      )
    )
      throw new Error('Vous avez déjà donné votre indice.');
    if (
      typeof payload.text !== 'string' ||
      !payload.text.trim() ||
      payload.text.trim().length > 120 ||
      /[\p{Cc}\p{Cf}]/u.test(payload.text)
    )
      throw new Error(
        'Écrivez un indice de 1 à 120 caractères sans caractères de contrôle.',
      );
    state.messages.push({
      playerId,
      turn: state.turn,
      text: payload.text.trim(),
    });
    nextClue(state, now);
  } else if (action === 'vote') {
    if (state.phase !== 'vote')
      throw new Error('Le vote n’est pas encore ouvert.');
    if (state.votes.has(playerId))
      throw new Error('Votre vote est déjà enregistré.');
    if (
      payload.targetId === playerId ||
      !state.alive.includes(payload.targetId)
    )
      throw new Error('Choisissez un autre joueur encore en jeu.');
    state.votes.set(playerId, payload.targetId);
    if (state.votes.size === state.alive.length) finishVote(state, now);
  } else throw new Error('Action inconnue.');
}

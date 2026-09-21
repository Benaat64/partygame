import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initializeRoundState,
  act,
  advance,
  publicState,
} from '../src/games/undercover/rounds.js';
import { createRoomStore } from '../src/rooms/store.js';
function setup(maxTurns = 5) {
  return initializeRoundState(
    new Map(
      ['a', 'b', 'c', 'd', 'e'].map((id) => [
        id,
        {
          role: id === 'a' ? 'undercover' : 'civil',
          word: id === 'a' ? 'Loup' : 'Chien',
        },
      ]),
    ),
    { phaseSeconds: 10, maxTurns, matchCount: 1 },
    0,
  );
}
function clues(s) {
  do {
    for (const id of s.clueOrder)
      act(s, id, 'clue', { text: 'Indice', turn: s.turn }, 1);
  } while (s.phase === 'clues');
}
function vote(s, id, targetId) {
  act(s, id, 'vote', { targetId, turn: s.turn }, 2);
}
test('indices, validation, votes uniques, victoire civile et secrets', () => {
  const s = setup();
  assert.throws(() => vote(s, 'b', 'a'));
  assert.throws(() => act(s, 'a', 'clue', { text: ' ', turn: 1 }, 1));
  assert.throws(() =>
    act(s, 'a', 'clue', { text: 'x'.repeat(121), turn: 1 }, 1),
  );
  const first = s.clueOrder[0];
  act(s, first, 'clue', { text: 'Forêt', turn: 1 }, 1);
  assert.throws(() => act(s, first, 'clue', { text: 'Bis', turn: 1 }, 1));
  for (const id of s.clueOrder.slice(1))
    act(s, id, 'clue', { text: 'Poils', turn: 1 }, 1);
  assert.equal(s.phase, 'clues');
  assert.equal(s.turn, 2);
  clues(s);
  assert.equal(s.phase, 'vote');
  assert.throws(() => vote(s, 'a', 'a'));
  vote(s, 'a', 'b');
  assert.throws(() => vote(s, 'a', 'c'));
  assert.deepEqual(publicState(s).revelations, []);
  assert.ok(!JSON.stringify(publicState(s)).includes('Loup'));
  for (const id of ['b', 'c', 'd', 'e']) vote(s, id, 'a');
  assert.equal(s.winner, 'civil');
  assert.equal(publicState(s).revelations.length, 5);
  assert.throws(() => act(s, 'b', 'clue', { text: 'Fin', turn: 1 }, 3));
});
test('élimination, actions interdites et victoire par parité', () => {
  const s = setup();
  clues(s);
  for (const id of ['a', 'c', 'd', 'e']) vote(s, id, 'b');
  vote(s, 'b', 'c');
  assert.equal(s.turn, 3);
  assert.throws(() => act(s, 'b', 'clue', { text: 'Non', turn: 2 }, 3));
  assert.throws(() => act(s, 'a', 'clue', { text: 'Ancien', turn: 1 }, 3));
  clues(s);
  assert.throws(() => vote(s, 'a', 'b'));
  for (const id of ['a', 'd', 'e']) vote(s, id, 'c');
  vote(s, 'c', 'd');
  clues(s);
  vote(s, 'a', 'd');
  vote(s, 'e', 'd');
  vote(s, 'd', 'e');
  assert.equal(s.winner, 'undercover');
});
test('deux tours minimum, égalités répétées et abstentions sans victoire automatique', () => {
  const s = setup(1);
  assert.equal(advance(s, 9999), false);
  for (let i = 0; i < 5; i++) advance(s, s.deadline);
  assert.equal(s.turn, 2);
  assert.equal(s.phase, 'clues');
  for (let i = 0; i < 5; i++) advance(s, s.deadline);
  assert.equal(s.phase, 'vote');
  advance(s, s.deadline);
  assert.equal(s.turn, 3);
  assert.equal(s.winner, null);
  for (let round = 0; round < 6; round++) {
    clues(s);
    vote(s, 'a', 'b');
    vote(s, 'b', 'a');
    advance(s, s.deadline);
    assert.equal(s.results.at(-1).eliminated, null);
    assert.equal(s.winner, null);
    assert.equal(s.phase, 'clues');
  }
  clues(s);
  vote(s, 'a', 'b');
  for (const id of ['b', 'c', 'd', 'e']) vote(s, id, 'a');
  assert.equal(s.winner, 'civil');
});
function finishStoreMatch(store, started) {
  let room = started.room;
  const socketFor = (id) =>
    ['a', 'b', 'c'][room.players.findIndex((p) => p.id === id)];
  while (room.game.phase === 'clues') {
    room = store.action(socketFor(room.game.currentPlayerId), 'clue', {
      gameSessionId: room.gameSessionId,
      turn: room.game.turn,
      text: 'Indice',
    });
  }
  const spy = started.deliveries.find(d =>
    started.deliveries.filter(other => other.secret.word === d.secret.word).length === 1
  ).recipient;
  const spyId = room.players[['a', 'b', 'c'].indexOf(spy)].id;
  const victim = room.players.find((p) => p.id !== spyId).id;
  for (const p of room.players)
    room = store.action(socketFor(p.id), 'vote', {
      gameSessionId: room.gameSessionId,
      turn: room.game.turn,
      targetId: p.id === victim ? spyId : victim,
    });
  return room;
}
test('création, horloge serveur, anciennes parties et rejouer', () => {
  const store = createRoomStore();
  assert.throws(() => store.create('bad', 'Alice', { phaseSeconds: 1 }));
  const { room } = store.create('a', 'Alice', {
    phaseSeconds: 10,
    maxTurns: 1,
  });
  store.join('b', 'Bob', room.code);
  store.join('c', 'Charlie', room.code);
  const started = store.start('a');
  assert.equal(started.room.settings.maxTurns, undefined);
  assert.throws(() =>
    store.action('a', 'clue', {
      gameSessionId: 'old',
      turn: 1,
      text: 'Indice',
    }),
  );
  const deadline = started.room.game.deadline;
  store.tick(deadline);
  store.tick(deadline + 10000);
  assert.equal(store.tick(deadline + 20000)[0].game.phase, 'clues');
  assert.equal(store.tick(deadline + 30000)[0].game.winner, null);
  store.reset('a');
  assert.deepEqual(store.tick(deadline + 999999), []);
  const replay = store.start('a');
  assert.equal(replay.room.game.turn, 1);
  assert.deepEqual(replay.room.game.messages, []);
  assert.notEqual(replay.room.gameSessionId, started.room.gameSessionId);
});

test('manches successives : scores cumulés une fois, cartes privées et remise en jeu', () => {
  const store = createRoomStore();
  const { room } = store.create('a', 'Alice', {
    phaseSeconds: 10,
    matchCount: 2,
    maxTurns: 1,
  });
  store.join('b', 'Bob', room.code);
  store.join('c', 'Charlie', room.code);
  const first = store.start('a');
  assert.throws(() => store.next('a'));
  const deadline = first.room.game.deadline;
  const end = finishStoreMatch(store, first);
  assert.equal(end.game.winner, 'undercover');
  assert.equal(end.game.seriesFinished, false);
  assert.equal(
    Object.values(end.game.scores).reduce((a, b) => a + b, 0),
    3,
  );
  assert.deepEqual(store.tick(deadline + 20000), []);
  assert.throws(() => store.next('b'), /hôte/);
  const second = store.next('a');
  assert.equal(second.room.game.match, 2);
  assert.equal(second.room.game.turn, 1);
  assert.equal(second.room.game.alive.length, 3);
  assert.deepEqual(second.room.game.revelations, []);
  assert.deepEqual(second.room.game.messages, []);
  assert.deepEqual(second.room.game.voted, []);
  assert.deepEqual(second.room.game.scores, end.game.scores);
  assert.notEqual(second.room.gameSessionId, first.room.gameSessionId);
  assert.throws(() =>
    store.action('a', 'clue', {
      gameSessionId: first.room.gameSessionId,
      turn: 1,
      text: 'Ancien',
    }),
  );
  const final = finishStoreMatch(store, second);
  assert.equal(final.game.seriesFinished, true);
  assert.equal(final.game.history.length, 2);
  assert.equal(
    Object.values(final.game.scores).reduce((a, b) => a + b, 0),
    6,
  );
  assert.throws(() => store.next('a'));
  store.reset('a');
  const replay = store.start('a');
  assert.equal(replay.room.game.match, 1);
  assert.equal(
    Object.values(replay.room.game.scores).reduce((a, b) => a + b, 0),
    0,
  );
});

test('limites des réglages validées côté serveur', () => {
  const store = createRoomStore();
  for (const phaseSeconds of [10, 20, 30, 40, 60])
    assert.equal(
      store.create(String(phaseSeconds), 'Alice', { phaseSeconds }).room
        .settings.phaseSeconds,
      phaseSeconds,
    );
  for (const timing of [
    { phaseSeconds: 300 },
    { phaseSeconds: 15 },
    { phaseSeconds: 0 },
    { phaseSeconds: 'unlimited' },
    { matchCount: 6 },
    { matchCount: 0 },
  ]) {
    assert.throws(() => store.create('invalid', 'Alice', timing));
  }
});

test('temps illimité : aucune expiration, passage après tous les indices et votes', () => {
  const store = createRoomStore();
  const { room } = store.create('a', 'Alice', {
    phaseSeconds: null,
    maxTurns: 2,
  });
  store.join('b', 'Bob', room.code);
  store.join('c', 'Charlie', room.code);
  const started = store.start('a');
  assert.equal(started.room.settings.phaseSeconds, null);
  assert.equal(started.room.game.deadline, null);
  assert.deepEqual(store.tick(Number.MAX_SAFE_INTEGER), []);
  const payload = { gameSessionId: started.room.gameSessionId, turn: 1 };
  const order = started.room.game.clueOrder.map(
    (id) => ['a', 'b', 'c'][started.room.players.findIndex((p) => p.id === id)],
  );
  for (const id of order.slice(0, 2))
    assert.equal(
      store.action(id, 'clue', { ...payload, text: 'Indice' }).game.phase,
      'clues',
    );
  let voting = store.action(order[2], 'clue', { ...payload, text: 'Indice' });
  assert.equal(voting.game.phase, 'clues');
  payload.turn = 2;
  for (const id of order)
    voting = store.action(id, 'clue', { ...payload, text: 'Deuxième indice' });
  assert.equal(voting.game.phase, 'vote');
  assert.equal(voting.game.deadline, null);
  assert.deepEqual(store.tick(Number.MAX_SAFE_INTEGER), []);
  const ids = started.room.players.map((p) => p.id);
  for (const [i, id] of ['a', 'b', 'c'].entries()) {
    const result = store.action(id, 'vote', {
      ...payload,
      targetId: ids[(i + 1) % 3],
    });
    if (i === 2) {
      assert.equal(result.game.turn, 3);
      assert.equal(result.game.phase, 'clues');
      assert.equal(result.game.deadline, null);
    }
  }
  assert.deepEqual(store.tick(Number.MAX_SAFE_INTEGER), []);
});

test('indices séquentiels : refus hors tour, passage après délai, ordre conservé sans éliminés', () => {
  const s = setup();
  assert.deepEqual([...s.clueOrder].sort(), [...s.alive].sort());
  const [first, second] = s.clueOrder;
  assert.throws(
    () => act(s, second, 'clue', { turn: 1, text: 'Trop tôt' }, 1),
    /pas à vous/,
  );
  advance(s, 10000);
  assert.equal(publicState(s).currentPlayerId, second);
  assert.equal(s.phase, 'clues');
  assert.equal(s.deadline, 20000);
  assert.throws(
    () => act(s, first, 'clue', { turn: 1, text: 'Trop tard' }, 10001),
    /pas à vous/,
  );
  for (const id of s.clueOrder.slice(1))
    act(s, id, 'clue', { turn: 1, text: 'Indice' }, 10001);
  assert.equal(s.phase, 'clues');
  assert.equal(s.turn, 2);
  clues(s);
  assert.equal(publicState(s).currentPlayerId, null);
});

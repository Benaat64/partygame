import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { io as connect } from 'socket.io-client';
import { matchingPairs } from '../src/games/undercover/catalog.js';
import { undercover } from '../src/games/undercover/index.js';
import { createRoomStore } from '../src/rooms/store.js';
import { registerSocketHandlers } from '../src/socket/index.js';

test('Undercover : filtrage, répartition et validation', () => {
  const settings = { undercoverCount: 2, categories: ['animals'], difficulty: 'hard' };
  const players = Array.from({ length: 5 }, (_, id) => ({ id: String(id) }));
  for (let i = 0; i < 20; i++) {
    const { assignments } = undercover.start(players, settings);
    const secrets = [...assignments.values()];
    assert.equal(assignments.size, 5);
    const civils = secrets.filter(s => s.role === 'civil');
    assert.equal(civils.length, 3);
    assert.equal(new Set(civils.map(s => s.word)).size, 1);
    const spy = secrets.find(s => s.role === 'undercover');
    assert.ok(matchingPairs(settings).some(p => p.word1 === civils[0].word && p.word2 === spy.word));
    assert.equal(secrets.filter(s => s.role === 'undercover').length, 2);
    assert.ok(secrets.every(s => s.role === 'civil' || s.role === 'undercover'));
    assert.ok(secrets.every(s => typeof s.word === 'string'));
  }
  for (const patch of [{ undercoverCount: -1 }, { undercoverCount: 0.5 }, { undercoverCount: 0 }, { categories: [] }, { categories: ['unknown'] }]) {
    assert.throws(() => undercover.validateSettings({ ...settings, ...patch }));
  }
  assert.throws(() => undercover.start(players.slice(0, 2), settings), /3 joueurs/);
  assert.throws(() => undercover.start(players.slice(0, 4), settings), /plus nombreux/);
});

test('Rooms : autorisations, double lancement, arrivée tardive et interruption', () => {
  const store = createRoomStore();
  const { room } = store.create('a', 'Alice');
  store.join('b', 'Bob', room.code);
  assert.throws(() => store.start('a'), /3 joueurs/);
  store.join('c', 'Charlie', room.code);
  assert.throws(() => store.start('b'), /hôte/);
  assert.throws(() => store.configure('b', room.settings), /hôte/);
  assert.throws(() => store.reset('b'), /hôte/);
  assert.throws(() => store.start('outsider'), /Rejoignez/);
  const started = store.start('a');
  assert.equal(started.room.status, 'playing');
  assert.equal(started.deliveries.length, 3);
  assert.throws(() => store.start('a'), /déjà commencé/);
  assert.throws(() => store.configure('a', room.settings), /déjà commencé/);
  assert.throws(() => store.join('d', 'Diane', room.code), /déjà commencé/);
  const reset = store.reset('a');
  assert.equal(reset.status, 'lobby');
  assert.equal(reset.gameSessionId, null);
  assert.notEqual(store.start('a').room.gameSessionId, started.room.gameSessionId);
  const departed = store.leave('a');
  assert.equal(departed.room.status, 'lobby');
  assert.equal(departed.room.gameSessionId, null);
});

test('Socket.io : un seul secret par destinataire, aucun secret public ou externe', { timeout: 10000 }, async () => {
  const http = createServer();
  const io = new Server(http);
  registerSocketHandlers(io);
  const clients = [];
  const records = [];
  try {
    await new Promise((resolve, reject) => { http.once('error', reject); http.listen(0, '127.0.0.1', resolve); });
    for (let i = 0; i < 4; i++) {
      const socket = connect(`http://127.0.0.1:${http.address().port}`, { reconnection: false, timeout: 2000 });
      clients.push(socket);
      const record = { secrets: [], public: [] };
      records.push(record);
      socket.on('game:private', secret => record.secrets.push(secret));
      socket.on('room:updated', room => record.public.push(room));
      await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
    }
    const emit = (i, event, payload) => clients[i].timeout(2000).emitWithAck(event, payload);
    const created = await emit(0, 'room:create', { nickname: 'Alice' });
    for (let i = 1; i < 3; i++) {
      assert.equal((await emit(i, 'room:join', { nickname: `Joueur ${i}`, code: created.room.code })).ok, true);
    }
    assert.equal((await emit(1, 'room:start')).ok, false);
    assert.equal((await emit(3, 'room:start')).ok, false);
    const settings = { ...created.room.settings, categories: ['food'], difficulty: 'medium' };
    assert.equal((await emit(0, 'room:settings', settings)).ok, true);
    assert.equal((await emit(0, 'room:start')).ok, true);
    // Acknowledgements on each connection establish a barrier after the private events.
    for (let i = 1; i < 4; i++) await emit(i, 'room:start');
    assert.deepEqual(records.map(r => r.secrets.length), [1, 1, 1, 0]);
    assert.equal(records[3].public.length, 0);
    const secrets = records.slice(0, 3).map(r => r.secrets[0]);
    for (const secret of secrets) assert.deepEqual(Object.keys(secret).sort(), ['gameSessionId', 'word']);
    assert.equal(new Set(secrets.map(s => s.word)).size, 2);
    assert.equal(new Set(secrets.map(s => s.gameSessionId)).size, 1);
    for (const record of records) {
      for (const room of record.public) {
        assert.deepEqual(Object.keys(room).sort(), ['code', 'game', 'gameId', 'gameOptions', 'gameSessionId', 'hostId', 'paused', 'players', 'settings', 'status']);
        assert.ok(!/"(?:word|word1|word2|role|assignments|gameState)"/.test(JSON.stringify(room)));
      }
    }
  } finally {
    clients.forEach(socket => socket.disconnect());
    await new Promise(resolve => io.close(resolve));
  }
});

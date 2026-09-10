import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { io as connect } from 'socket.io-client';
import { app } from '../src/app.js';
import { registerSocketHandlers } from '../src/socket/index.js';
import { createRoomStore } from '../src/rooms/store.js';

test('validation, appartenance unique, transfert d’hôte et suppression des rooms vides', () => {
  const store = createRoomStore();
  assert.throws(() => store.create('a', ' '));
  assert.throws(() => store.create('a', 'a'.repeat(25)));
  const created = store.create('a', ' Alice ');
  assert.equal(created.room.players[0].nickname, 'Alice');
  assert.equal(created.room.hostId, created.playerId);
  assert.throws(() => store.create('a', 'Alice'));
  assert.throws(() => store.join('b', 'alice', created.room.code));
  assert.throws(() => store.join('b', 'Bob', {}));
  const joined = store.join('b', 'Bob', ` ${created.room.code.toLowerCase()} `);
  assert.equal(joined.room.players.length, 2);
  const left = store.leave('a');
  assert.equal(left.room.hostId, joined.playerId);
  assert.equal(left.room.players.length, 1);
  assert.equal(store.leave('b').room, null);
  assert.throws(() => store.join('c', 'Charlie', created.room.code), /introuvable/);
  assert.equal(store.leave('b'), null);
});

function nextEvent(socket, event) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off(event, handler); reject(new Error(`Timeout: ${event}`)); }, 3000);
    function handler(data) { clearTimeout(timer); resolve(data); }
    socket.once(event, handler);
  });
}

test('Socket.io : création, arrivée, isolation, départ et déconnexion', { timeout: 10000 }, async () => {
  const http = createServer(app);
  const io = new Server(http);
  registerSocketHandlers(io);
  const clients = [];
  try {
    await new Promise((resolve, reject) => {
      http.once('error', reject);
      http.listen(0, '127.0.0.1', resolve);
    });
    const url = `http://127.0.0.1:${http.address().port}`;
    for (const transports of [['polling'], ['websocket'], ['websocket']]) {
      const socket = connect(url, { transports, forceNew: true, reconnection: false });
      clients.push(socket);
      await nextEvent(socket, 'connect');
    }
    const [alice, bob, outsider] = clients;
    const emit = (socket, event, payload) => socket.timeout(3000).emitWithAck(event, payload);
    const invalid = await emit(alice, 'room:create', { nickname: null });
    assert.equal(invalid.ok, false);
    const created = await emit(alice, 'room:create', { nickname: 'Alice' });
    assert.equal(created.ok, true);
    const other = await emit(outsider, 'room:create', { nickname: 'Charlie' });
    const outsiderUpdates = [];
    outsider.on('room:updated', room => outsiderUpdates.push(room));
    const arrival = nextEvent(alice, 'room:updated');
    const joined = await emit(bob, 'room:join', { nickname: 'Bob', code: created.room.code });
    assert.equal(joined.ok, true);
    assert.equal((await arrival).players.length, 2);
    const departure = nextEvent(bob, 'room:updated');
    await alice.timeout(3000).emitWithAck('room:leave');
    const remaining = await departure;
    assert.equal(remaining.hostId, joined.playerId);
    assert.equal(remaining.players.length, 1);
    assert.deepEqual(Object.keys(remaining).sort(), ['code', 'game', 'gameId', 'gameOptions', 'gameSessionId', 'hostId', 'paused', 'players', 'settings', 'status']);
    assert.deepEqual(Object.keys(remaining.players[0]).sort(), ['connected', 'id', 'nickname']);
    const left = await bob.timeout(3000).emitWithAck('room:leave');
    assert.equal(left.ok, true);
    assert.equal((await emit(bob, 'room:join', { nickname: 'Bob', code: created.room.code })).ok, false);
    assert.equal((await emit(bob, 'room:join', { nickname: 'Bob', code: other.room.code })).ok, true);
    assert.ok(outsiderUpdates.every(room => room.code === other.room.code));
  } finally {
    clients.forEach(socket => socket.disconnect());
    await new Promise(resolve => io.close(resolve));
  }
});

import { createRoomStore } from '../rooms/store.js';

export function registerSocketHandlers(io) {
  const store = createRoomStore();
  const timer = setInterval(() => {
    for (const room of store.tick()) io.to(room.code).emit('room:updated', room);
  }, 250);
  timer.unref();
  io.httpServer?.once('close', () => clearInterval(timer));
  io.on('connection', (socket) => {
    function enter(action, payload, acknowledge) {
      if (typeof acknowledge !== 'function') return;
      try {
        const { nickname, code, timing, gameId } = payload ?? {};
        const result = action === 'create'
          ? store.create(socket.id, nickname, timing, gameId)
          : store.join(socket.id, nickname, code);
        socket.join(result.room.code);
        acknowledge({ ok: true, ...result });
        socket.to(result.room.code).emit('room:updated', result.room);
      } catch (error) {
        acknowledge({ ok: false, error: error.message });
      }
    }

    function leave() {
      const result = store.leave(socket.id);
      if (!result) return;
      socket.leave(result.code);
      if (result.room) io.to(result.code).emit('room:updated', result.room);
    }

    socket.on('room:create', (payload, ack) => enter('create', payload, ack));
    socket.on('room:join', (payload, ack) => enter('join', payload, ack));
    socket.on('room:resume', (token, ack) => {
      if (typeof ack !== 'function') return;
      try {
        const { previousId, ...result } = store.resume(socket.id, token);
        io.sockets.sockets.get(previousId)?.disconnect(true);
        socket.join(result.room.code);
        ack({ ok: true, ...result });
        socket.to(result.room.code).emit('room:updated', result.room);
      } catch (error) {
        ack({ ok: false, error: error.message });
      }
    });
    function acknowledgeAction(ack, action) {
      if (typeof ack !== 'function') return;
      try {
        action();
        ack({ ok: true });
      } catch (error) {
        ack({ ok: false, error: error.message });
      }
    }

    for (const action of ['clue', 'vote', 'bid', 'pass', 'recruit', 'place', 'begin', 'stop', 'forfeit']) {
      socket.on(`game:${action}`, (payload, ack) => acknowledgeAction(ack, () => {
        const room = store.action(socket.id, action, payload);
        io.to(room.code).emit('room:updated', room);
      }));
    }

    socket.on('room:settings', (settings, ack) => acknowledgeAction(ack, () => {
      const room = store.configure(socket.id, settings);
      io.to(room.code).emit('room:updated', room);
    }));
    for (const operation of ['start', 'next']) {
    socket.on(`room:${operation}`, (_payload, ack) => acknowledgeAction(ack, () => {
      const { room, deliveries } = store[operation](socket.id);
      io.to(room.code).emit('room:updated', room);
      for (const { recipient, secret } of deliveries) {
        io.to(recipient).emit('game:private', secret);
      }
    }));
    }
    socket.on('room:reset', (_payload, ack) => acknowledgeAction(ack, () => {
      const room = store.reset(socket.id);
      io.to(room.code).emit('room:updated', room);
    }));
    socket.on('room:leave', (ack) => {
      leave();
      if (typeof ack === 'function') ack({ ok: true });
    });

    socket.on('disconnect', () => {
      const room = store.disconnect(socket.id);
      if (room) io.to(room.code).emit('room:updated', room);
    });
  });
}

import { randomInt, randomUUID } from 'node:crypto';
import { createPlayer } from '../players/index.js';
import { getGame } from '../games/index.js';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createRoomStore() {
  const rooms = new Map();
  const memberships = new Map();
  const credentials = new Map();
  const disconnected = new Map();

  function presence(room, now = Date.now()) {
    const waiting = [...room.players.keys()].some(id => disconnected.has(id));
    if (waiting && room.pausedAt === null) room.pausedAt = now;
    if (!waiting && room.pausedAt !== null) {
      if (room.gameState?.deadline != null) room.gameState.deadline += now - room.pausedAt;
      room.pausedAt = null;
    }
  }

  function available(socketId) {
    if (memberships.has(socketId)) throw new Error('Quittez votre room avant d’en rejoindre une autre.');
  }

  function snapshot(room) {
    return {
      code: room.code,
      hostId: room.hostId,
      status: room.status,
      paused: room.pausedAt !== null,
      game: room.gameState ? getGame(room.gameId).publicState(room.gameState) : null,
      gameId: room.gameId,
      gameSessionId: room.gameSessionId,
      settings: structuredClone(room.settings),
      gameOptions: getGame(room.gameId).options(room.settings),
      players: [...room.players].map(([id, player]) => ({ ...player, connected: !disconnected.has(id) })),
    };
  }

  function hostRoom(socketId) {
    const room = rooms.get(memberships.get(socketId));
    if (!room) throw new Error('Rejoignez une room.');
    if (room.players.get(socketId)?.id !== room.hostId) throw new Error('Seul l’hôte peut effectuer cette action.');
    return room;
  }

  function reset(room) {
    room.status = 'lobby';
    room.gameSessionId = null;
    room.gameState = null;
  }

  function add(room, socketId, player) {
    room.players.set(socketId, player);
    memberships.set(socketId, room.code);
    const resumeToken = randomUUID();
    credentials.set(resumeToken, socketId);
    return { room: snapshot(room), playerId: player.id, resumeToken };
  }

  function privateCard(room, playerId) {
    const data = getGame(room.gameId).privateState?.(room.gameState, playerId);
    return data ? { gameSessionId: room.gameSessionId, ...data } : null;
  }

  function deal(room, state) {
    room.gameState = state;
    room.gameSessionId = randomUUID();
    room.status = 'playing';
    return {
      room: snapshot(room),
      deliveries: [...room.players].filter(([, player]) => state.assignments?.has(player.id)).map(([recipient, player]) => ({
        recipient,
        secret: privateCard(room, player.id),
      })),
    };
  }

  return {
    create(socketId, nickname, timing = {}, gameId = 'undercover') {
      available(socketId);
      const player = createPlayer(nickname);
      let code;
      do {
        code = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join('');
      } while (rooms.has(code));
      const settings = getGame(gameId).validateSettings({ ...getGame(gameId).defaultSettings(), ...timing });
      const room = { code, hostId: player.id, players: new Map(), gameId,
        pausedAt: null, settings, status: 'lobby', gameSessionId: null, gameState: null };
      rooms.set(code, room);
      return add(room, socketId, player);
    },
    join(socketId, nickname, inputCode) {
      available(socketId);
      const player = createPlayer(nickname);
      if (typeof inputCode !== 'string' || !/^[A-Z2-9]{6}$/.test(inputCode.trim().toUpperCase())) {
        throw new Error('Le code de room doit contenir 6 lettres ou chiffres.');
      }
      const room = rooms.get(inputCode.trim().toUpperCase());
      if (!room) throw new Error('Room introuvable. Vérifiez le code.');
      if (room.status !== 'lobby') throw new Error('La partie a déjà commencé. Attendez le retour au lobby.');
      if (room.players.size >= (getGame(room.gameId).maxPlayers ?? Infinity)) throw new Error('Cette room est complète.');
      if ([...room.players.values()].some(p => p.nickname.toLocaleLowerCase('fr') === player.nickname.toLocaleLowerCase('fr'))) {
        throw new Error('Ce pseudo est déjà utilisé dans cette room.');
      }
      return add(room, socketId, player);
    },
    configure(socketId, settings) {
      const room = hostRoom(socketId);
      if (room.status !== 'lobby') throw new Error('La partie a déjà commencé.');
      room.settings = getGame(room.gameId).validateSettings(settings);
      return snapshot(room);
    },
    start(socketId) {
      const room = hostRoom(socketId);
      if (room.pausedAt !== null) throw new Error('Attendez la reconnexion des joueurs.');
      if (room.status !== 'lobby') throw new Error('La partie a déjà commencé.');
      const state = getGame(room.gameId).start([...room.players.values()], room.settings);
      return deal(room, state);
    },
    next(socketId) {
      const room = hostRoom(socketId);
      if (room.pausedAt !== null) throw new Error('Attendez la reconnexion des joueurs.');
      if (!room.gameState) throw new Error('Aucune partie en cours.');
      if (!getGame(room.gameId).next) throw new Error('Ce jeu ne comporte pas de manche suivante.');
      return deal(room, getGame(room.gameId).next(room.gameState, [...room.players.values()]));
    },
    action(socketId, action, payload) {
      const room = rooms.get(memberships.get(socketId));
      if (!room?.gameState || room.status !== 'playing') throw new Error('Aucune partie en cours.');
      if (room.pausedAt !== null) throw new Error('Partie en pause : un joueur se reconnecte.');
      if (payload?.gameSessionId !== room.gameSessionId) throw new Error('Cette partie est terminée.');
      getGame(room.gameId).act(room.gameState, room.players.get(socketId).id, action, payload);
      return snapshot(room);
    },
    tick(now = Date.now()) {
      const updates = [];
      for (const [id, expiresAt] of disconnected) {
        if (now >= expiresAt) {
          const result = this.leave(id);
          if (result?.room) updates.push(result.room);
        }
      }
      for (const room of rooms.values()) {
        if (room.pausedAt === null && room.gameState && getGame(room.gameId).advance(room.gameState, now)) updates.push(snapshot(room));
      }
      return updates;
    },
    reset(socketId) {
      const room = hostRoom(socketId);
      reset(room);
      return snapshot(room);
    },
    disconnect(socketId, now = Date.now()) {
      const room = rooms.get(memberships.get(socketId));
      if (!room || disconnected.has(socketId)) return null;
      disconnected.set(socketId, now + 60000);
      presence(room, now);
      return snapshot(room);
    },
    resume(socketId, token, now = Date.now()) {
      available(socketId);
      const previousId = credentials.get(token);
      const room = rooms.get(memberships.get(previousId));
      if (!room || (disconnected.has(previousId) && now >= disconnected.get(previousId))) {
        throw new Error('Session expirée. Rejoignez la room ou créez-en une nouvelle.');
      }
      const player = room.players.get(previousId);
      room.players = new Map([...room.players].map(([id, p]) => [id === previousId ? socketId : id, p]));
      memberships.delete(previousId);
      memberships.set(socketId, room.code);
      disconnected.delete(previousId);
      credentials.set(token, socketId);
      presence(room, now);
      return { room: snapshot(room), playerId: player.id, resumeToken: token, previousId,
        secret: privateCard(room, player.id) };
    },
    leave(socketId) {
      const code = memberships.get(socketId);
      if (!code) return null;
      const room = rooms.get(code);
      const player = room.players.get(socketId);
      memberships.delete(socketId);
      disconnected.delete(socketId);
      for (const [token, id] of credentials) if (id === socketId) credentials.delete(token);
      room.players.delete(socketId);
      if (!room.players.size) {
        rooms.delete(code);
        return { code, room: null };
      }
      if (room.hostId === player.id) room.hostId = room.players.values().next().value.id;
      presence(room);
      // Explicit departure or expired reconnection ends the current series.
      reset(room);
      return { code, room: snapshot(room) };
    },
  };
}

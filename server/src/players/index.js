import { randomUUID } from 'node:crypto';

export function createPlayer(nickname) {
  if (typeof nickname !== 'string') throw new Error('Indiquez un pseudo.');
  const name = nickname.trim();
  if (name.length < 2 || name.length > 24 || /[\p{Cc}\p{Cf}]/u.test(name)) {
    throw new Error('Le pseudo doit contenir entre 2 et 24 caractères, sans caractères de contrôle.');
  }
  return { id: randomUUID(), nickname: name };
}

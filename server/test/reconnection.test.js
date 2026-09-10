import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoomStore } from '../src/rooms/store.js';
function setup() {
  const store = createRoomStore();
  const alice = store.create('a','Alice');
  const bob = store.join('b','Bob',alice.room.code);
  store.join('c','Charlie',alice.room.code);
  const started = store.start('a');
  return {store, alice, bob, started};
}
test('reprise privée : identité, hôte, carte, indices et échéance conservés', () => {
  const {store,alice,started} = setup();
  const now = Date.now();
  const speaker = ['a','b','c'][started.room.players.findIndex(p => p.id === started.room.game.currentPlayerId)];
  store.action(speaker,'clue',{gameSessionId:started.room.gameSessionId, turn:1,text:'Indice'});
  const paused = store.disconnect('a',now);
  assert.equal(paused.paused,true);
  assert.equal(paused.players[0].connected,false);
  assert.ok(!JSON.stringify(paused).includes(alice.resumeToken));
  assert.deepEqual(store.tick(now+40000),[]);
  assert.throws(() => store.action('b','clue',{gameSessionId:started.room.gameSessionId,turn:1,text:'Non'}),/pause/);
  assert.throws(() => store.resume('x','invalid',now+40000));
  const resumed = store.resume('new-a',alice.resumeToken,now+40000);
  assert.equal(resumed.playerId,alice.playerId);
  assert.equal(resumed.room.hostId,alice.playerId);
  assert.equal(resumed.room.paused,false);
  assert.equal(resumed.room.game.messages.length,1);
  assert.equal(resumed.room.game.deadline,paused.game.deadline+40000);
  assert.deepEqual(resumed.secret,started.deliveries.find(d=>d.recipient==='a').secret);
  assert.equal(store.disconnect('a'),null);
  assert.throws(() => store.action('a','clue',{}));
});
test('deux coupures : une pause unique, reprise après le dernier retour', () => {
  const {store,alice,bob,started} = setup();
  const now=Date.now();
  store.disconnect('a',now); store.disconnect('b',now+1000);
  assert.equal(store.resume('new-a',alice.resumeToken,now+2000).room.paused,true);
  const resumed=store.resume('new-b',bob.resumeToken,now+3000);
  assert.equal(resumed.room.paused,false);
  assert.equal(resumed.room.game.deadline,started.room.game.deadline+3000);
});
test('expiration : retour lobby, transfert hôte et jeton invalidé', () => {
  const {store,alice} = setup(); const now=Date.now();
  store.disconnect('a',now);
  assert.throws(() => store.resume('x',alice.resumeToken,now+60000));
  const [room]=store.tick(now+60000);
  assert.equal(room.status,'lobby');
  assert.equal(room.paused,false);
  assert.equal(room.players.length,2);
  assert.notEqual(room.hostId,alice.playerId);
  assert.throws(() => store.resume('x',alice.resumeToken));
});
test('départ volontaire invalide la session et room vide expirée supprimée', () => {
  const store=createRoomStore(); const a=store.create('a','Alice');
  store.leave('a'); assert.throws(()=>store.resume('b',a.resumeToken));
  const b=store.create('b','Bob'); const now=Date.now(); store.disconnect('b',now);
  store.tick(now+60000);
  assert.throws(()=>store.join('c','Charlie',b.room.code));
});
test('reprise de connexion active : une seule connexion possède la session', () => {
  const {store,alice} = setup();
  const resumed=store.resume('new-a',alice.resumeToken);
  assert.equal(resumed.previousId,'a');
  assert.equal(resumed.room.players.length,3);
  assert.equal(store.leave('a'),null);
  assert.equal(store.disconnect('a'),null);
});

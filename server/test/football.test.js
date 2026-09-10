import test from 'node:test';
import assert from 'node:assert/strict';
import { football } from '../src/games/football/index.js';
import { createRoomStore } from '../src/rooms/store.js';
const players=[{id:'a'},{id:'b'}];
test('enchères : alternance, limites, abandon et anciennes actions',()=>{
 const s=football.start(players,{budget:250});
 assert.equal(s.activeId,'a');
 assert.throws(()=>football.act(s,'a','pass',{auction:1}));
 assert.throws(()=>football.act(s,'b','bid',{auction:1,amount:10}));
 assert.throws(()=>football.act(s,'a','bid',{auction:1,amount:247}));
 football.act(s,'a','bid',{auction:1,amount:20});
 assert.equal(s.activeId,'b');
 assert.throws(()=>football.act(s,'b','bid',{auction:1,amount:20}));
 football.act(s,'b','bid',{auction:1,amount:30});
 football.act(s,'a','pass',{auction:1});
 assert.equal(s.teams.b.budget,220);
 assert.equal(s.history[0].buyerId,'b');
 assert.equal(s.activeId,'b');
 assert.throws(()=>football.act(s,'a','bid',{auction:1,amount:40}));
 assert.ok(!('deck' in football.publicState(s)));
});
test('équipes complètes : 5 postes chacun, budgets positifs, 10 recrues uniques',()=>{
 for(let i=0;i<30;i++){
  const s=football.start(players,{budget:250});let actions=0;
  while(s.phase!=='finished'){
   assert.ok(actions++<30);
   if(s.solo)football.act(s,s.activeId,'recruit',{auction:s.auction});
   else if(!s.leaderId)football.act(s,s.activeId,'bid',{auction:s.auction,amount:football.publicState(s).limits[s.activeId]});
   else football.act(s,s.activeId,'pass',{auction:s.auction});
  }
  assert.equal(s.history.length,10);
  assert.equal(new Set(s.history.map(h=>h.player.id)).size,10);
  for(const team of Object.values(s.teams)){
   assert.equal(Object.keys(team.slots).length,5); assert.ok(team.budget>=0);
   assert.equal(team.budget+Object.values(team.slots).reduce((sum,p)=>sum+p.price,0),250);
   for(const [slot,p] of Object.entries(team.slots))assert.ok(slot==='Joker'||slot===p.position);
  }
  assert.throws(()=>football.act(s,'a','bid',{auction:s.auction,amount:1}));
 }
});
test('rooms génériques : deux joueurs, reprise, pause, reset',()=>{
 const store=createRoomStore();const a=store.create('a','Alice',{budget:250},'football');
 store.join('b','Bob',a.room.code);
 assert.throws(()=>store.join('c','Charlie',a.room.code));
 assert.throws(()=>store.start('b'));
 const start=store.start('a');assert.equal(start.room.game.phase,'auction');
 assert.throws(()=>store.next('a'));
 store.disconnect('a');
 assert.throws(()=>store.action('b','bid',{gameSessionId:start.room.gameSessionId,auction:1,amount:1}));
 const resumed=store.resume('new-a',a.resumeToken);
 assert.equal(resumed.playerId,a.playerId);assert.equal(resumed.room.game.auction,1);
 store.action('new-a','bid',{gameSessionId:start.room.gameSessionId,auction:1,amount:1});
 assert.equal(store.reset('new-a').status,'lobby');
 assert.notEqual(store.start('new-a').room.gameSessionId,start.room.gameSessionId);
});
test('offre exclusive : confirmation obligatoire, passer recycle, remplissage auto seulement après équipe complète',()=>{
 const s=football.start(players,{budget:250});
 // Force a known next offer without depending on the shuffled catalogue.
 s.current={id:'test-att',name:'Attaquant test',position:'ATT',photoUrl:null};
 s.teams.a.slots.GB={id:'owned-gb',position:'GB',price:1};
 s.teams.a.slots.Joker={id:'owned-joker',position:'MC',price:1};
 s.teams.a.budget=248;
 s.deck.unshift({id:'solo-gb',name:'Gardien test',position:'GB',photoUrl:null});
 football.act(s,'a','bid',{auction:s.auction,amount:1});
 football.act(s,'b','pass',{auction:s.auction});
 assert.equal(s.current.id,'solo-gb'); assert.equal(s.solo,true);
 const count=s.history.length;const budget=s.teams.b.budget;const auction=s.auction;
 assert.throws(()=>football.act(s,'a','recruit',{auction}));
 assert.throws(()=>football.act(s,'b','bid',{auction,amount:1}));
 football.act(s,'b','pass',{auction});
 assert.equal(s.history.length,count);assert.equal(s.teams.b.budget,budget);
 assert.ok(s.deck.some(p=>p.id==='solo-gb')||s.current.id==='solo-gb');
});

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
 assert.throws(()=>football.act(s,'a','bid',{auction:1,amount:246}));
 football.act(s,'a','bid',{auction:1,amount:20});
 assert.equal(s.activeId,'b');
 assert.throws(()=>football.act(s,'b','bid',{auction:1,amount:20}));
 football.act(s,'b','bid',{auction:1,amount:30});
 football.act(s,'a','pass',{auction:1});
 assert.equal(s.teams.b.budget,220);
 assert.equal(s.history[0].buyerId,'b');
 assert.equal(s.activeId,s.solo?'a':'b');
 assert.throws(()=>football.act(s,'a','bid',{auction:1,amount:40}));
 assert.ok(!('deck' in football.publicState(s)));
});
test('équipes complètes : 6 postes chacun, budgets positifs, 12 recrues uniques',()=>{
 for(let i=0;i<30;i++){
  const s=football.start(players,{budget:250});let actions=0;
  while(s.phase!=='finished'){
   assert.ok(actions++<30);
   if(s.solo)football.act(s,s.activeId,'recruit',{auction:s.auction});
   else if(!s.leaderId)football.act(s,s.activeId,'bid',{auction:s.auction,amount:football.publicState(s).limits[s.activeId]});
   else football.act(s,s.activeId,'pass',{auction:s.auction});
  }
  assert.equal(s.history.length,12);
  assert.equal(new Set(s.history.map(h=>h.player.id)).size,12);
  for(const team of Object.values(s.teams)){
   assert.equal(Object.keys(team.slots).length,6); assert.ok(team.budget>=0);
   assert.equal(team.budget+Object.values(team.slots).reduce((sum,p)=>sum+p.price,0),250);

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

test('recrutement libre : troisième DC malgré DC et Joker occupés',()=>{
 const s=football.start(players,{budget:250});
 s.teams.a.slots.DC={id:'dc1',position:'DC',price:1};
 s.teams.a.slots.Joker={id:'dc2',position:'DC',price:1};s.teams.a.budget=248;
 s.current={id:'dc3',position:'DC',name:'Troisième défenseur'};
 football.act(s,'a','bid',{auction:s.auction,amount:5});football.act(s,'b','pass',{auction:s.auction});
 assert.equal(Object.values(s.teams.a.slots).filter(p=>p.position==='DC').length,3);
 assert.equal(s.solo,false);
});
test('placements : coach au milieu, permutations, propriété et fin de partie',()=>{
 const s=football.start(players,{budget:250});
 s.teams.a.slots.Coach={id:'coach',position:'Coach',price:1};
 s.teams.a.slots.MC={id:'mid',position:'MC',price:2};
 const before=JSON.stringify({budget:s.teams.a.budget,auction:s.auction,active:s.activeId,history:s.history});
 football.act(s,'a','place',{playerId:'coach',slot:'MC'});
 assert.equal(s.teams.a.slots.MC.id,'coach');assert.equal(s.teams.a.slots.Coach.id,'mid');
 assert.throws(()=>football.act(s,'b','place',{playerId:'coach',slot:'GB'}));
 assert.throws(()=>football.act(s,'a','place',{playerId:'coach',slot:'fake'}));
 s.phase='finished';football.act(s,'a','place',{playerId:'coach',slot:'GB'});
 assert.equal(s.teams.a.slots.MC,undefined);assert.equal(s.teams.a.slots.GB.id,'coach');
 assert.equal(JSON.stringify({budget:s.teams.a.budget,auction:s.auction,active:s.activeId,history:s.history}),before);
});
test('catalogue : aucune personne en double',()=>{
 const s=football.start(players,{budget:250});const all=[s.current,...s.deck];
 const keys=all.map(p=>p.source?.id??p.name);
 assert.equal(new Set(keys).size,keys.length);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { chrono } from '../src/games/chrono/index.js';
import { createRoomStore } from '../src/rooms/store.js';
test('chrono : tours, précision, classement cumulatif et fin',()=>{
 const s=chrono.start([{id:'a'},{id:'b'}],{rounds:3,hidden:true});
 const totals={a:0,b:0};
 for(let round=1;round<=3;round++){
  assert.equal(s.round,round);assert.ok(s.targetMs>=3000&&s.targetMs<=10000);
  assert.deepEqual([...s.order].sort(),['a','b']);const target=s.targetMs;
  for(const id of [...s.order]){
   const p={round};assert.throws(()=>chrono.act(s,id,'stop',{...p,elapsedMs:10},0));
   assert.throws(()=>chrono.act(s,id==='a'?'b':'a','begin',p,0));
   chrono.act(s,id,'begin',p,0);
   assert.throws(()=>chrono.act(s,id,'begin',p,1));
   for(const elapsedMs of [-1,NaN,Infinity,30001,1.5])assert.throws(()=>chrono.act(s,id,'stop',{...p,elapsedMs},1));
   const delta=id==='a'?100:200;
   chrono.act(s,id,'stop',{...p,elapsedMs:target-delta},target);
   totals[id]+=delta;
  }
 }
 assert.equal(s.phase,'finished');assert.deepEqual(s.scores,totals);assert.equal(s.results.length,6);
 assert.equal(chrono.publicState(s).activeId,null);
 assert.throws(()=>chrono.act(s,'a','forfeit',{round:3}));
});
test('chrono : délai, abandon, validation et reprise de room',()=>{
 assert.throws(()=>chrono.start([{id:'a'}],{rounds:3,hidden:false}));
 assert.throws(()=>chrono.validateSettings({rounds:6,hidden:false}));
 const s=chrono.start([{id:'a'},{id:'b'}],{rounds:1,hidden:false});
 const first=s.order[0];chrono.act(s,first,'begin',{round:1},0);
 assert.equal(chrono.advance(s,29999),false);assert.equal(chrono.advance(s,30000),true);
 assert.equal(s.scores[first],30000);chrono.act(s,s.order[1],'forfeit',{round:1});assert.equal(s.phase,'finished');
 const store=createRoomStore();const a=store.create('a','Alice',{rounds:1,hidden:true},'chrono');
 const joined=store.join('x','Other',a.room.code,'football');
 assert.equal(joined.room.gameId,'chrono');
 store.join('b','Bob',a.room.code,'chrono');const started=store.start('a');
 assert.equal(started.room.gameId,'chrono');assert.deepEqual(started.deliveries,[]);
 store.disconnect('a');const resumed=store.resume('new-a',a.resumeToken);
 assert.equal(resumed.playerId,a.playerId);assert.equal(resumed.room.game.targetMs,started.room.game.targetMs);
 assert.equal(resumed.secret,null);
});

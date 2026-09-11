import test from 'node:test';
import assert from 'node:assert/strict';
import { matchPlayer, enrich } from '../scripts/football-import-utils.js';
const zidane = { idPlayer:'12345',strPlayer:'Zinedine Zidane',strSport:'Soccer',strPosition:'Manager',strNationality:'France',strThumb:'https://example.com/portrait.jpg',strCutout:'https://example.com/cutout.png' };
test('import : accents acceptés, homonymes et noms ambigus refusés',()=>{
 assert.equal(matchPlayer({name:'Zinédine Zidane'},[zidane]),zidane);
 assert.equal(matchPlayer({name:'Zinédine Zidane'},[zidane,{...zidane,idPlayer:'other'}]),null);
 assert.equal(matchPlayer({name:'Ronaldo'},[{...zidane,strPlayer:'Ronaldo'}]),null);
 assert.equal(matchPlayer({name:'Zinédine Zidane'},[{...zidane,strSport:'Basketball'}]),null);
 assert.equal(matchPlayer({name:'Ronaldo',source:{id:'12345'}},[zidane]),zidane);
});
test('import : poste de jeu et ID conservés, détourée prioritaire',()=>{
 const result=enrich({id:'MC-0',name:'Zinédine Zidane',position:'MC',photoUrl:null},zidane,'2026-09-11');
 assert.equal(result.position,'MC');assert.equal(result.id,'MC-0');
 assert.equal(result.source.position,'Manager');assert.equal(result.photoUrl,zidane.strCutout);
 const fallback=enrich({position:'Coach'},{...zidane,strCutout:'javascript:bad'},'now');
 assert.equal(fallback.photoUrl,zidane.strThumb);assert.equal(fallback.position,'Coach');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { matchingPairs } from '../src/games/undercover/catalog.js';
import { undercover } from '../src/games/undercover/index.js';
const settings=(categories,universes)=>({categories,universes,crossovers:true});
const ryuk=s=>matchingPairs(s).some(p=>p.word1==='Ryuk'&&p.word2==='Pomme');
test('Ryuk/Pomme : anime seul autorisé, nourriture seule exclue',()=>{
 assert.equal(ryuk(settings(['anime'],['death-note'])),true);
 assert.equal(ryuk(settings(['food'],['death-note'])),false);
 assert.equal(ryuk(settings(['anime','food'],['death-note'])),true);
 assert.equal(ryuk(settings(['anime'],[])),false);
});
test('crossovers : tous les univers et thèmes spécialisés requis',()=>{
 const has=s=>matchingPairs(s).some(p=>p.word1==='Saitama'&&p.word2==='Kratos');
 const s=settings(['anime','pop-culture'],['one-punch-man','god-of-war']);
 assert.equal(has(s),true);assert.equal(has({...s,categories:['anime']}),false);
 assert.equal(has({...s,universes:['one-punch-man']}),false);assert.equal(has({...s,crossovers:false}),false);
});
test('aucune paire : configuration possible, lancement refusé, options sans secrets',()=>{
 const s=undercover.validateSettings({...undercover.defaultSettings(),categories:['anime'],universes:[]});
 assert.equal(undercover.options(s).pairCount,0);
 assert.throws(()=>undercover.start([{id:'a'},{id:'b'},{id:'c'}],s),/Aucune paire/);
 assert.deepEqual(Object.keys(undercover.options(s)).sort(),['categories','pairCount','universes']);
});

import { randomInt } from 'node:crypto';
function round(s) {
  s.order=[...s.ids];
  for(let i=s.order.length-1;i>0;i--){const j=randomInt(i+1);[s.order[i],s.order[j]]=[s.order[j],s.order[i]];}
  s.index=0;s.targetMs=randomInt(3,11)*1000;s.phase='ready';s.deadline=null;
}
function record(s,elapsedMs) {
  const playerId=s.order[s.index];const errorMs=elapsedMs===null?30000:Math.abs(elapsedMs-s.targetMs);
  s.results.push({round:s.round,playerId,elapsedMs,targetMs:s.targetMs,errorMs});s.scores[playerId]+=errorMs;
  s.index++;s.deadline=null;
  if(s.index<s.order.length)s.phase='ready';
  else if(s.round<s.settings.rounds){s.round++;round(s);}
  else s.phase='finished';
}
export const chrono={
  defaultSettings:()=>({rounds:3,hidden:false}),options:()=>({}),
  validateSettings(input){
    if(!Number.isInteger(input?.rounds)||input.rounds<1||input.rounds>5||typeof input.hidden!=='boolean')throw new Error('Choisissez 1 à 5 manches et un mode valide.');
    return {rounds:input.rounds,hidden:input.hidden};
  },
  start(players,input){
    if(players.length<2)throw new Error('Il faut au moins 2 joueurs.');
    const s={settings:chrono.validateSettings(input),ids:players.map(p=>p.id),round:1,results:[],scores:Object.fromEntries(players.map(p=>[p.id,0]))};round(s);return s;
  },
  publicState(s){return structuredClone({round:s.round,phase:s.phase,targetMs:s.targetMs,order:s.order,activeId:s.phase==='finished'?null:s.order[s.index],scores:s.scores,results:s.results,deadline:s.deadline});},
  act(s,id,action,p,now=Date.now()){
    if(s.phase==='finished'||id!==s.order[s.index]||p?.round!==s.round)throw new Error('Ce n’est pas votre tour.');
    if(action==='begin'){
      if(s.phase!=='ready')throw new Error('L’essai a déjà commencé.');
      s.phase='running';s.deadline=now+30000;
    }else if(action==='stop'){
      if(s.phase!=='running'||now>=s.deadline)throw new Error('Aucun essai actif.');
      if(!Number.isInteger(p.elapsedMs)||p.elapsedMs<0||p.elapsedMs>30000)throw new Error('Durée invalide.');
      record(s,p.elapsedMs);
    }else if(action==='forfeit'){
      record(s,null);
    }else throw new Error('Action inconnue.');
  },
  advance(s,now=Date.now()){
    if(s.phase==='running'&&now>=s.deadline){record(s,null);return true;}return false;
  },
};

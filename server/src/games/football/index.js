import { readFileSync } from 'node:fs';
import { randomInt } from 'node:crypto';
const catalog = JSON.parse(readFileSync(new URL('./data/players.json', import.meta.url), 'utf8'));
const slots = ['GB','DC','MC','ATT','Joker'];
function slotFor(team, player) {
  return slots.find(slot => slot === player.position && !team[slot]) ?? (!team.Joker ? 'Joker' : null);
}
function limit(team) { const empty = slots.filter(slot => !team.slots[slot]).length; return empty ? team.budget - (empty - 1) : 0; }
function offer(s) {
  if (s.ids.every(id => slots.every(slot => s.teams[id].slots[slot]))) {
    s.phase = 'finished'; s.current = null; s.activeId = null; return;
  }
  const index = s.deck.findIndex(player => s.ids.some(id => slotFor(s.teams[id].slots,player)));
  if (index < 0) throw new Error('Le catalogue ne permet pas de compléter les équipes.');
  s.current = s.deck.splice(index,1)[0]; s.auction++; s.price=0; s.leaderId=null;
  const eligible=s.ids.filter(id => slotFor(s.teams[id].slots,s.current));
  s.activeId = eligible.includes(s.ids[(s.auction-1)%2]) ? s.ids[(s.auction-1)%2] : eligible[0];
  s.solo = eligible.length === 1;
  if (s.solo && s.ids.some(id => slots.every(slot => s.teams[id].slots[slot]))) award(s,eligible[0],1);
}
function award(s,id,price) {
  const slot=slotFor(s.teams[id].slots,s.current);
  s.teams[id].slots[slot]={...s.current,price}; s.teams[id].budget-=price;
  s.history.push({auction:s.auction,player:{...s.current},buyerId:id,price,slot});
  offer(s);
}
export const football = {
  maxPlayers: 2,
  defaultSettings: () => ({budget:250}),
  options: () => ({slots}),
  validateSettings(input) {
    if (input?.budget !== 250) throw new Error('Le budget de ce duel est de 250 € par joueur.');
    return {budget:input.budget};
  },
  start(players,input) {
    if (players.length !== 2) throw new Error('Le duel demande exactement 2 joueurs.');
    const settings=football.validateSettings(input);
    const deck=structuredClone(catalog);
    for(let i=deck.length-1;i>0;i--) {const j=randomInt(i+1);[deck[i],deck[j]]=[deck[j],deck[i]];}
    const ids=players.map(p=>p.id);
    const state={ids,deck,phase:'auction',auction:0,current:null,price:0,leaderId:null,activeId:null,
      teams:Object.fromEntries(ids.map(id=>[id,{budget:settings.budget,slots:{}}])),history:[]};
    offer(state); return state;
  },
  publicState(s) {
    return structuredClone({phase:s.phase,auction:s.auction,current:s.current,price:s.price,leaderId:s.leaderId,activeId:s.activeId,solo:s.solo,
      teams:s.teams,history:s.history,limits:Object.fromEntries(s.ids.map(id=>[id,limit(s.teams[id])]))});
  },
  advance: () => false,
  act(s,id,action,payload) {
    if(s.phase==='finished') throw new Error('Le recrutement est terminé.');
    if(payload?.auction!==s.auction) throw new Error('Cette enchère est terminée.');
    if(id!==s.activeId) throw new Error('Ce n’est pas votre tour.');
    if(s.solo) {
      if(action==='recruit') award(s,id,1);
      else if(action==='pass') { s.deck.push(s.current); offer(s); }
      else throw new Error('Choisissez Recruter pour 1 € ou Passer.');
      return;
    }
    if(action==='bid') {
      const amount=payload.amount;
      if(!Number.isInteger(amount)||amount<=s.price||amount>limit(s.teams[id])) throw new Error('Mise invalide : surenchérissez en gardant 1 € par place restante.');
      s.price=amount;s.leaderId=id;s.activeId=s.ids.find(other=>other!==id);
    } else if(action==='pass') {
      if(!s.leaderId) throw new Error('Le premier joueur doit ouvrir l’enchère.');
      award(s,s.leaderId,s.price);
    } else throw new Error('Action inconnue.');
  },
};

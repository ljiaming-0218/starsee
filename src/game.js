export const WIDTH = 1000, HEIGHT = 650;
export const PATH = [{x:-30,y:125},{x:775,y:125},{x:775,y:325},{x:225,y:325},{x:225,y:525},{x:1030,y:525}];
export const TYPES = {
 arrow:{name:'游侠箭塔',en:'RANGER',cost:80,range:155,damage:18,interval:.65,color:'#69834b',desc:'精准而迅捷的森林守卫。射程均衡，适合持续打击单个敌人。'},
 cannon:{name:'重装炮塔',en:'BOMBARDEER',cost:140,range:135,damage:44,interval:1.65,color:'#ba7951',desc:'一发炮弹，击退一群来敌。对目标周围的敌人造成范围伤害。'},
 frost:{name:'冰霜法塔',en:'FROSTKEEPER',cost:120,range:145,damage:9,interval:.95,color:'#74aeb7',desc:'以冰霜减缓敌人的脚步。命中后减速 45%，持续 2 秒。'}
};
export const TOTAL_WAVES=10;
const segments=PATH.slice(1).map((p,i)=>Math.hypot(p.x-PATH[i].x,p.y-PATH[i].y));
export const pathLength=segments.reduce((a,b)=>a+b,0);
export function positionAt(d){for(let i=0;i<segments.length;i++){if(d<=segments[i]){const t=d/segments[i];return {x:PATH[i].x+(PATH[i+1].x-PATH[i].x)*t,y:PATH[i].y+(PATH[i+1].y-PATH[i].y)*t};}d-=segments[i];}return PATH.at(-1);}
export function onPath(x,y){return PATH.slice(1).some((p,i)=>{const a=PATH[i];return x>=Math.min(a.x,p.x)-34&&x<=Math.max(a.x,p.x)+34&&y>=Math.min(a.y,p.y)-34&&y<=Math.max(a.y,p.y)+34;});}
export function initialGame(){return {gold:240,lives:20,wave:0,kills:0,towers:[],enemies:[],shots:[],particles:[],phase:'ready',spawned:0,spawnTimer:0,id:1,time:0};}
export function waveCount(w){return 7+w*3;}
export function startWave(g){if(g.phase!=='ready'||g.wave>=TOTAL_WAVES)return false;g.wave++;g.phase='battle';g.spawned=0;g.spawnTimer=0;return true;}
export function canPlace(g,x,y){return x>=35&&x<=965&&y>=40&&y<=610&&!onPath(x,y)&&!g.towers.some(t=>Math.hypot(t.x-x,t.y-y)<55);}
export function placeTower(g,type,x,y){if(!TYPES[type]||g.gold<TYPES[type].cost||!canPlace(g,x,y)||['won','lost'].includes(g.phase))return null;const t={id:g.id++,type,x,y,damageLevel:0,speedLevel:0,cooldown:0,angle:0,invested:TYPES[type].cost};g.gold-=TYPES[type].cost;g.towers.push(t);return t;}
export function upgradeCost(t,kind){return Math.round(TYPES[t.type].cost*.65*(1+t[kind+'Level']*.65));}
export function upgrade(g,id,kind){const t=g.towers.find(t=>t.id===id);if(!t||!['damage','speed'].includes(kind)||t[kind+'Level']>=3||g.gold<upgradeCost(t,kind))return false;const cost=upgradeCost(t,kind);g.gold-=cost;t.invested+=cost;t[kind+'Level']++;return true;}
export function sell(g,id){const t=g.towers.find(t=>t.id===id);if(!t)return;g.gold+=Math.floor(t.invested*.7);g.towers=g.towers.filter(t=>t.id!==id);}
export function tick(g,dt){for(const s of g.shots)s.life-=dt;g.shots=g.shots.filter(s=>s.life>0);for(const p of g.particles){p.life-=dt;p.y-=dt*25;}g.particles=g.particles.filter(p=>p.life>0);if(g.phase!=='battle')return;g.time+=dt;g.spawnTimer-=dt;
 if(g.spawned<waveCount(g.wave)&&g.spawnTimer<=0){const boss=g.wave%5===0&&g.spawned===waveCount(g.wave)-1;const fast=g.spawned%4===2;const hp=(45+g.wave*24)*Math.pow(1.13,g.wave-1)*(boss?8:fast?.7:1);g.enemies.push({id:g.id++,distance:0,x:-30,y:125,hp,maxHp:hp,speed:(fast?72:43)+g.wave*2,boss,fast,reward:boss?70:12+g.wave,slow:0,hit:0});g.spawned++;g.spawnTimer=.72;}
 for(const e of g.enemies){e.slow=Math.max(0,e.slow-dt);e.hit=Math.max(0,e.hit-dt);e.distance+=e.speed*(e.slow>0?.55:1)*dt;Object.assign(e,positionAt(e.distance));if(e.distance>=pathLength){e.escaped=true;g.lives=Math.max(0,g.lives-(e.boss?4:1));}}
 for(const t of g.towers){t.cooldown-=dt;const def=TYPES[t.type];const target=g.enemies.filter(e=>!e.escaped&&e.hp>0&&Math.hypot(t.x-e.x,t.y-e.y)<=def.range).sort((a,b)=>b.distance-a.distance)[0];if(target){t.angle=Math.atan2(target.y-t.y,target.x-t.x);if(t.cooldown<=0){t.cooldown=def.interval/Math.pow(1.28,t.speedLevel);const dmg=def.damage*Math.pow(1.48,t.damageLevel);const victims=t.type==='cannon'?g.enemies.filter(e=>!e.escaped&&Math.hypot(e.x-target.x,e.y-target.y)<65):[target];for(const e of victims){e.hp-=dmg;e.hit=.12;if(t.type==='frost')e.slow=2;}g.shots.push({x:t.x,y:t.y-12,tx:target.x,ty:target.y,life:.22,max:.22,type:t.type});}}}
 for(const e of g.enemies)if(e.hp<=0&&!e.escaped){g.gold+=e.reward;g.kills++;g.particles.push({x:e.x,y:e.y,text:'+'+e.reward,life:.9});}
 g.enemies=g.enemies.filter(e=>e.hp>0&&!e.escaped);
 if(g.lives<=0){g.phase='lost';return;}if(g.spawned>=waveCount(g.wave)&&!g.enemies.length){g.gold+=35+g.wave*5;g.phase=g.wave===TOTAL_WAVES?'won':'ready';}
}

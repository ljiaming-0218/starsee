import {
  TYPES,
  ENEMIES,
  SPECIALIZATIONS,
  TOTAL_WAVES,
  DIFFICULTIES,
  SPELLS,
  wavePlan,
} from "./content.js";
export { TYPES, TOTAL_WAVES } from "./content.js";
export const WIDTH = 1000,
  HEIGHT = 650;
export const PATH = [
  { x: -30, y: 119 },
  { x: 755, y: 119 },
  { x: 755, y: 292 },
  { x: 230, y: 292 },
  { x: 230, y: 484 },
  { x: 1030, y: 484 },
];
const segments = PATH.slice(1).map((p, i) =>
  Math.hypot(p.x - PATH[i].x, p.y - PATH[i].y),
);
export const pathLength = segments.reduce((a, b) => a + b, 0);
export function positionAt(distance) {
  let d = Math.max(0, distance);
  for (let i = 0; i < segments.length; i++) {
    if (d <= segments[i]) {
      const t = d / segments[i];
      return {
        x: PATH[i].x + (PATH[i + 1].x - PATH[i].x) * t,
        y: PATH[i].y + (PATH[i + 1].y - PATH[i].y) * t,
      };
    }
    d -= segments[i];
  }
  return { ...PATH.at(-1) };
}
export function onPath(x, y, margin = 36) {
  return PATH.slice(1).some((p, i) => {
    const a = PATH[i];
    return (
      x >= Math.min(a.x, p.x) - margin &&
      x <= Math.max(a.x, p.x) + margin &&
      y >= Math.min(a.y, p.y) - margin &&
      y <= Math.max(a.y, p.y) + margin
    );
  });
}
export function initialGame(difficulty = "normal") {
  if (!DIFFICULTIES[difficulty]) difficulty = "normal";
  const maxLives = DIFFICULTIES[difficulty].lives;
  return {
    version: 2,
    difficulty,
    maxLives,
    lives: maxLives,
    gold: 320,
    wave: 0,
    kills: 0,
    score: 0,
    towers: [],
    enemies: [],
    shots: [],
    particles: [],
    effects: [],
    phase: "ready",
    spawned: 0,
    spawnTimer: 0,
    id: 1,
    time: 0,
    visualTime: 0,
    spellCooldowns: { meteor: 0, heal: 0 },
    combo: 0,
    comboTimer: 0,
    banner: "",
    bannerTime: 0,
    damageDealt: 0,
  };
}
export function waveCount(w) {
  return wavePlan(w).length;
}
export function startWave(g) {
  if (g.phase !== "ready" || g.wave >= TOTAL_WAVES) return false;
  g.wave++;
  g.phase = "battle";
  g.spawned = 0;
  g.spawnTimer = 0;
  g.banner = `第 ${g.wave} 波`;
  g.bannerTime = 2.2;
  return true;
}
// Keep the tiny landmark footprints free while the rest of the grass remains buildable.
export function canPlace(g, x, y) {
  return (
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 265 &&
    x <= 725 &&
    ((y >= 170 && y <= 250) || (y >= 345 && y <= 440)) &&
    !onPath(x, y) &&
    Math.hypot(x - 500, y - 195) > 48 &&
    Math.hypot(x - 590, y - 395) > 52 &&
    !g.towers.some((t) => Math.hypot(t.x - x, t.y - y) < 61)
  );
}
export function placeTower(g, type, x, y) {
  if (
    !TYPES[type] ||
    g.gold < TYPES[type].cost ||
    !canPlace(g, x, y) ||
    ["won", "lost"].includes(g.phase)
  )
    return null;
  const t = {
    id: g.id++,
    type,
    x,
    y,
    damageLevel: 0,
    speedLevel: 0,
    cooldown: 0,
    angle: 0,
    invested: TYPES[type].cost,
    priority: "first",
    specialization: null,
    shots: 0,
    kills: 0,
    damageDealt: 0,
    recoil: 0,
  };
  g.gold -= TYPES[type].cost;
  g.towers.push(t);
  g.effects.push({ type: "build", x, y, life: 0.7, max: 0.7 });
  return t;
}
export function towerStats(t) {
  const d = TYPES[t.type];
  return {
    ...d,
    damage:
      d.damage *
      Math.pow(1.42, t.damageLevel) *
      (t.specialization === "sniper"
        ? 1.45
        : t.specialization === "siege"
          ? 1.25
          : 1),
    range: d.range + (t.specialization === "sniper" ? 60 : 0),
    interval: d.interval / Math.pow(1.25, t.speedLevel),
    radius: t.specialization === "siege" ? 112 : 67,
    chain: t.specialization === "chain" ? 5 : 3,
  };
}
export function upgradeCost(t, kind) {
  return Math.round(TYPES[t.type].cost * 0.65 * (1 + t[kind + "Level"] * 0.65));
}
export function upgrade(g, id, kind) {
  const t = g.towers.find((t) => t.id === id);
  if (
    !t ||
    !["damage", "speed"].includes(kind) ||
    ["won", "lost"].includes(g.phase) ||
    t[kind + "Level"] >= 3 ||
    g.gold < upgradeCost(t, kind)
  )
    return false;
  const cost = upgradeCost(t, kind);
  g.gold -= cost;
  t.invested += cost;
  t[kind + "Level"]++;
  g.effects.push({ type: "build", x: t.x, y: t.y, life: 0.6, max: 0.6 });
  return true;
}
export function specialize(g, id, spec) {
  const t = g.towers.find((t) => t.id === id),
    s = t && SPECIALIZATIONS[t.type].find((s) => s.id === spec);
  if (
    !s ||
    t.specialization ||
    t.damageLevel + t.speedLevel < 4 ||
    g.gold < s.cost ||
    ["won", "lost"].includes(g.phase)
  )
    return false;
  g.gold -= s.cost;
  t.invested += s.cost;
  t.specialization = spec;
  g.effects.push({ type: "build", x: t.x, y: t.y, life: 1, max: 1 });
  return true;
}
export function setPriority(g, id, priority) {
  const t = g.towers.find((t) => t.id === id);
  if (!t || !["first", "strong", "close"].includes(priority)) return false;
  t.priority = priority;
  return true;
}
export function sell(g, id) {
  const t = g.towers.find((t) => t.id === id);
  if (!t || ["won", "lost"].includes(g.phase)) return false;
  g.gold += Math.floor(t.invested * 0.7);
  g.towers = g.towers.filter((t) => t.id !== id);
  return true;
}
export function selectTarget(t, enemies) {
  const stats = towerStats(t);
  const targets = enemies.filter(
    (e) =>
      e.hp > 0 && !e.escaped && Math.hypot(e.x - t.x, e.y - t.y) <= stats.range,
  );
  return targets.sort((a, b) =>
    t.priority === "strong"
      ? b.hp - a.hp
      : t.priority === "close"
        ? Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y)
        : b.distance - a.distance,
  )[0];
}
export function makeEnemy(g, type, distance = 0) {
  const def = ENEMIES[type],
    hp =
      (48 + g.wave * 19) *
      Math.pow(1.105, Math.max(0, g.wave - 1)) *
      def.hp *
      DIFFICULTIES[g.difficulty].hp;
  return {
    id: g.id++,
    type,
    ...positionAt(distance),
    distance,
    hp,
    maxHp: hp,
    speed: def.speed + g.wave * 0.6,
    reward: def.reward,
    boss: type === "boss",
    slow: 0,
    slowStrength: 0,
    hit: 0,
    burn: 0,
    burnDps: 0,
    burnOwner: null,
    vulnerable: 0,
    escaped: false,
  };
}
export function damageEnemy(g, e, amount, type, owner = null) {
  if (!e || e.hp <= 0 || e.escaped) return 0;
  const def = ENEMIES[e.type];
  let damage = amount;
  if (type === "arrow") damage *= 1 - def.armor;
  else if (type === "cannon") damage *= 1 - def.armor * 0.35;
  else damage *= 1 - def.magicResist;
  if (e.vulnerable > 0) damage *= 1.3;
  const actual = Math.min(e.hp, damage);
  e.hp -= damage;
  e.hit = 0.15;
  g.damageDealt += actual;
  const t = g.towers.find((t) => t.id === owner);
  if (t) t.damageDealt += actual;
  if (e.hp <= 0) e.killedBy = owner;
  return actual;
}
function collectKills(g) {
  for (const e of g.enemies)
    if (e.hp <= 0 && !e.escaped && !e.rewarded) {
      e.rewarded = true;
      g.gold += e.reward;
      g.kills++;
      g.combo++;
      g.comboTimer = 2;
      g.score += e.reward * 10;
      const t = g.towers.find((t) => t.id === e.killedBy);
      if (t) t.kills++;
      g.particles.push({
        x: e.x,
        y: e.y - 10,
        text: `+${e.reward}`,
        life: 0.9,
        max: 0.9,
        color: "#f3d58a",
      });
      g.effects.push({
        type: "death",
        x: e.x,
        y: e.y,
        life: 0.4,
        max: 0.4,
        color: ENEMIES[e.type].color,
      });
    }
  g.enemies = g.enemies.filter((e) => e.hp > 0 && !e.escaped);
}
export function castSpell(g, type, point = null) {
  if (!SPELLS[type] || g.phase !== "battle" || g.spellCooldowns[type] > 0)
    return false;
  if (type === "heal") {
    if (g.lives >= g.maxLives) return false;
    g.lives = Math.min(g.maxLives, g.lives + 4);
    g.effects.push({ type: "heal", x: 940, y: 484, life: 1.3, max: 1.3 });
  } else {
    if (!point || point.x < 0 || point.x > 1000 || point.y < 0 || point.y > 650)
      return false;
    g.effects.push({ type: "meteor", ...point, life: 1.2, max: 1.2 });
    for (const e of g.enemies)
      if (Math.hypot(e.x - point.x, e.y - point.y) < 115)
        damageEnemy(g, e, 350 + g.wave * 14, "meteor");
    collectKills(g);
  }
  g.spellCooldowns[type] = SPELLS[type].cooldown;
  return true;
}
function impact(g, s) {
  const target = g.enemies.find(
    (e) => e.id === s.target && e.hp > 0 && !e.escaped,
  );
  const x = target?.x ?? s.tx,
    y = target?.y ?? s.ty;
  if (s.type === "cannon") {
    for (const e of g.enemies)
      if (Math.hypot(e.x - x, e.y - y) < s.radius) {
        damageEnemy(g, e, s.damage, "cannon", s.owner);
        if (s.spec === "burn") {
          e.burn = 3;
          e.burnDps = s.damage * 0.2;
          e.burnOwner = s.owner;
        }
      }
    g.effects.push({
      type: "explosion",
      x,
      y,
      life: 0.55,
      max: 0.55,
      radius: s.radius,
    });
  } else if (target) {
    damageEnemy(g, target, s.damage, s.type, s.owner);
    if (s.type === "frost") {
      target.slow = s.spec === "glacier" ? 3 : 2;
      target.slowStrength = s.spec === "glacier" ? 0.7 : 0.45;
      if (s.spec === "brittle") target.vulnerable = 3;
    }
    g.effects.push({
      type: s.type === "frost" ? "ice" : "spark",
      x,
      y,
      life: 0.35,
      max: 0.35,
    });
  }
}
function attack(g, t, target) {
  const stats = towerStats(t);
  t.cooldown = stats.interval;
  t.recoil = 0.2;
  t.shots++;
  t.angle = Math.atan2(target.y - t.y, target.x - t.x);
  if (t.type === "storm") {
    const struck = [];
    let current = target,
      previous = { x: t.x, y: t.y - 35 };
    for (let n = 0; n < stats.chain && current; n++) {
      struck.push(current.id);
      damageEnemy(
        g,
        current,
        stats.damage *
          Math.pow(0.78, n) *
          (n === 0 && t.specialization === "overload" ? 2 : 1),
        "storm",
        t.id,
      );
      g.effects.push({
        type: "lightning",
        x: previous.x,
        y: previous.y,
        tx: current.x,
        ty: current.y,
        life: 0.25,
        max: 0.25,
      });
      previous = current;
      current = g.enemies
        .filter(
          (e) =>
            e.hp > 0 &&
            !e.escaped &&
            !struck.includes(e.id) &&
            Math.hypot(e.x - previous.x, e.y - previous.y) < 110,
        )
        .sort(
          (a, b) =>
            Math.hypot(a.x - previous.x, a.y - previous.y) -
            Math.hypot(b.x - previous.x, b.y - previous.y),
        )[0];
    }
    return;
  }
  let targets = [target];
  if (t.specialization === "volley")
    targets = [
      target,
      ...g.enemies
        .filter(
          (e) =>
            e !== target &&
            e.hp > 0 &&
            !e.escaped &&
            Math.hypot(e.x - t.x, e.y - t.y) < stats.range,
        )
        .sort((a, b) => b.distance - a.distance)
        .slice(0, 2),
    ];
  for (const e of targets) {
    const duration =
      t.type === "cannon" ? 0.48 : t.type === "frost" ? 0.27 : 0.18;
    g.shots.push({
      type: t.type,
      owner: t.id,
      target: e.id,
      x: t.x,
      y: t.y - 36,
      tx: e.x,
      ty: e.y,
      damage: stats.damage,
      radius: stats.radius,
      spec: t.specialization,
      age: 0,
      duration,
    });
  }
}
export function tick(g, dt) {
  dt = Math.min(Math.max(dt, 0), 0.15);
  g.visualTime += dt;
  for (const effect of g.effects) effect.life -= dt;
  g.effects = g.effects.filter((e) => e.life > 0);
  for (const p of g.particles) {
    p.life -= dt;
    p.y -= dt * 25;
  }
  g.particles = g.particles.filter((p) => p.life > 0);
  g.bannerTime = Math.max(0, g.bannerTime - dt);
  if (g.phase !== "battle") return;
  g.time += dt;
  g.spawnTimer -= dt;
  for (const key of Object.keys(g.spellCooldowns))
    g.spellCooldowns[key] = Math.max(0, g.spellCooldowns[key] - dt);
  g.comboTimer = Math.max(0, g.comboTimer - dt);
  if (!g.comboTimer) g.combo = 0;
  const plan = wavePlan(g.wave);
  if (g.spawned < plan.length && g.spawnTimer <= 0) {
    const type = plan[g.spawned];
    g.enemies.push(makeEnemy(g, type));
    g.spawned++;
    g.spawnTimer =
      type === "boss" ? 2.1 : Math.max(0.38, 0.78 - g.wave * 0.024);
    if (type === "boss") {
      g.banner = "巨像来袭";
      g.bannerTime = 2.5;
    }
  }
  for (const e of g.enemies) {
    if (e.hp <= 0) continue;
    e.slow = Math.max(0, e.slow - dt);
    e.hit = Math.max(0, e.hit - dt);
    e.vulnerable = Math.max(0, e.vulnerable - dt);
    if (e.burn > 0) {
      e.burn = Math.max(0, e.burn - dt);
      damageEnemy(g, e, e.burnDps * dt, "burn", e.burnOwner);
    }
    if (e.hp <= 0) continue;
    e.distance +=
      e.speed * (e.slow > 0 ? 1 - e.slowStrength * (e.boss ? 0.5 : 1) : 1) * dt;
    Object.assign(e, positionAt(e.distance));
    if (e.distance >= pathLength) {
      e.escaped = true;
      g.lives = Math.max(0, g.lives - (e.boss ? 5 : 1));
      g.effects.push({ type: "leak", x: 965, y: 484, life: 0.7, max: 0.7 });
    }
  }
  for (const shaman of g.enemies)
    if (shaman.type === "shaman" && shaman.hp > 0 && !shaman.escaped)
      for (const e of g.enemies)
        if (
          e.hp > 0 &&
          !e.escaped &&
          e !== shaman &&
          Math.hypot(e.x - shaman.x, e.y - shaman.y) < 95
        )
          e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.016 * dt);
  for (const t of g.towers) {
    t.cooldown -= dt;
    t.recoil = Math.max(0, t.recoil - dt);
    const target = selectTarget(t, g.enemies);
    if (target && t.cooldown <= 0) attack(g, t, target);
  }
  for (const s of g.shots) {
    s.age += dt;
    const target = g.enemies.find(
      (e) => e.id === s.target && e.hp > 0 && !e.escaped,
    );
    if (target) {
      s.tx = target.x;
      s.ty = target.y;
    }
    if (s.age >= s.duration) impact(g, s);
  }
  g.shots = g.shots.filter((s) => s.age < s.duration);
  collectKills(g);
  if (g.lives <= 0) {
    g.phase = "lost";
    g.shots = [];
    g.bannerTime = 0;
    return;
  }
  if (g.spawned >= plan.length && !g.enemies.length) {
    const bonus = 50 + g.wave * 7;
    g.gold += bonus;
    g.score += bonus * 10;
    g.phase = g.wave === TOTAL_WAVES ? "won" : "ready";
    g.banner = `第 ${g.wave} 波已守住`;
    g.bannerTime = 2.8;
    g.shots = [];
  }
}
export function starRating(g) {
  return g.lives / g.maxLives >= 0.9 ? 3 : g.lives / g.maxLives >= 0.5 ? 2 : 1;
}

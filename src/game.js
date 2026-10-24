import { getLevel, levelWaveCount, levelPathLength, LEVELS } from "./levels.js";
import {
  TYPES,
  ENEMIES,
  SPECIALIZATIONS,
  TOTAL_WAVES,
  DIFFICULTIES,
  SPELLS,
  wavePlan,
  isSupport,
} from "./content.js";
export { TYPES, TOTAL_WAVES } from "./content.js";
export const WIDTH = 1000,
  HEIGHT = 650;
export const PATH = LEVELS.forest.path;
export const pathLength = levelPathLength("forest");
const geometry = Object.fromEntries(
  Object.entries(LEVELS).map(([id, l]) => [
    id,
    l.path
      .slice(1)
      .map((p, i) => Math.hypot(p.x - l.path[i].x, p.y - l.path[i].y)),
  ]),
);
export function positionAt(distance, level = "forest") {
  const l = getLevel(level),
    segments = geometry[l.id];
  let d = Math.max(0, distance);
  for (let i = 0; i < segments.length; i++) {
    if (d <= segments[i]) {
      const t = d / segments[i];
      return {
        x: l.path[i].x + (l.path[i + 1].x - l.path[i].x) * t,
        y: l.path[i].y + (l.path[i + 1].y - l.path[i].y) * t,
      };
    }
    d -= segments[i];
  }
  return { ...l.path.at(-1) };
}
export function onPath(x, y, margin = 36, level = "forest") {
  const path = getLevel(level).path;
  return path.slice(1).some((p, i) => {
    const a = path[i];
    return (
      x >= Math.min(a.x, p.x) - margin &&
      x <= Math.max(a.x, p.x) + margin &&
      y >= Math.min(a.y, p.y) - margin &&
      y <= Math.max(a.y, p.y) + margin
    );
  });
}
export function initialGame(difficulty = "normal", level = "forest") {
  if (!DIFFICULTIES[difficulty]) difficulty = "normal";
  const maxLives = DIFFICULTIES[difficulty].lives;
  return {
    version: 5,
    level: getLevel(level).id,
    difficulty,
    maxLives,
    lives: maxLives,
    gold: getLevel(level).gold,
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
    buildingsLost: 0,
    raidAlert: "",
    raidAlertTime: 0,
  };
}
export function waveCount(w, level) {
  return wavePlan(w, level).length;
}
export function startWave(g) {
  if (g.phase !== "ready" || g.wave >= levelWaveCount(g.level)) return false;
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
  const l = getLevel(g.level);
  return (
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    l.areas.some((a) => x >= a.x1 && x <= a.x2 && y >= a.y1 && y <= a.y2) &&
    !onPath(x, y, 36, l.id) &&
    !l.obstacles.some((o) => Math.hypot(x - o.x, y - o.y) <= o.r) &&
    !g.towers.some((t) => Math.hypot(t.x - x, t.y - y) < 61)
  );
}
export const BUILDING_SPRITE_SIZE = 80;
export function buildingAt(g, point) {
  return (
    [...g.towers]
      .sort((a, b) => b.y - a.y)
      .find(
        (t) =>
          t.hp > 0 &&
          point.x >= t.x - 36 &&
          point.x <= t.x + 36 &&
          point.y >= t.y - 66 &&
          point.y <= t.y + 15,
      ) || null
  );
}
export function snapPlot(point) {
  return {
    x: Math.round((point.x - 25) / 50) * 50 + 25,
    y: Math.round((point.y - 25) / 50) * 50 + 25,
  };
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
    hp: TYPES[type].hp,
    maxHp: TYPES[type].hp,
    hit: 0,
    healingDone: 0,
    damageAbsorbed: 0,
  };
  g.gold -= TYPES[type].cost;
  g.towers.push(t);
  g.effects.push({ type: "build", x, y, life: 0.7, max: 0.7 });
  return t;
}
export function towerStats(t, g = null) {
  const d = TYPES[t.type];
  const stats = {
    ...d,
    damage:
      d.damage *
      Math.pow(1.42, t.damageLevel) *
      (t.specialization === "sniper"
        ? 1.45
        : t.specialization === "siege"
          ? 1.25
          : t.specialization === "molten"
            ? 1.6
            : 1),
    range:
      d.range +
      (t.specialization === "sniper"
        ? 60
        : t.specialization === "rail"
          ? 45
          : t.specialization === "wide"
            ? 70
            : t.specialization === "firestorm"
              ? 40
              : 0),
    interval: d.interval / Math.pow(1.25, t.speedLevel),
    radius: t.specialization === "siege" ? 112 : 67,
    chain: t.specialization === "chain" ? 5 : 3,
    auraDamage:
      0.2 +
      t.damageLevel * 0.08 +
      (t.specialization === "warbanner" ? 0.15 : 0),
    auraRate: 0.15 + t.speedLevel * 0.06,
    healing:
      d.damage *
      Math.pow(1.42, t.damageLevel) *
      (t.specialization === "sanctuary" ? 1.5 : 1),
    maxHp:
      d.hp +
      (t.type === "bulwark" ? t.damageLevel * 180 : 0) +
      (t.specialization === "bastion" ? 450 : 0),
    selfHeal: t.specialization === "mending" ? 28 : 8,
  };
  if (t.specialization === "sanctuary") stats.range += 55;
  if (t.specialization === "bastion") stats.range += 45;
  if (g && !isSupport(t.type)) {
    let damageBuff = 0,
      speedBuff = 0;
    for (const b of g.towers)
      if (b.type === "beacon") {
        const aura = towerStats(b);
        if (Math.hypot(t.x - b.x, t.y - b.y) <= aura.range) {
          damageBuff = Math.max(damageBuff, aura.auraDamage);
          speedBuff = Math.max(speedBuff, aura.auraRate);
        }
      }
    stats.damage *= 1 + damageBuff;
    stats.interval /= 1 + speedBuff;
    stats.buffed = damageBuff > 0;
  }
  return stats;
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
  const nextMax = towerStats(t).maxHp;
  t.hp += nextMax - t.maxHp;
  t.maxHp = nextMax;
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
  const nextMax = towerStats(t).maxHp;
  t.hp += nextMax - t.maxHp;
  t.maxHp = nextMax;
  g.effects.push({ type: "build", x: t.x, y: t.y, life: 1, max: 1 });
  return true;
}
export function setPriority(g, id, priority) {
  const t = g.towers.find((t) => t.id === id);
  if (
    !t ||
    isSupport(t.type) ||
    !["first", "strong", "close"].includes(priority)
  )
    return false;
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
export function repairCost(t) {
  return Math.ceil(Math.max(0, t.maxHp - t.hp) * 0.12);
}
export function repairTower(g, id) {
  const t = g.towers.find((t) => t.id === id);
  if (!t || t.hp <= 0 || t.hp >= t.maxHp || ["won", "lost"].includes(g.phase))
    return false;
  const cost = repairCost(t);
  if (g.gold < cost) return false;
  g.gold -= cost;
  t.hp = t.maxHp;
  g.effects.push({ type: "repair", x: t.x, y: t.y - 30, life: 0.7, max: 0.7 });
  return true;
}
function healBuilding(g, source, target, amount) {
  const healed = Math.min(target.maxHp - target.hp, amount);
  if (healed <= 0 || target.hp <= 0) return;
  target.hp += healed;
  source.healingDone += healed;
  g.effects.push({
    type: "mend",
    x: source.x,
    y: source.y - 35,
    tx: target.x,
    ty: target.y - 30,
    life: 0.5,
    max: 0.5,
  });
}
// A single closest shell guard shares a hit; redirected damage cannot recurse.
export function damageBuilding(g, target, amount) {
  if (
    !target ||
    target.hp <= 0 ||
    !g.towers.includes(target) ||
    !Number.isFinite(amount) ||
    amount <= 0
  )
    return 0;
  let damage = amount;
  const lantern = g.towers.some(
    (b) =>
      b.hp > 0 &&
      b.type === "beacon" &&
      Math.hypot(b.x - target.x, b.y - target.y) <= towerStats(b).range,
  );
  if (lantern) damage *= 0.75;
  const guard =
    target.type !== "bulwark" &&
    g.towers
      .filter(
        (b) =>
          b.hp > 0 &&
          b.type === "bulwark" &&
          Math.hypot(b.x - target.x, b.y - target.y) <= towerStats(b).range,
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - target.x, a.y - target.y) -
          Math.hypot(b.x - target.x, b.y - target.y),
      )[0];
  if (guard) {
    const shared = Math.min(guard.hp, damage * 0.65);
    guard.hp -= shared;
    guard.damageAbsorbed += shared;
    guard.hit = 0.25;
    damage -= shared;
    g.effects.push({
      type: "guard",
      x: guard.x,
      y: guard.y - 25,
      tx: target.x,
      ty: target.y - 25,
      life: 0.4,
      max: 0.4,
    });
  }
  const actual = Math.min(target.hp, damage);
  target.hp -= actual;
  target.hit = 0.25;
  return actual;
}
function clearDestroyed(g) {
  if (!g.towers.some((t) => t.hp <= 0)) return;
  for (const t of g.towers)
    if (t.hp <= 0) {
      g.buildingsLost++;
      g.raidAlert = `${TYPES[t.type].name}已损毁，可在原地重建`;
      g.raidAlertTime = 4;
      g.effects.push({
        type: "collapse",
        x: t.x,
        y: t.y,
        life: 1.3,
        max: 1.3,
        color: TYPES[t.type].color,
      });
    }
  g.towers = g.towers.filter((t) => t.hp > 0);
}
function raid(g, e, dt) {
  const def = ENEMIES[e.type];
  e.attackCooldown = Math.max(0, e.attackCooldown - dt);
  if (e.attackWindup > 0) {
    e.attackWindup = Math.max(0, e.attackWindup - dt);
    if (e.attackWindup > 0) return true;
    const target = g.towers.find((t) => t.id === e.raidTarget && t.hp > 0);
    e.raidTarget = null;
    if (!target || Math.hypot(target.x - e.x, target.y - e.y) > def.reach + 8)
      return false;
    const damage =
      def.attack *
      (1 + (g.wave - 1) * 0.045) *
      (g.difficulty === "veteran" ? 1.2 : g.difficulty === "casual" ? 0.75 : 1);
    const victims = e.boss
      ? g.towers.filter(
          (t) => t.hp > 0 && Math.hypot(t.x - target.x, t.y - target.y) < 90,
        )
      : [target];
    for (const t of victims) damageBuilding(g, t, damage);
    g.effects.push({
      type: "raid",
      x: e.x,
      y: e.y - 15,
      tx: target.x,
      ty: target.y - 22,
      life: 0.32,
      max: 0.32,
      heavy: e.boss,
    });
    if (target.hp < target.maxHp * 0.35) {
      g.raidAlert = `${TYPES[target.type].name}耐久告急，诊所或紧急维修可以救援`;
      g.raidAlertTime = 3;
    }
    return false;
  }
  if (e.attackCooldown > 0) return false;
  const targets = g.towers.filter(
    (t) => t.hp > 0 && Math.hypot(t.x - e.x, t.y - e.y) <= def.reach,
  );
  targets.sort((a, b) => {
    if (
      e.type === "armored" &&
      (a.type === "bulwark") !== (b.type === "bulwark")
    )
      return a.type === "bulwark" ? -1 : 1;
    return Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y);
  });
  if (!targets.length) return false;
  e.raidTarget = targets[0].id;
  e.attackCooldown = def.attackInterval;
  e.attackWindup = e.boss ? 0.55 : e.type === "armored" ? 0.35 : 0.18;
  return true;
}
export function clinicPatients(g, t) {
  const stats = towerStats(t);
  return g.towers
    .filter(
      (b) =>
        b.hp > 0 &&
        b.hp < b.maxHp &&
        Math.hypot(b.x - t.x, b.y - t.y) <= stats.range,
    )
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
}
function tickSupport(g, t, dt) {
  t.cooldown = Math.max(0, t.cooldown - dt);
  t.recoil = Math.max(0, t.recoil - dt);
  if (t.cooldown > 0) return;
  const stats = towerStats(t);
  if (t.type === "medic") {
    const targets = clinicPatients(g, t).slice(
      0,
      t.specialization === "triage" ? 2 : 1,
    );
    if (targets.length) {
      for (const b of targets) healBuilding(g, t, b, stats.healing);
      t.cooldown = stats.interval;
      t.recoil = 0.2;
    }
  } else if (t.type === "bulwark" && t.hp < t.maxHp) {
    healBuilding(g, t, t, stats.selfHeal);
    t.cooldown = stats.interval;
  }
}
export function makeEnemy(g, type, distance = 0) {
  const def = ENEMIES[type],
    hp =
      (48 + g.wave * 19) *
      Math.pow(1.105, Math.max(0, g.wave - 1)) *
      def.hp *
      DIFFICULTIES[g.difficulty].hp *
      getLevel(g.level).hp;
  return {
    id: g.id++,
    type,
    ...positionAt(distance, g.level),
    distance,
    hp,
    maxHp: hp,
    speed: (def.speed + g.wave * 0.6) * getLevel(g.level).speed,
    reward: def.reward,
    boss: type === "boss",
    slow: 0,
    slowStrength: 0,
    hit: 0,
    burn: 0,
    burnDps: 0,
    burnOwner: null,
    vulnerable: 0,
    poison: 0,
    poisonStacks: 0,
    poisonDps: 0,
    poisonOwner: null,
    escaped: false,
    attackCooldown: 0,
    attackWindup: 0,
    raidTarget: null,
  };
}
export function damageEnemy(g, e, amount, type, owner = null) {
  if (!e || e.hp <= 0 || e.escaped) return 0;
  const def = ENEMIES[e.type];
  let damage = amount;
  if (type === "arrow") damage *= 1 - def.armor;
  else if (type === "cannon") damage *= 1 - def.armor * 0.35;
  else if (type === "ballista") damage *= 1 - def.armor * 0.5;
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
    g.effects.push({
      type: "heal",
      x: 940,
      y: getLevel(g.level).path.at(-1).y,
      life: 1.3,
      max: 1.3,
    });
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
  if (s.type === "venom" && target) {
    const victims =
      s.spec === "plague"
        ? g.enemies.filter((e) => Math.hypot(e.x - x, e.y - y) < 70)
        : [target];
    for (const e of victims) {
      damageEnemy(g, e, s.damage, "venom", s.owner);
      e.poison = s.spec === "toxin" ? 6 : 4;
      e.poisonStacks = Math.min(
        s.spec === "toxin" ? 5 : 3,
        (e.poisonStacks || 0) + 1,
      );
      e.poisonDps = s.damage * 0.65 * e.poisonStacks;
      e.poisonOwner = s.owner;
    }
    g.effects.push({ type: "poison", x, y, life: 0.45, max: 0.45 });
  } else if (s.type === "cannon") {
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
    damageEnemy(
      g,
      target,
      s.damage * (s.spec === "giant" && target.boss ? 2 : 1),
      s.type,
      s.owner,
    );
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
  const stats = towerStats(t, g);
  t.cooldown = stats.interval;
  t.recoil = 0.2;
  t.shots++;
  t.angle = Math.atan2(target.y - t.y, target.x - t.x);
  if (t.type === "flame") {
    const angle = t.angle,
      cone = t.specialization === "firestorm" ? 0.85 : 0.57;
    for (const e of g.enemies) {
      const a = Math.atan2(e.y - t.y, e.x - t.x),
        delta = Math.atan2(Math.sin(a - angle), Math.cos(a - angle));
      if (
        e.hp > 0 &&
        !e.escaped &&
        Math.hypot(e.x - t.x, e.y - t.y) <= stats.range &&
        Math.abs(delta) <= cone
      ) {
        damageEnemy(g, e, stats.damage, "flame", t.id);
        e.burn = t.specialization === "molten" ? 3 : 1.5;
        e.burnDps = stats.damage * 1.5;
        e.burnOwner = t.id;
      }
    }
    g.effects.push({
      type: "flame",
      x: t.x,
      y: t.y - 25,
      angle,
      radius: stats.range,
      cone,
      life: 0.25,
      max: 0.25,
    });
    return;
  }
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
  if (t.type === "ballista") {
    const dx = Math.cos(t.angle),
      dy = Math.sin(t.angle),
      max = t.specialization === "rail" ? 4 : 2;
    targets = [
      target,
      ...g.enemies
        .filter((e) => {
          const x = e.x - t.x,
            y = e.y - t.y,
            p = x * dx + y * dy;
          return (
            e !== target &&
            e.hp > 0 &&
            !e.escaped &&
            p > 0 &&
            p < stats.range &&
            Math.abs(x * dy - y * dx) < 24
          );
        })
        .sort(
          (a, b) =>
            Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y),
        )
        .slice(0, max - 1),
    ];
  }
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
  g.raidAlertTime = Math.max(0, g.raidAlertTime - dt);
  if (g.phase === "ready") {
    for (const t of g.towers) {
      t.hit = Math.max(0, t.hit - dt);
      if (t.type === "medic" || t.type === "bulwark") tickSupport(g, t, dt);
    }
    return;
  }
  if (g.phase !== "battle") return;
  for (const t of g.towers) t.hit = Math.max(0, t.hit - dt);
  g.time += dt;
  g.spawnTimer -= dt;
  for (const key of Object.keys(g.spellCooldowns))
    g.spellCooldowns[key] = Math.max(0, g.spellCooldowns[key] - dt);
  g.comboTimer = Math.max(0, g.comboTimer - dt);
  if (!g.comboTimer) g.combo = 0;
  const plan = wavePlan(g.wave, g.level);
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
    if (e.poison > 0) {
      e.poison = Math.max(0, e.poison - dt);
      damageEnemy(g, e, (e.poisonDps || 0) * dt, "poison", e.poisonOwner);
      if (!e.poison) e.poisonStacks = 0;
    }
    if (e.hp <= 0) continue;
    const attacking = raid(g, e, dt);
    if (!attacking)
      e.distance +=
        e.speed *
        (e.slow > 0 ? 1 - e.slowStrength * (e.boss ? 0.5 : 1) : 1) *
        dt;
    Object.assign(e, positionAt(e.distance, g.level));
    if (e.distance >= levelPathLength(g.level)) {
      e.escaped = true;
      g.lives = Math.max(0, g.lives - (e.boss ? 5 : 1));
      g.effects.push({
        type: "leak",
        x: 965,
        y: getLevel(g.level).path.at(-1).y,
        life: 0.7,
        max: 0.7,
      });
    }
  }
  clearDestroyed(g);
  for (const shaman of g.enemies)
    if (shaman.type === "shaman" && shaman.hp > 0 && !shaman.escaped)
      for (const e of g.enemies)
        if (
          e.hp > 0 &&
          !e.escaped &&
          e !== shaman &&
          Math.hypot(e.x - shaman.x, e.y - shaman.y) < 95
        )
          e.hp = Math.min(
            e.maxHp,
            e.hp + e.maxHp * 0.016 * dt * (e.poison > 0 ? 0.5 : 1),
          );
  for (const t of g.towers) {
    if (t.type === "beacon") continue;
    t.cooldown -= dt;
    t.recoil = Math.max(0, t.recoil - dt);
    if (t.type === "medic" || t.type === "bulwark") {
      // Support owns its timer, in battle and during intermission.
      t.cooldown += dt;
      tickSupport(g, t, dt);
      continue;
    }
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
    g.phase = g.wave === levelWaveCount(g.level) ? "won" : "ready";
    g.banner = `第 ${g.wave} 波已守住`;
    g.bannerTime = 2.8;
    g.shots = [];
  }
}
export function starRating(g) {
  return g.lives / g.maxLives >= 0.9 ? 3 : g.lives / g.maxLives >= 0.5 ? 2 : 1;
}

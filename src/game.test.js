import {
  LEVEL_IDS,
  getLevel,
  levelWaveCount,
  levelPathLength,
} from "./levels.js";
import test from "node:test";
import assert from "node:assert/strict";
import {
  initialGame,
  placeTower,
  canPlace,
  onPath,
  upgrade,
  upgradeCost,
  specialize,
  setPriority,
  sell,
  startWave,
  makeEnemy,
  towerStats,
  selectTarget,
  damageEnemy,
  castSpell,
  tick,
  waveCount,
  pathLength,
  positionAt,
  starRating,
  buildingAt,
  snapPlot,
  damageBuilding,
  repairCost,
  repairTower,
} from "./game.js";
import {
  TOTAL_WAVES,
  TYPES,
  ENEMIES,
  SPECIALIZATIONS,
  wavePlan,
} from "./content.js";
import {
  persistGame,
  restoreGame,
  recordResult,
  getRecords,
  SAVE_KEY,
} from "./storage.js";
const advance = (g, seconds) => {
  for (let i = 0; i < seconds * 60; i++) tick(g, 1 / 60);
};
function scenario(type = "arrow") {
  const g = initialGame();
  g.wave = 1;
  g.phase = "battle";
  g.spawned = waveCount(1);
  g.gold = 5000;
  const t = placeTower(g, type, 425, 225);
  return { g, t };
}
function stationary(g, type = "slime", x = 425) {
  const e = makeEnemy(g, type, x + 30);
  e.speed = 0;
  e.hp = e.maxHp = 1000;
  g.enemies.push(e);
  return e;
}

test("placement protects road, scenery, tower spacing, and bank balance", () => {
  const g = initialGame();
  assert(onPath(400, 119));
  assert(!placeTower(g, "arrow", 400, 119));
  assert(!canPlace(g, 560, 185));
  assert(!canPlace(g, 650, 395));
  assert(!canPlace(g, 0, 0));
  assert(!canPlace(g, NaN, 225));
  assert(placeTower(g, "arrow", 425, 225));
  assert.equal(g.gold, 240);
  assert(!placeTower(g, "arrow", 425, 225));
  assert(placeTower(g, "storm", 625, 225));
  assert.equal(g.gold, 60);
  assert(!placeTower(g, "arrow", 725, 225));
  assert(!placeTower(g, "unknown", 325, 375));
});
test("upgrade paths charge correct costs, cap at 3, and unlock mutually exclusive specialization", () => {
  const { g, t } = scenario();
  const before = g.gold,
    cost = upgradeCost(t, "damage");
  assert(upgrade(g, t.id, "damage"));
  assert.equal(g.gold, before - cost);
  assert.equal(t.damageLevel, 1);
  assert.equal(t.speedLevel, 0);
  assert(!specialize(g, t.id, "sniper"));
  for (let i = 0; i < 3; i++) upgrade(g, t.id, "speed");
  assert(!upgrade(g, t.id, "speed"));
  assert(specialize(g, t.id, "sniper"));
  assert.equal(towerStats(t).range, TYPES.arrow.range + 60);
  assert(!specialize(g, t.id, "volley"));
  const refund = Math.floor(t.invested * 0.7),
    bank = g.gold;
  assert(sell(g, t.id));
  assert.equal(g.gold, bank + refund);
  assert.equal(g.towers.length, 0);
});
test("target priorities change actual selection among first, strongest, and closest", () => {
  const { g, t } = scenario();
  const a = stationary(g, "slime", 400),
    b = stationary(g, "armored", 440),
    c = stationary(g, "scout", 425);
  a.distance = 600;
  b.hp = 1500;
  c.distance = 100;
  setPriority(g, t.id, "first");
  assert.equal(selectTarget(t, g.enemies).id, a.id);
  setPriority(g, t.id, "strong");
  assert.equal(selectTarget(t, g.enemies).id, b.id);
  setPriority(g, t.id, "close");
  assert.equal(selectTarget(t, g.enemies).id, c.id);
  assert(!setPriority(g, t.id, "invalid"));
});
test("armor and magic resistance create distinct physical and magical counters", () => {
  const g = initialGame();
  g.wave = 3;
  for (const [type, weapon, mult] of [
    ["armored", "arrow", 0.42],
    ["armored", "cannon", 1 - 0.58 * 0.35],
    ["armored", "storm", 1],
    ["wisp", "storm", 0.58],
    ["wisp", "arrow", 1],
  ]) {
    const e = makeEnemy(g, type);
    e.hp = 1000;
    assert(Math.abs(damageEnemy(g, e, 100, weapon) - 100 * mult) < 0.001);
  }
});
test("arrows travel before impact; shots and kills produce economy rewards", () => {
  const { g, t } = scenario();
  const e = stationary(g);
  e.hp = 5;
  const gold = g.gold;
  tick(g, 0.01);
  assert.equal(e.hp, 5);
  assert.equal(g.shots.length, 1);
  advance(g, 0.3);
  assert.equal(g.kills, 1);
  assert.equal(t.kills, 1);
  assert(g.gold >= gold + ENEMIES.slime.reward);
  assert(g.damageDealt > 0);
});
test("cannon splash damages neighboring enemies, while frost slows its target", () => {
  for (const type of ["cannon", "frost"]) {
    const { g } = scenario(type);
    stationary(g, "slime", 415);
    stationary(g, "slime", 435);
    advance(g, 0.6);
    assert(g.enemies.some((e) => e.hp < 1000));
    if (type === "cannon") assert(g.enemies.every((e) => e.hp < 1000));
    else assert(g.enemies.some((e) => e.slow > 0 && e.slowStrength === 0.45));
  }
});
test("chain lightning reaches only nearby enemies and respects specialization cap", () => {
  for (const count of [3, 5]) {
    const { g, t } = scenario("storm");
    if (count === 5) t.specialization = "chain";
    for (let i = 0; i < 6; i++) stationary(g, "slime", 390 + i * 20);
    tick(g, 0.01);
    assert.equal(g.enemies.filter((e) => e.hp < 1000).length, count);
  }
});
test("shamans restore nearby allies; dead shamans cannot heal", () => {
  const g = initialGame();
  g.phase = "battle";
  g.wave = 6;
  g.spawned = waveCount(6);
  const a = stationary(g),
    s = stationary(g, "shaman", 430);
  a.hp = 500;
  tick(g, 0.1);
  assert(a.hp > 500);
  s.hp = 0;
  const hp = a.hp;
  tick(g, 0.1);
  assert.equal(a.hp, hp);
});
test("spells require a battle, valid target, missing health and elapsed cooldown", () => {
  const g = initialGame();
  assert(!castSpell(g, "meteor", { x: 400, y: 119 }));
  g.phase = "battle";
  g.wave = 1;
  g.spawned = waveCount(1);
  const e = stationary(g);
  assert(!castSpell(g, "heal"));
  g.lives = 10;
  assert(castSpell(g, "heal"));
  assert.equal(g.lives, 14);
  assert(!castSpell(g, "heal"));
  assert(!castSpell(g, "meteor", { x: -10, y: 1 }));
  assert(castSpell(g, "meteor", { x: e.x, y: e.y }));
  assert(e.hp < 1000);
  assert(!castSpell(g, "meteor", { x: e.x, y: e.y }));
  const cool = g.spellCooldowns.meteor;
  tick(g, 0.1);
  assert(g.spellCooldowns.meteor < cool);
  g.phase = "ready";
  const readyCool = g.spellCooldowns.meteor;
  tick(g, 0.1);
  assert.equal(g.spellCooldowns.meteor, readyCool);
});
test("authored waves introduce all enemy mechanics and bosses only in waves 4, 8, 12", () => {
  const all = new Set();
  for (let w = 1; w <= TOTAL_WAVES; w++) {
    assert(waveCount(w) > 0);
    for (const type of wavePlan(w)) all.add(type);
    assert.equal(wavePlan(w).includes("boss"), w % 4 === 0);
  }
  assert.equal(all.size, 6);
});
test("an undefended campaign loses; terminal states reject spending and wave launches", () => {
  const g = initialGame();
  for (let w = 0; w < 4 && g.phase !== "lost"; w++) {
    startWave(g);
    for (let i = 0; i < 12000 && g.phase === "battle"; i++) tick(g, 0.05);
  }
  assert.equal(g.phase, "lost");
  assert.equal(g.lives, 0);
  assert(!startWave(g));
  assert(!placeTower(g, "arrow", 425, 225));
});
test("difficulty affects HP and starting health, not reward or tower stats", () => {
  const easy = initialGame("casual"),
    hard = initialGame("veteran");
  assert.equal(easy.lives, 25);
  assert.equal(hard.lives, 15);
  easy.wave = hard.wave = 1;
  assert(makeEnemy(hard, "slime").hp > makeEnemy(easy, "slime").hp);
  assert.equal(
    makeEnemy(hard, "slime").reward,
    makeEnemy(easy, "slime").reward,
  );
});
test("state saves restore real progress safely; malformed or old saves are ignored", () => {
  const data = new Map(),
    storage = {
      getItem: (k) => data.get(k),
      setItem: (k, v) => data.set(k, v),
    };
  const g = initialGame("veteran");
  placeTower(g, "arrow", 425, 225);
  startWave(g);
  advance(g, 2);
  assert(persistGame(storage, g));
  const restored = restoreGame(storage);
  assert.equal(restored.gold, g.gold);
  assert.equal(restored.enemies.length, g.enemies.length);
  assert.equal(restored.phase, "battle");
  assert.equal(restored.difficulty, "veteran");
  assert.equal(restored.towers.length, 1);
  tick(restored, 0.1);
  storage.setItem(SAVE_KEY, "{broken");
  assert.equal(restoreGame(storage), null);
  storage.setItem(SAVE_KEY, JSON.stringify({ ...g, version: 1 }));
  assert.equal(restoreGame(storage), null);
});
test("records persist best score and win count; star rating reflects remaining lives", () => {
  const data = new Map(),
    storage = {
      getItem: (k) => data.get(k),
      setItem: (k, v) => data.set(k, v),
    };
  const g = initialGame();
  g.phase = "won";
  g.score = 1200;
  recordResult(storage, g);
  assert.equal(getRecords(storage).bestScore, 1200);
  assert.equal(getRecords(storage).wins, 1);
  assert.equal(getRecords(storage).levels.forest.stars, 3);
  assert.equal(getRecords(storage).levels.glacier.stars, 0);
  g.score = 300;
  g.phase = "lost";
  recordResult(storage, g);
  assert.equal(getRecords(storage).bestScore, 1200);
  assert.equal(starRating(g), 3);
  g.lives = 11;
  assert.equal(starRating(g), 2);
  g.lives = 1;
  assert.equal(starRating(g), 1);
});
test("every level resolves its own final wave to victory with fully upgraded defenses", () => {
  for (const level of LEVEL_IDS) {
    const g = initialGame("normal", level);
    g.gold = 100000;
    for (let y = 75; y <= 575; y += 50)
      for (let x = 75; x <= 925; x += 50)
        if (canPlace(g, x, y)) {
          const type = Object.keys(TYPES)[g.towers.length % 8];
          const t = placeTower(g, type, x, y);
          for (let i = 0; i < 3; i++) {
            upgrade(g, t.id, "damage");
            upgrade(g, t.id, "speed");
          }
          specialize(g, t.id, SPECIALIZATIONS[type][0].id);
        }
    for (let w = 1; w <= levelWaveCount(level); w++) {
      assert(startWave(g));
      for (let i = 0; i < 14000 && g.phase === "battle"; i++) tick(g, 0.05);
      assert.notEqual(g.phase, "battle");
      assert.notEqual(g.phase, "lost");
    }
    assert.equal(g.phase, "won");
    assert.equal(g.wave, levelWaveCount(level));
    assert(!startWave(g));
    assert.equal(positionAt(levelPathLength(level), level).x, 1030);
  }
});
const CAMPAIGN_PLANS = {
  forest: [
    ["arrow", 425, 225],
    ["cannon", 625, 225],
    ["arrow", 325, 375],
    ["medic", 475, 175],
    ["medic", 525, 375],
    ["venom", 375, 425],
    ["ballista", 675, 175],
    ["flame", 575, 425],
    ["beacon", 375, 175],
  ],
  glacier: [
    ["arrow", 425, 325],
    ["cannon", 575, 325],
    ["arrow", 225, 275],
    ["venom", 775, 275],
    ["ballista", 525, 525],
    ["medic", 475, 275],
    ["frost", 575, 225],
    ["flame", 225, 375],
    ["storm", 775, 375],
  ],
  volcano: [
    ["arrow", 375, 275],
    ["cannon", 625, 325],
    ["arrow", 325, 375],
    ["ballista", 725, 225],
    ["venom", 725, 475],
    ["frost", 425, 375],
    ["beacon", 625, 225],
    ["flame", 725, 375],
    ["medic", 575, 275],
    ["storm", 675, 525],
  ],
};
test("all three normal campaigns are winnable using earned gold and timed spells", () => {
  for (const level of LEVEL_IDS) {
    const g = initialGame("normal", level);
    let next = 0;
    for (let w = 1; w <= levelWaveCount(level); w++) {
      for (let k = 0; k < 3 && next < CAMPAIGN_PLANS[level].length; k++) {
        const [type, x, y] = CAMPAIGN_PLANS[level][next];
        if (g.gold < TYPES[type].cost) break;
        assert(
          placeTower(g, type, x, y),
          `${level}: invalid build ${type} ${x},${y}`,
        );
        next++;
      }
      for (const t of g.towers) if (t.hp < t.maxHp * 0.8) repairTower(g, t.id);
      if (g.towers.length >= 5)
        for (const t of g.towers) {
          for (const kind of ["damage", "speed"])
            if (t[kind + "Level"] < 2) upgrade(g, t.id, kind);
          if (!t.specialization)
            specialize(g, t.id, SPECIALIZATIONS[t.type][0].id);
        }
      assert(startWave(g));
      for (let i = 0; i < 14000 && g.phase === "battle"; i++) {
        if (g.lives <= g.maxLives - 4) castSpell(g, "heal");
        if (g.spellCooldowns.meteor <= 0 && g.enemies.length >= 5) {
          const e =
            g.enemies.find((e) => e.boss) ||
            g.enemies[Math.floor(g.enemies.length / 2)];
          castSpell(g, "meteor", { x: e.x, y: e.y });
        }
        for (const t of g.towers)
          if (t.hp < t.maxHp * 0.3) repairTower(g, t.id);
        tick(g, 0.05);
      }
      assert.notEqual(g.phase, "lost", `${level} lost at wave ${w}`);
      assert.notEqual(g.phase, "battle");
      assert(g.gold >= 0);
    }
    assert.equal(g.phase, "won");
    assert(g.lives > 0);
  }
});
test("advanced specializations change multishot, splash, burn, freeze, vulnerability, and overload damage", () => {
  {
    const { g, t } = scenario("arrow");
    t.specialization = "volley";
    for (let i = 0; i < 4; i++) stationary(g, "slime", 390 + i * 15);
    tick(g, 0.01);
    assert.equal(g.shots.length, 3);
    advance(g, 0.3);
    assert.equal(g.enemies.filter((e) => e.hp < 1000).length, 3);
  }
  {
    const { g, t } = scenario("cannon");
    t.specialization = "siege";
    stationary(g, "slime", 425);
    const far = stationary(g, "slime", 525);
    advance(g, 0.6);
    assert(far.hp < 1000);
  }
  {
    const { g, t } = scenario("cannon");
    t.specialization = "burn";
    const e = stationary(g);
    advance(g, 0.6);
    assert(e.burn > 0);
    t.cooldown = 100;
    const hp = e.hp;
    advance(g, 0.5);
    assert(e.hp < hp);
  }
  for (const spec of ["glacier", "brittle"]) {
    const { g, t } = scenario("frost");
    t.specialization = spec;
    const e = stationary(g);
    advance(g, 0.4);
    if (spec === "glacier") assert.equal(e.slowStrength, 0.7);
    else {
      assert(e.vulnerable > 0);
      const hp = e.hp;
      damageEnemy(g, e, 100, "arrow");
      assert(Math.abs(hp - e.hp - 130) < 0.001);
    }
  }
  {
    const { g, t } = scenario("storm");
    t.specialization = "overload";
    const e = stationary(g);
    tick(g, 0.01);
    assert.equal(e.hp, 924);
  }
});
test("burning enemies killed at the exit reward the player instead of leaking a life", () => {
  const g = initialGame();
  g.wave = 1;
  g.phase = "battle";
  g.spawned = waveCount(1);
  const e = makeEnemy(g, "slime", pathLength - 0.01);
  e.hp = 1;
  e.burn = 1;
  e.burnDps = 100;
  e.speed = 100;
  g.enemies.push(e);
  tick(g, 0.1);
  assert.equal(g.kills, 1);
  assert.equal(g.lives, g.maxLives);
});
test("all ten buildings have two specializations and distinct combat roles", () => {
  assert.equal(Object.keys(TYPES).length, 10);
  for (const type of Object.keys(TYPES)) {
    assert.equal(SPECIALIZATIONS[type].length, 2);
    assert(TYPES[type].cost > 0);
  }
  assert.notEqual(TYPES.venom.role, TYPES.flame.role);
});
test("poison stacks, persists between shots, and its specialization raises the cap", () => {
  const { g, t } = scenario("venom");
  const e = stationary(g);
  e.hp = e.maxHp = 10000;
  advance(g, 3.4);
  assert.equal(e.poisonStacks, 3);
  assert(e.poison > 0);
  t.cooldown = 100;
  const hp = e.hp;
  advance(g, 0.3);
  assert(e.hp < hp);
  t.specialization = "toxin";
  t.cooldown = 0;
  advance(g, 2);
  assert.equal(e.poisonStacks, 5);
  assert(e.poison > 4);
});
test("poison halves shaman healing and plague spreads to nearby enemies", () => {
  const { g, t } = scenario("venom");
  t.cooldown = 100;
  const e = stationary(g);
  e.hp = 500;
  e.poison = 2;
  e.poisonDps = 0;
  stationary(g, "shaman", 430);
  tick(g, 0.1);
  assert(Math.abs(e.hp - 500.8) < 0.001);
  t.specialization = "plague";
  t.cooldown = 0;
  advance(g, 0.4);
  assert(g.enemies.every((e) => e.poison > 0));
});
test("flamethrower damages a forward cone and adds burning without hitting off-angle foes", () => {
  const { g, t } = scenario("flame");
  t.y = 175;
  const a = stationary(g, "slime", 425),
    b = stationary(g, "slime", 450),
    c = stationary(g, "slime", 360);
  tick(g, 0.01);
  assert(a.hp < 1000 && b.hp < 1000);
  assert.equal(c.hp, 1000);
  assert(a.burn > 0);
  assert(g.effects.some((e) => e.type === "flame"));
});
test("ballista pierces two targets by default and four with rail specialization", () => {
  for (const max of [2, 4]) {
    const { g, t } = scenario("ballista");
    t.y = 175;
    if (max === 4) t.specialization = "rail";
    for (let i = 0; i < 4; i++) stationary(g, "slime", 425 + i * 2);
    tick(g, 0.01);
    assert.equal(g.shots.length, max);
    advance(g, 0.3);
    assert.equal(g.enemies.filter((e) => e.hp < 1000).length, max);
  }
});
test("beacon boosts nearby allies, never shoots, and same-type auras do not stack", () => {
  const { g, t } = scenario("arrow");
  const a = placeTower(g, "beacon", 475, 175),
    b = placeTower(g, "beacon", 375, 175);
  assert(a && b);
  const base = towerStats(t),
    buffed = towerStats(t, g);
  assert(Math.abs(buffed.damage - base.damage * 1.2) < 0.001);
  assert(Math.abs(buffed.interval - base.interval / 1.15) < 0.001);
  upgrade(g, a.id, "damage");
  assert(Math.abs(towerStats(t, g).damage - base.damage * 1.28) < 0.001);
  stationary(g);
  advance(g, 1);
  assert.equal(a.shots, 0);
  assert.equal(b.shots, 0);
  sell(g, a.id);
  sell(g, b.id);
  assert.equal(towerStats(t, g).damage, base.damage);
});
test("each stage has its own path, starting economy, spawn point and wave count", () => {
  assert.deepEqual(
    LEVEL_IDS.map((id) => levelWaveCount(id)),
    [8, 10, 12],
  );
  assert.equal(
    new Set(LEVEL_IDS.map((id) => JSON.stringify(getLevel(id).path))).size,
    3,
  );
  for (const level of LEVEL_IDS) {
    const g = initialGame("normal", level);
    assert.equal(g.gold, getLevel(level).gold);
    startWave(g);
    tick(g, 0.01);
    assert.equal(g.enemies[0].y, getLevel(level).path[0].y);
    const center = positionAt(levelPathLength(level) / 2, level);
    assert(onPath(center.x, center.y, 36, level));
    assert(!canPlace(g, center.x, center.y));
  }
});
test("level stars persist independently and later lower ratings never erase a best rating", () => {
  const data = new Map(),
    store = { getItem: (k) => data.get(k), setItem: (k, v) => data.set(k, v) };
  const a = initialGame("normal", "forest");
  a.phase = "won";
  a.score = 5000;
  recordResult(store, a);
  const b = initialGame("normal", "glacier");
  b.phase = "won";
  b.lives = 11;
  b.score = 3000;
  recordResult(store, b);
  a.lives = 1;
  recordResult(store, a);
  const r = getRecords(store);
  assert.equal(r.levels.forest.stars, 3);
  assert.equal(r.levels.glacier.stars, 2);
  assert.equal(r.levels.volcano.stars, 0);
  assert.equal(r.levels.glacier.bestScore, 3000);
  assert.equal(r.bestScore, 5000);
});
test("mid-campaign saves retain stage, advanced towers and active poison status", () => {
  const g = initialGame("normal", "glacier");
  g.gold = 1000;
  placeTower(g, "venom", 425, 325);
  placeTower(g, "beacon", 475, 275);
  startWave(g);
  advance(g, 8);
  const data = new Map(),
    store = { getItem: (k) => data.get(k), setItem: (k, v) => data.set(k, v) };
  persistGame(store, g);
  const restored = restoreGame(store);
  assert.equal(restored.level, "glacier");
  assert.equal(restored.towers[0].type, "venom");
  assert.equal(restored.towers[1].type, "beacon");
  assert.equal(restored.gold, g.gold);
  assert.equal(restored.wave, g.wave);
  tick(restored, 0.1);
});
test("new specialization branches extend fire range, strengthen burn, hunt bosses and widen auras", () => {
  {
    const { g, t } = scenario("flame");
    t.y = 175;
    t.specialization = "firestorm";
    const e = stationary(g, "slime", 540);
    tick(g, 0.01);
    assert(e.hp < 1000);
    assert.equal(towerStats(t).range, 160);
  }
  {
    const { g, t } = scenario("flame");
    t.y = 175;
    t.specialization = "molten";
    const e = stationary(g);
    tick(g, 0.01);
    assert.equal(e.hp, 984);
    assert.equal(e.burn, 3);
  }
  {
    const { g, t } = scenario("ballista");
    t.specialization = "giant";
    const e = stationary(g, "boss");
    advance(g, 0.3);
    assert(Math.abs(e.hp - 851.5) < 0.001);
  }
  {
    const { g, t } = scenario("arrow");
    const b = placeTower(g, "beacon", 625, 225);
    assert.equal(towerStats(t, g).damage, 22);
    b.specialization = "wide";
    assert.equal(towerStats(b).range, 225);
    assert(Math.abs(towerStats(t, g).damage - 26.4) < 0.001);
    b.x = 475;
    b.y = 175;
    b.specialization = "warbanner";
    assert(Math.abs(towerStats(t, g).damage - 29.7) < 0.001);
  }
});

test("enemy attacks have short windups and do not idle during attack cooldown", () => {
  const { g, t } = scenario();
  t.y = 175;
  t.cooldown = 100;
  const e = stationary(g);
  e.speed = 48;
  const before = e.distance;
  tick(g, 0.1);
  assert.equal(t.hp, t.maxHp);
  assert.equal(e.distance, before);
  assert(e.attackWindup > 0);
  advance(g, 0.2);
  assert(t.hp < t.maxHp);
  assert(e.attackCooldown > 0);
  assert(e.distance > before);
  const moved = e.distance;
  advance(g, 0.5);
  assert(e.distance > moved + 20);
});
test("ranged ghosts reach the rear line and boss blows damage neighboring buildings", () => {
  for (const type of ["slime", "wisp"]) {
    const { g, t } = scenario();
    t.cooldown = 100;
    stationary(g, type, 580);
    advance(g, 0.4);
    assert.equal(t.hp < t.maxHp, type === "wisp");
  }
  const { g, t } = scenario();
  t.cooldown = 100;
  const other = placeTower(g, "cannon", 475, 175);
  other.cooldown = 100;
  stationary(g, "boss");
  advance(g, 0.7);
  assert(t.hp < t.maxHp && other.hp < other.maxHp);
});
test("destroyed buildings stop shooting, receive no refund, and their site can be rebuilt", () => {
  const { g, t } = scenario();
  stationary(g);
  damageBuilding(g, t, 100000);
  const bank = g.gold;
  tick(g, 0.1);
  assert(!g.towers.some((b) => b.id === t.id));
  assert.equal(g.gold, bank);
  assert.equal(g.buildingsLost, 1);
  assert.equal(t.shots, 0);
  assert(g.effects.some((e) => e.type === "collapse"));
  assert(!repairTower(g, t.id));
  assert(placeTower(g, "arrow", t.x, t.y));
});
test("shell guards conserve incoming damage, do not recurse, and only one guard shares a hit", () => {
  const { g, t } = scenario();
  const a = placeTower(g, "bulwark", 475, 175),
    b = placeTower(g, "bulwark", 375, 175);
  damageBuilding(g, t, 100);
  assert.equal(t.maxHp - t.hp, 35);
  assert.equal(a.maxHp - a.hp + b.maxHp - b.hp, 65);
  damageBuilding(g, a, 100);
  assert.equal(a.maxHp - a.hp, 165);
  assert.equal(b.maxHp - b.hp, 0);
  a.hp = 2;
  damageBuilding(g, t, 100);
  assert.equal(a.hp, 0);
  assert.equal(t.maxHp - t.hp, 133);
});
test("warm lanterns mitigate damage once and combine with shell sharing without multiplying protection", () => {
  const { g, t } = scenario();
  const a = placeTower(g, "beacon", 475, 175),
    b = placeTower(g, "beacon", 375, 175);
  damageBuilding(g, t, 100);
  assert.equal(t.hp, t.maxHp - 75);
  sell(g, b.id);
  const guard = placeTower(g, "bulwark", 375, 175);
  const before = t.hp,
    hp = guard.hp;
  damageBuilding(g, t, 100);
  assert(Math.abs(before - t.hp - 26.25) < 0.001);
  assert(Math.abs(hp - guard.hp - 48.75) < 0.001);
  assert(a.hp > 0);
});
test("bunny clinics prioritize damage ratio, stay in range, and never attack or overheal", () => {
  const { g, t } = scenario();
  const clinic = placeTower(g, "medic", 475, 175),
    other = placeTower(g, "cannon", 625, 225);
  t.hp = 150;
  other.hp = 100;
  tick(g, 0.01);
  assert.equal(other.hp, 124);
  assert.equal(t.hp, 150);
  assert.equal(clinic.healingDone, 24);
  assert.equal(clinic.shots, 0);
  assert.equal(g.shots.length, 0);
  g.phase = "battle";
  clinic.cooldown = 0;
  t.hp = t.maxHp - 5;
  other.hp = other.maxHp;
  tick(g, 0.01);
  assert.equal(t.hp, t.maxHp);
  assert.equal(clinic.healingDone, 29);
  assert(!setPriority(g, clinic.id, "strong"));
});
test("medical specializations heal two patients or extend reach and potency", () => {
  for (const spec of ["triage", "sanctuary"]) {
    const { g, t } = scenario();
    const clinic = placeTower(g, "medic", 475, 175),
      other = placeTower(g, "cannon", 625, 225);
    clinic.specialization = spec;
    t.hp = 100;
    other.hp = 100;
    tick(g, 0.01);
    if (spec === "triage") assert.equal(t.hp + other.hp, 248);
    else {
      assert.equal(t.hp + other.hp, 236);
      assert.equal(towerStats(clinic).range, 235);
    }
    assert.equal(clinic.shots, 0);
  }
});
test("guard upgrades increase real durability and self-healing specializations recover damage", () => {
  const { g, t } = scenario("bulwark");
  t.hp -= 100;
  const before = t.hp;
  assert(upgrade(g, t.id, "damage"));
  assert.equal(t.hp, before + 180);
  assert.equal(t.maxHp, TYPES.bulwark.hp + 180);
  for (let n = 0; n < 3; n++) upgrade(g, t.id, "speed");
  assert(specialize(g, t.id, "bastion"));
  assert.equal(t.maxHp, TYPES.bulwark.hp + 180 + 450);
  assert.equal(towerStats(t).range, TYPES.bulwark.range + 45);
  t.specialization = "mending";
  t.maxHp = towerStats(t).maxHp;
  t.hp = 100;
  t.cooldown = 0;
  tick(g, 0.01);
  assert.equal(t.hp, 128);
  assert.equal(t.shots, 0);
});
test("emergency repair charges only missing durability and terminal phases reject it", () => {
  const { g, t } = scenario();
  assert(!repairTower(g, t.id));
  t.hp -= 50;
  assert.equal(repairCost(t), 6);
  const bank = g.gold;
  assert(repairTower(g, t.id));
  assert.equal(g.gold, bank - 6);
  assert.equal(t.hp, t.maxHp);
  t.hp -= 20;
  g.gold = 0;
  assert(!repairTower(g, t.id));
  g.gold = 100;
  g.phase = "lost";
  assert(!repairTower(g, t.id));
});
test("v5 saves preserve damage, clinics and raid clocks while v3 campaigns migrate safely", () => {
  const { g, t } = scenario("medic");
  t.hp = 67;
  t.healingDone = 39;
  const e = stationary(g, "wisp");
  e.attackCooldown = 2;
  e.attackWindup = 0.1;
  e.raidTarget = t.id;
  const data = new Map(),
    store = { getItem: (k) => data.get(k), setItem: (k, v) => data.set(k, v) };
  persistGame(store, g);
  const restored = restoreGame(store);
  assert.equal(restored.towers[0].hp, 67);
  assert.equal(restored.towers[0].healingDone, 39);
  assert.equal(restored.enemies[0].attackWindup, 0.1);
  assert.equal(restored.enemies[0].attackCooldown, 2);
  const legacy = JSON.parse(JSON.stringify(g));
  legacy.version = 3;
  for (const t of legacy.towers) {
    delete t.hp;
    delete t.maxHp;
  }
  data.delete(SAVE_KEY);
  store.setItem("evergreen.campaign.v3", JSON.stringify(legacy));
  const migrated = restoreGame(store);
  assert.equal(migrated.version, 5);
  assert.equal(migrated.towers[0].hp, TYPES.medic.hp);
  assert.equal(migrated.gold, g.gold);
});

test("clinics do not revive ruins or heal out-of-range buildings and continue healing during intermission", () => {
  const { g, t } = scenario();
  const clinic = placeTower(g, "medic", 475, 175),
    far = placeTower(g, "frost", 325, 375);
  t.hp = 0;
  far.hp = 100;
  tick(g, 0.01);
  assert(!g.towers.includes(t));
  assert.equal(far.hp, 100);
  assert.equal(clinic.healingDone, 0);
  clinic.hp = 100;
  g.phase = "ready";
  advance(g, 3);
  assert(clinic.hp > 100);
  assert.equal(far.hp, 100);
  const healed = clinic.hp;
  g.phase = "lost";
  advance(g, 3);
  assert.equal(clinic.hp, healed);
});
test("invalid durability in current saves is rejected instead of creating immortal buildings", () => {
  const { g, t } = scenario();
  const data = new Map(),
    store = { getItem: (k) => data.get(k), setItem: (k, v) => data.set(k, v) };
  for (const hp of [-1, null, 999999]) {
    t.hp = hp;
    persistGame(store, g);
    assert.equal(restoreGame(store), null);
  }
});

test("roof and body clicks select the visible building before snapping to a plot", () => {
  const { g, t } = scenario();
  assert.equal(buildingAt(g, { x: 425, y: 170 })?.id, t.id);
  assert.equal(buildingAt(g, { x: 449, y: 190 })?.id, t.id);
  assert.equal(buildingAt(g, { x: 425, y: 230 })?.id, t.id);
  assert.equal(buildingAt(g, { x: 470, y: 225 }), null);
  assert.deepEqual(snapPlot({ x: 439, y: 234 }), { x: 425, y: 225 });
  const rear = placeTower(g, "medic", 375, 175);
  assert(rear);
  assert.equal(buildingAt(g, { x: 400, y: 180 })?.id, t.id);
});
test("in-flight projectiles survive a reload and resolve the same damage", () => {
  const { g, t } = scenario("cannon");
  stationary(g);
  tick(g, 0.1);
  assert(g.shots.length > 0);
  const data = new Map(),
    store = { getItem: (k) => data.get(k), setItem: (k, v) => data.set(k, v) };
  persistGame(store, g);
  const restored = restoreGame(store);
  assert.equal(restored.shots.length, g.shots.length);
  advance(g, 0.6);
  advance(restored, 0.6);
  assert.equal(restored.enemies[0].hp, g.enemies[0].hp);
  assert.equal(restored.damageDealt, g.damageDealt);
  assert.equal(restored.towers[0].cooldown, t.cooldown);
});
test("every wave eventually clears with only non-attacking support buildings", () => {
  for (const level of LEVEL_IDS) {
    const g = initialGame("normal", level);
    g.maxLives = g.lives = 10000;
    for (const type of ["medic", "bulwark"]) {
      let built = false;
      for (let y = 75; y <= 575 && !built; y += 50)
        for (let x = 75; x <= 925 && !built; x += 50)
          if (canPlace(g, x, y)) built = !!placeTower(g, type, x, y);
      assert(built);
    }
    for (let w = 1; w <= levelWaveCount(level); w++) {
      assert(startWave(g));
      for (let i = 0; i < 3000 && g.phase === "battle"; i++) tick(g, 0.05);
      assert.notEqual(
        g.phase,
        "battle",
        `${level} wave ${w} failed to finish within 150s`,
      );
      assert.equal(g.enemies.length, 0);
      assert.equal(g.spawned, waveCount(w, level));
    }
    assert.equal(g.phase, "won");
  }
});
test("killing the final enemy resolves both ordinary and victory wave transitions", () => {
  for (const wave of [1, 8]) {
    const g = initialGame();
    g.phase = "battle";
    g.wave = wave;
    g.spawned = waveCount(wave, g.level);
    const e = makeEnemy(g, "slime", 1000);
    e.hp = 1;
    e.poison = 2;
    e.poisonDps = 100;
    g.enemies.push(e);
    tick(g, 0.05);
    assert.equal(g.phase, wave === 8 ? "won" : "ready");
    assert.equal(g.enemies.length, 0);
    assert.equal(g.kills, 1);
  }
});

test("v4 battles migrate without the old forced raid and march timers", () => {
  const { g, t } = scenario();
  const e = stationary(g);
  e.speed = 48;
  e.attackCooldown = 1;
  e.raidTime = 2;
  e.marchTimer = 5;
  g.version = 4;
  const data = new Map([["evergreen.campaign.v4", JSON.stringify(g)]]),
    store = { getItem: (k) => data.get(k), setItem: (k, v) => data.set(k, v) };
  const restored = restoreGame(store);
  assert.equal(restored.version, 5);
  assert.equal(restored.towers[0].hp, t.hp);
  assert.equal(restored.enemies[0].raidTime, undefined);
  assert.equal(restored.enemies[0].marchTimer, undefined);
  const distance = restored.enemies[0].distance;
  tick(restored, 0.1);
  assert(restored.enemies[0].distance > distance);
});

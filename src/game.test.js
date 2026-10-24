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
  assert(!canPlace(g, 500, 195));
  assert(!canPlace(g, 590, 395));
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
  assert.deepEqual(getRecords(storage), { bestScore: 1200, wins: 1 });
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
test("full 12-wave combat can resolve victory, including mixed enemies and final double boss", () => {
  const g = initialGame();
  g.gold = 100000;
  for (let y = 175; y <= 425; y += 50)
    for (let x = 275; x <= 725; x += 50)
      if (canPlace(g, x, y)) {
        const type = ["arrow", "cannon", "frost", "storm"][g.towers.length % 4];
        const t = placeTower(g, type, x, y);
        for (let i = 0; i < 3; i++) {
          upgrade(g, t.id, "damage");
          upgrade(g, t.id, "speed");
        }
        specialize(g, t.id, SPECIALIZATIONS[type][0].id);
      }
  for (let w = 1; w <= TOTAL_WAVES; w++) {
    assert(startWave(g));
    for (let i = 0; i < 14000 && g.phase === "battle"; i++) tick(g, 0.05);
    assert.notEqual(g.phase, "battle");
    assert.notEqual(g.phase, "lost");
  }
  assert.equal(g.phase, "won");
  assert.equal(g.wave, TOTAL_WAVES);
  assert.equal(
    g.kills,
    Array.from({ length: TOTAL_WAVES }, (_, i) => waveCount(i + 1)).reduce(
      (a, b) => a + b,
      0,
    ),
  );
  assert.equal(positionAt(pathLength).x, 1030);
});
test("normal campaign is winnable with earned gold, eight mixed towers, and timed spells", () => {
  const g = initialGame();
  const positions = [
    ["arrow", 425, 225],
    ["arrow", 325, 375],
    ["frost", 675, 375],
    ["storm", 625, 225],
    ["cannon", 425, 425],
    ["storm", 325, 225],
    ["arrow", 725, 425],
    ["storm", 525, 375],
  ];
  let next = 0;
  for (let w = 1; w <= TOTAL_WAVES; w++) {
    for (let i = 0; i < 2 && next < positions.length; i++) {
      const [type, x, y] = positions[next];
      if (g.gold < TYPES[type].cost) break;
      assert(placeTower(g, type, x, y));
      next++;
    }
    if (g.towers.length >= 5)
      for (const t of g.towers) {
        for (const kind of ["damage", "speed"])
          if (t[kind + "Level"] < 2) upgrade(g, t.id, kind);
        if (!t.specialization)
          specialize(g, t.id, SPECIALIZATIONS[t.type][0].id);
      }
    assert(startWave(g));
    for (let i = 0; i < 12000 && g.phase === "battle"; i++) {
      if (g.lives <= g.maxLives - 4) castSpell(g, "heal");
      if (g.spellCooldowns.meteor <= 0 && g.enemies.length >= 6) {
        const e =
          g.enemies.find((e) => e.boss) ||
          g.enemies[Math.floor(g.enemies.length / 2)];
        castSpell(g, "meteor", { x: e.x, y: e.y });
      }
      tick(g, 0.05);
    }
    assert.notEqual(g.phase, "lost", `lost at wave ${w}`);
    assert.notEqual(g.phase, "battle");
    assert(g.gold >= 0);
  }
  assert.equal(g.phase, "won");
  assert(g.lives > 0);
  assert.equal(g.towers.length, 8);
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

import { LEVELS, LEVEL_IDS, levelWaveCount } from "./levels.js";
import { initialGame, starRating, towerStats } from "./game.js";
import { TYPES, ENEMIES, DIFFICULTIES, TOTAL_WAVES } from "./content.js";
export const SAVE_KEY = "evergreen.campaign.v5";
export const RECORD_KEY = "evergreen.records.v3";
export function restoreGame(storage) {
  try {
    const raw =
      storage.getItem(SAVE_KEY) ||
      storage.getItem("evergreen.campaign.v4") ||
      storage.getItem("evergreen.campaign.v3");
    if (!raw || raw.length > 200000) return null;
    const g = JSON.parse(raw);
    if (
      ![3, 4, 5].includes(g.version) ||
      !LEVELS[g.level] ||
      !DIFFICULTIES[g.difficulty] ||
      !["ready", "battle", "won", "lost"].includes(g.phase)
    )
      return null;
    for (const key of [
      "lives",
      "maxLives",
      "gold",
      "wave",
      "kills",
      "score",
      "spawned",
      "spawnTimer",
      "id",
      "time",
      "visualTime",
      "damageDealt",
    ])
      if (!Number.isFinite(g[key])) return null;
    if (
      g.wave < 0 ||
      g.wave > levelWaveCount(g.level) ||
      g.gold < 0 ||
      g.lives < 0 ||
      g.lives > g.maxLives
    )
      return null;
    if (
      !Array.isArray(g.towers) ||
      g.towers.length > 80 ||
      !Array.isArray(g.enemies) ||
      g.enemies.length > 120
    )
      return null;
    if (
      g.towers.some(
        (t) =>
          !TYPES[t.type] ||
          ![
            "x",
            "y",
            "id",
            "damageLevel",
            "speedLevel",
            "cooldown",
            "invested",
          ].every((k) => Number.isFinite(t[k])),
      )
    )
      return null;
    if (
      g.enemies.some(
        (e) =>
          !ENEMIES[e.type] ||
          !["x", "y", "hp", "maxHp", "distance", "speed", "slow"].every((k) =>
            Number.isFinite(e[k]),
          ),
      )
    )
      return null;
    for (const t of g.towers) {
      const max = towerStats(t).maxHp;
      if (
        g.version >= 4 &&
        (!Number.isFinite(t.hp) ||
          !Number.isFinite(t.maxHp) ||
          t.hp <= 0 ||
          t.hp > t.maxHp ||
          Math.abs(t.maxHp - max) > 0.01)
      )
        return null;
      t.hp = g.version === 3 ? max : t.hp;
      t.maxHp = max;
      t.hit = 0;
      t.healingDone = Math.max(0, Number(t.healingDone) || 0);
      t.damageAbsorbed = Math.max(0, Number(t.damageAbsorbed) || 0);
    }
    for (const e of g.enemies) {
      e.attackCooldown = Math.max(0, Number(e.attackCooldown) || 0);
      e.attackWindup =
        g.version === 5
          ? Math.min(0.55, Math.max(0, Number(e.attackWindup) || 0))
          : 0;
      e.raidTarget =
        g.version === 5 && g.towers.some((t) => t.id === e.raidTarget)
          ? e.raidTarget
          : null;
      if (!e.raidTarget) e.attackWindup = 0;
      delete e.raidTime;
      delete e.marchTimer;
    }
    return {
      ...initialGame(g.difficulty, g.level),
      ...g,
      version: 5,
      shots: (Array.isArray(g.shots) ? g.shots : [])
        .slice(0, 500)
        .filter(
          (s) =>
            TYPES[s.type] &&
            [
              "x",
              "y",
              "tx",
              "ty",
              "damage",
              "age",
              "duration",
              "target",
              "owner",
            ].every((k) => Number.isFinite(s[k])) &&
            s.duration > 0 &&
            s.damage >= 0 &&
            s.age >= 0,
        ),
      effects: [],
      particles: [],
      banner: "",
      bannerTime: 0,
      spellCooldowns: {
        meteor: Math.max(0, Number(g.spellCooldowns?.meteor) || 0),
        heal: Math.max(0, Number(g.spellCooldowns?.heal) || 0),
      },
    };
  } catch {
    return null;
  }
}
export function persistGame(storage, g) {
  try {
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({ ...g, effects: [], particles: [] }),
    );
    return true;
  } catch {
    return false;
  }
}
export function getRecords(storage) {
  const empty = {
    bestScore: 0,
    wins: 0,
    levels: Object.fromEntries(
      LEVEL_IDS.map((id) => [id, { stars: 0, bestScore: 0, wins: 0 }]),
    ),
  };
  try {
    const r = JSON.parse(
      storage.getItem(RECORD_KEY) ||
        storage.getItem("evergreen.records.v2") ||
        "{}",
    );
    empty.bestScore = Math.max(0, Number(r.bestScore) || 0);
    empty.wins = Math.max(0, Number(r.wins) || 0);
    for (const id of LEVEL_IDS) {
      const v = r.levels?.[id];
      if (v)
        empty.levels[id] = {
          stars: Math.min(3, Math.max(0, Number(v.stars) || 0)),
          bestScore: Math.max(0, Number(v.bestScore) || 0),
          wins: Math.max(0, Number(v.wins) || 0),
        };
    }
  } catch {}
  return empty;
}
export function recordResult(storage, g) {
  const record = getRecords(storage),
    id = LEVELS[g.level] ? g.level : "forest",
    prev = record.levels[id];
  const next = {
    bestScore: Math.max(record.bestScore, g.score),
    wins: record.wins + (g.phase === "won" ? 1 : 0),
    levels: {
      ...record.levels,
      [id]: {
        bestScore: Math.max(prev.bestScore, g.score),
        wins: prev.wins + (g.phase === "won" ? 1 : 0),
        stars: Math.max(prev.stars, g.phase === "won" ? starRating(g) : 0),
      },
    },
  };
  try {
    storage.setItem(RECORD_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

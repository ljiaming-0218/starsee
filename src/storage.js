import { initialGame } from "./game.js";
import { TYPES, ENEMIES, DIFFICULTIES, TOTAL_WAVES } from "./content.js";
export const SAVE_KEY = "evergreen.campaign.v2";
export const RECORD_KEY = "evergreen.records.v2";
export function restoreGame(storage) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw || raw.length > 200000) return null;
    const g = JSON.parse(raw);
    if (
      g.version !== 2 ||
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
      g.wave > TOTAL_WAVES ||
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
    return {
      ...initialGame(g.difficulty),
      ...g,
      shots: [],
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
      JSON.stringify({ ...g, shots: [], effects: [], particles: [] }),
    );
    return true;
  } catch {
    return false;
  }
}
export function getRecords(storage) {
  try {
    const r = JSON.parse(storage.getItem(RECORD_KEY) || "{}");
    return { bestScore: Number(r.bestScore) || 0, wins: Number(r.wins) || 0 };
  } catch {
    return { bestScore: 0, wins: 0 };
  }
}
export function recordResult(storage, g) {
  const record = getRecords(storage);
  const next = {
    bestScore: Math.max(record.bestScore, g.score),
    wins: record.wins + (g.phase === "won" ? 1 : 0),
  };
  try {
    storage.setItem(RECORD_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

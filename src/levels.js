export const LEVELS = {
  forest: {
    id: "forest",
    number: "01",
    name: "翡翠林道",
    en: "EMERALD TRAIL",
    biome: "林地",
    color: "#a6d776",
    image: "/art/pixel-forest.png",
    description: "迂回的林间长路，适合建立交叉火力。",
    tip: "在两段道路之间布防，让一座塔覆盖更多路径。",
    gold: 320,
    hp: 1,
    speed: 1,
    waveOrder: [0, 1, 2, 3, 4, 5, 6, 7],
    path: [
      { x: -30, y: 100 },
      { x: 734, y: 100 },
      { x: 734, y: 289 },
      { x: 254, y: 289 },
      { x: 254, y: 490 },
      { x: 1030, y: 490 },
    ],
    areas: [
      { x1: 285, x2: 705, y1: 155, y2: 245 },
      { x1: 285, x2: 705, y1: 345, y2: 440 },
    ],
    obstacles: [
      { x: 560, y: 185, r: 58 },
      { x: 650, y: 395, r: 62 },
      { x: 325, y: 195, r: 38 },
      { x: 440, y: 375, r: 38 },
    ],
  },
  glacier: {
    id: "glacier",
    number: "02",
    name: "霜裂峡谷",
    en: "FROSTBOUND PASS",
    biome: "雪原",
    color: "#90d6ee",
    image: "/art/pixel-glacier.png",
    description: "短促的冰谷回环，重甲与游魂轮番突袭。",
    tip: "路线更短。用控制塔争取时间，弩塔守住直道。",
    gold: 380,
    hp: 1,
    speed: 0.9,
    waveOrder: [1, 2, 4, 5, 6, 7, 8, 9, 10, 11],
    path: [
      { x: -30, y: 191 },
      { x: 315, y: 191 },
      { x: 315, y: 438 },
      { x: 675, y: 438 },
      { x: 675, y: 191 },
      { x: 1030, y: 191 },
    ],
    areas: [{ x1: 75, x2: 925, y1: 65, y2: 585 }],
    obstacles: [{ x: 500, y: 195, r: 67 }],
  },
  volcano: {
    id: "volcano",
    number: "03",
    name: "熔火要塞",
    en: "EMBER CITADEL",
    biome: "火山",
    color: "#eea06b",
    image: "/art/pixel-volcano.png",
    description: "多重折返的焦土防线，精英混编与双巨像压境。",
    tip: "毒沼压制治疗，灯塔增幅核心火力。留好陨火应对巨像。",
    gold: 420,
    hp: 1.1,
    speed: 1,
    waveOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    path: [
      { x: -30, y: 477 },
      { x: 245, y: 477 },
      { x: 245, y: 207 },
      { x: 512, y: 207 },
      { x: 512, y: 422 },
      { x: 815, y: 422 },
      { x: 815, y: 103 },
      { x: 1030, y: 103 },
    ],
    areas: [{ x1: 75, x2: 925, y1: 65, y2: 585 }],
    obstacles: [],
  },
};
export const LEVEL_IDS = Object.keys(LEVELS);
export function getLevel(level = "forest") {
  const id = typeof level === "string" ? level : level?.level;
  return Object.hasOwn(LEVELS, id) ? LEVELS[id] : LEVELS.forest;
}
export function levelWaveCount(level = "forest") {
  return getLevel(level).waveOrder.length;
}
export function levelPathLength(level = "forest") {
  const path = getLevel(level).path;
  return path
    .slice(1)
    .reduce(
      (sum, p, i) => sum + Math.hypot(p.x - path[i].x, p.y - path[i].y),
      0,
    );
}

import { getLevel } from "./levels.js";
import { onPath } from "./game.js";
export const WORLD_PIXEL_WIDTH = 400;
export const WORLD_PIXEL_HEIGHT = 260;
export const CELL = 32;
// Every world asset is rendered through the same native grid and palette.
const palette = [
  "101e24",
  "21312d",
  "32433c",
  "526352",
  "78834d",
  "a5aa62",
  "d2c483",
  "ebe2bb",
  "fff1d2",
  "3c302e",
  "614235",
  "8d5d3f",
  "b88149",
  "d4a15b",
  "efc776",
  "384653",
  "5b7182",
  "8fa6b0",
  "c3d8d8",
  "e5eeeb",
  "264a47",
  "397369",
  "60a092",
  "91c9ba",
  "284e6d",
  "3c7390",
  "64a9bd",
  "a1d7de",
  "302e46",
  "544362",
  "85617c",
  "b5869f",
  "e1b2b6",
  "5d2836",
  "913b46",
  "c85b53",
  "e98565",
  "f3ad7d",
  "6a763e",
  "93a34c",
  "b9cb6a",
  "b66c92",
  "e39fae",
  "352d35",
  "635352",
  "9a8d78",
  "cad0b7",
  "fff7ed",
  "31563b",
  "437748",
  "6b924f",
  "92ae59",
].map((h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)));
export function pixelAtlas(img, cols, rows, cellSize = CELL) {
  const out = document.createElement("canvas");
  out.width = cols * cellSize;
  out.height = rows * cellSize;
  out.cellSize = cellSize;
  const c = out.getContext("2d", { willReadFrequently: true });
  c.imageSmoothingEnabled = false;
  const sw = img.naturalWidth / cols,
    sh = img.naturalHeight / rows;
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      // Insets prevent neighboring atlas fragments from leaking into a sprite.
      const inset = rows === 3 && y > 0 ? 0.04 : 0;
      c.drawImage(
        img,
        x * sw + sw * inset,
        y * sh + sh * inset,
        sw * (1 - inset * 2),
        sh * (1 - inset * 2),
        x * cellSize,
        y * cellSize,
        cellSize,
        cellSize,
      );
    }
  const pixels = c.getImageData(0, 0, out.width, out.height),
    memo = new Map();
  for (let i = 0; i < pixels.data.length; i += 4) {
    const d = pixels.data;
    if (d[i + 3] < 150) {
      d[i + 3] = 0;
      continue;
    }
    const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
    let best = memo.get(key);
    if (!best) {
      let distance = Infinity;
      for (const color of palette) {
        const n =
          (color[0] - d[i]) ** 2 +
          (color[1] - d[i + 1]) ** 2 +
          (color[2] - d[i + 2]) ** 2;
        if (n < distance) {
          distance = n;
          best = color;
        }
      }
      memo.set(key, best);
    }
    d[i] = best[0];
    d[i + 1] = best[1];
    d[i + 2] = best[2];
    d[i + 3] = 255;
  }
  c.putImageData(pixels, 0, 0);
  return out;
}
export function drawCell(c, atlas, index, cols, x, y, w, h = w) {
  const cell = atlas.cellSize || CELL;
  c.drawImage(
    atlas,
    (index % cols) * cell,
    Math.floor(index / cols) * cell,
    cell,
    cell,
    Math.round(x),
    Math.round(y),
    Math.round(w),
    Math.round(h),
  );
}
export function createTerrain(level, tiles) {
  const l = getLevel(level),
    canvas = document.createElement("canvas");
  canvas.width = WORLD_PIXEL_WIDTH;
  canvas.height = WORLD_PIXEL_HEIGHT;
  const c = canvas.getContext("2d");
  c.imageSmoothingEnabled = false;
  const scale = 0.4,
    ground = l.id === "forest" ? 0 : l.id === "glacier" ? 1 : 2;
  c.fillStyle = ["#71864b", "#c3d8d8", "#352d35"][ground];
  c.fillRect(0, 0, 400, 260);
  c.globalAlpha = 0.2;
  for (let y = 0; y < 260; y += 20)
    for (let x = 0; x < 400; x += 20) drawCell(c, tiles, ground, 4, x, y, 20);
  c.globalAlpha = 1;
  const path = () => {
    c.beginPath();
    for (const [i, p] of l.path.entries()) {
      const x = Math.round(p.x * scale),
        y = Math.round(p.y * scale);
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
  };
  c.lineJoin = "miter";
  c.lineCap = "square";
  path();
  c.lineWidth = 30;
  c.strokeStyle = ["#526352", "#8fa6b0", "#614235"][ground];
  c.stroke();
  const road = document.createElement("canvas");
  road.width = road.height = 20;
  const rc = road.getContext("2d");
  rc.imageSmoothingEnabled = false;
  drawCell(rc, tiles, 3, 4, 0, 0, 20);
  path();
  c.lineWidth = 26;
  c.strokeStyle = "#c19a64";
  c.stroke();
  c.globalAlpha = 0.25;
  path();
  c.strokeStyle = c.createPattern(road, "repeat");
  c.stroke();
  c.globalAlpha = 1;
  const inside = (x, y, pad = 0) =>
    l.areas.some(
      (a) =>
        x >= a.x1 - pad &&
        x <= a.x2 + pad &&
        y >= a.y1 - pad &&
        y <= a.y2 + pad,
    );
  const prop = (idx, x, y, size = 80) =>
    drawCell(
      c,
      tiles,
      idx,
      4,
      (x - size / 2) * scale,
      (y - size + 12) * scale,
      size * scale,
    );
  const clearRoad = (x, y) =>
    !l.path.slice(1).some((p, i) => {
      const a = l.path[i];
      return (
        x + 40 >= Math.min(a.x, p.x) - 35 &&
        x - 40 <= Math.max(a.x, p.x) + 35 &&
        y + 12 >= Math.min(a.y, p.y) - 35 &&
        y - 68 <= Math.max(a.y, p.y) + 35
      );
    });
  for (let y = 25; y <= 675; y += 50)
    for (let x = 25; x < 1000; x += 50) {
      const seed = (x * 19 + y * 37) % 101;
      if (
        !inside(x, y, 34) &&
        clearRoad(x, y) &&
        seed < (ground === 0 ? 52 : 38)
      )
        prop(
          ground === 0 ? 4 : ground === 1 ? 5 : 6,
          x,
          y,
          ground === 2 ? 65 : 80,
        );
      else if (
        inside(x, y) &&
        !onPath(x, y, 65, l.id) &&
        seed < 12 &&
        !l.obstacles.some((o) => Math.hypot(x - o.x, y - o.y) < o.r + 15)
      )
        prop(8, x, y, 28);
    }
  for (const [i, o] of l.obstacles.entries()) {
    const size = Math.min(o.r * 1.5, 100);
    prop(
      ground === 1 ? 9 : ground === 2 ? 6 : i === 1 ? 7 : 11,
      o.x,
      o.y + size / 2 - 12,
      size,
    );
  }
  prop(10, 965, l.path.at(-1).y + 5, 85);
  return canvas;
}
